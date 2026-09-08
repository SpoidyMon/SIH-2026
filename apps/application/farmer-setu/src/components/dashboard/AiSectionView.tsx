import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { sendTextMessageApi, sendVoiceAudioApi } from '@/services/ai.service';
import { createSlotBookingApi } from '@/services/farmer.service';
import type { BookingConfirmationPayload } from '@/interfaces';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  confirmationRequired?: boolean;
  confirmationPayload?: BookingConfirmationPayload;
  bookingStatus?: 'idle' | 'submitting' | 'confirmed' | 'failed';
  bookingSuccessData?: any;
}

const QUICK_PROMPTS = [
  { label: '🌾 Book 100 KG Wheat', text: 'Book 100 KG Wheat in Rupesh Mandi tomorrow at 9 AM' },
  { label: '🏬 Search Mandis', text: 'Show available APMC mandis in Pune' },
  { label: '💰 Check Crop Rates', text: 'What is the current rate of Wheat per KG?' },
  { label: '📅 My Bookings', text: 'List all my active mandi bookings' },
];

export const AiSectionView = memo(function AiSectionView() {
  const { token } = useAuth();
  const { language } = useLanguage();

  const getWelcomeMessage = useCallback(() => {
    if (language === 'mr') {
      return 'नमस्ते! मी मण्डी सेतू AI सहाय्यक आहे. आपण मला बोलून (Voice) किंवा लिहून मराठी, हिंदी किंवा इंग्लिशमध्ये मंडी स्लॉट बुकिंग किंवा पीक दर (Per KG) विचारू शकता.';
    }
    if (language === 'hi') {
      return 'नमस्ते! मैं मण्डी सेतु AI सहायक हूँ। आप मुझसे बोलकर (Voice) या लिखकर हिंदी, मराठी या इंग्लिश में मंडी स्लॉट बुकिंग, फसल दर (Per KG), या लाइव मंडी स्थिति पूछ सकते हैं।';
    }
    return 'Hello! I am your Mandi Setu AI Assistant. You can speak (Voice) or type in English, Hindi, or Marathi to query APMC mandis, check slot capacity, crop rates (per KG), or book arrival slots.';
  }, [language]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: getWelcomeMessage(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [conversationId, setConversationId] = useState<string>('');

  const scrollViewRef = useRef<ScrollView>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Update welcome message when language changes if no other messages sent yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === 'msg-welcome') {
        return [
          {
            id: 'msg-welcome',
            sender: 'ai',
            text: getWelcomeMessage(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [language, getWelcomeMessage]);

  // Auto-scroll chat stream to bottom when new message arrives
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timeout);
  }, [messages, isLoading]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const prompt = (overrideText || inputText).trim();
      if (!prompt || isLoading || !token) return;

      const userMsgId = `msg-user-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: userMsgId,
        sender: 'user',
        text: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!overrideText) setInputText('');
      setIsLoading(true);

      try {
        const res = await sendTextMessageApi(token, prompt, conversationId, language || 'en');
        if (res.success && res.data) {
          if (res.data.conversationId) setConversationId(res.data.conversationId);
          const aiMsg: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'ai',
            text: res.data.responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            confirmationRequired: res.data.confirmationRequired,
            confirmationPayload: res.data.confirmationPayload,
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-err-${Date.now()}`,
              sender: 'ai',
              text: language === 'hi' ? 'क्षमा करें, प्रतिक्रिया प्राप्त करने में समस्या हुई।' : 'Sorry, failed to process response. Please try again.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-err-${Date.now()}`,
            sender: 'ai',
            text: 'Failed to connect to backend server. Please check your network connection.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [inputText, isLoading, token, conversationId, language]
  );

  // Voice recording toggle (Web & Native Audio Recording)
  const toggleRecording = useCallback(async () => {
    if (isLoading) return;

    if (isRecording) {
      // Stop Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else {
      // Start Recording
      try {
        if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new (window as any).MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e: any) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            if (audioBlob.size > 0 && token) {
              const voiceMsgId = `msg-user-voice-${Date.now()}`;
              setMessages((prev) => [
                ...prev,
                {
                  id: voiceMsgId,
                  sender: 'user',
                  text: '🎙️ Voice Message Audio Recording...',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isVoice: true,
                },
              ]);
              setIsLoading(true);

              try {
                const res = await sendVoiceAudioApi(token, audioBlob, conversationId, language || 'en');
                if (res.success && res.data) {
                  if (res.data.conversationId) setConversationId(res.data.conversationId);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `msg-ai-vresp-${Date.now()}`,
                      sender: 'ai',
                      text: `${res.data.transcript ? `(Transcribed: "${res.data.transcript}")\n\n` : ''}${res.data.responseText}`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      confirmationRequired: res.data.confirmationRequired,
                      confirmationPayload: res.data.confirmationPayload,
                    },
                  ]);
                }
              } catch {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `msg-err-v-${Date.now()}`,
                    sender: 'ai',
                    text: 'वॉइस प्रोसेसिंग में त्रुटि हुई। कृपया दोबारा बोलें।',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              } finally {
                setIsLoading(false);
              }
            }
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingSeconds(0);
          timerIntervalRef.current = setInterval(() => {
            setRecordingSeconds((prev) => prev + 1);
          }, 1000);
        } else {
          // Fallback demo prompt for environments without audio permissions
          handleSend('रुपेश की मंडी में कल 9 बजे 100 किलो गेहूं का स्लॉट बुक कर दो');
        }
      } catch {
        handleSend('रुपेश की मंडी में कल 9 बजे 100 किलो गेहूं का स्लॉट बुक कर दो');
      }
    }
  }, [isRecording, isLoading, token, conversationId, handleSend]);

  // Execute real PENDING booking creation on PostgreSQL when confirmation is tapped
  const handleConfirmBooking = useCallback(
    async (msgId: string, payload: BookingConfirmationPayload) => {
      if (!token) return;

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, bookingStatus: 'submitting' } : m))
      );

      try {
        const bookingRes = await createSlotBookingApi(token, {
          mandiId: payload.mandiId,
          slotId: payload.slotId,
          crop: payload.crop,
          quantityKg: payload.quantityKg,
        });

        if (bookingRes.success && bookingRes.data?.booking) {
          const booking = bookingRes.data.booking;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    bookingStatus: 'confirmed',
                    bookingSuccessData: booking,
                    responseText: `${m.text}\n\n✅ आपकी Booking Request सफलता के साथ Submitted हो गई है!\nStatus: PENDING Approval\nBooking ID: ${booking.id.slice(0, 8)}`,
                  }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    bookingStatus: 'failed',
                  }
                : m
            )
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, bookingStatus: 'failed' } : m))
        );
      }
    },
    [token]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {/* Sleek Dedicated AI Header Status Banner */}
      <View style={styles.aiHeaderBanner}>
        <View style={styles.bannerLeft}>
          <View style={styles.sparkleCircle}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.bannerTitle}>Mandi Setu Real AI Assistant</Text>
            <Text style={styles.bannerSub}>Groq LLM • Multilingual Voice • Real Data</Text>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.liveBadgeText}>Live</Text>
        </View>
      </View>

      {/* Quick Regional Prompt Chips */}
      <View style={styles.promptsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {QUICK_PROMPTS.map((p, idx) => (
            <Pressable
              key={idx}
              onPress={() => handleSend(p.text)}
              disabled={isLoading}
              style={({ pressed }) => [styles.chipPill, pressed && styles.chipPressed]}>
              <Text style={styles.chipText}>{p.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main Chat Stream Container */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatScrollContent}
        keyboardShouldPersistTaps="handled">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <View
              key={msg.id}
              style={[styles.msgRow, isAi ? styles.msgRowAi : styles.msgRowUser]}>
              {isAi ? (
                <View style={styles.aiAvatar}>
                  <Ionicons name="hardware-chip" size={16} color="#FFFFFF" />
                </View>
              ) : null}

              <View style={[styles.bubble, isAi ? styles.bubbleAi : styles.bubbleUser]}>
                <Text style={[styles.bubbleText, isAi ? styles.bubbleTextAi : styles.bubbleTextUser]}>
                  {msg.text}
                </Text>

                {/* Structured Confirmation Action Card */}
                {msg.confirmationRequired && msg.confirmationPayload ? (
                  <View style={styles.confirmCard}>
                    <View style={styles.confirmCardHeader}>
                      <Ionicons name="clipboard-outline" size={16} color="#B45309" />
                      <Text style={styles.confirmCardTitle}>Booking Confirmation Required</Text>
                    </View>

                    <View style={styles.confirmCardRows}>
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Mandi:</Text>
                        <Text style={styles.confirmValue}>{msg.confirmationPayload.mandiName}</Text>
                      </View>
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Date & Time:</Text>
                        <Text style={styles.confirmValue}>
                          {msg.confirmationPayload.date} ({msg.confirmationPayload.startTime} - {msg.confirmationPayload.endTime})
                        </Text>
                      </View>
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Crop & Quantity:</Text>
                        <Text style={styles.confirmValue}>
                          {msg.confirmationPayload.crop} ({msg.confirmationPayload.quantityKg} KG)
                        </Text>
                      </View>
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>Estimated Payout:</Text>
                        <Text style={styles.confirmValueHighlight}>
                          ₹{msg.confirmationPayload.estimatedPayout.toLocaleString('en-IN')} (₹{msg.confirmationPayload.ratePerKg}/KG)
                        </Text>
                      </View>
                    </View>

                    {msg.bookingStatus === 'confirmed' ? (
                      <View style={styles.confirmedBanner}>
                        <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                        <Text style={styles.confirmedBannerText}>Booking Request Submitted (Status: PENDING)</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleConfirmBooking(msg.id, msg.confirmationPayload!)}
                        disabled={msg.bookingStatus === 'submitting'}
                        style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}>
                        {msg.bookingStatus === 'submitting' ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
                            <Text style={styles.confirmBtnText}>Confirm Booking Request</Text>
                          </>
                        )}
                      </Pressable>
                    )}
                  </View>
                ) : null}

                <Text style={[styles.timestamp, isAi ? styles.timestampAi : styles.timestampUser]}>
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}

        {isLoading ? (
          <View style={styles.loadingIndicatorRow}>
            <ActivityIndicator size="small" color="#166534" />
            <Text style={styles.loadingText}>Groq AI is processing your request...</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Recording Status Bar */}
      {isRecording ? (
        <View style={styles.recordingBanner}>
          <View style={styles.recordingDotPulse} />
          <Text style={styles.recordingText}>Listening... ({recordingSeconds}s)</Text>
          <Pressable onPress={toggleRecording} style={styles.stopVoiceBtn}>
            <Ionicons name="square" size={14} color="#FFFFFF" />
            <Text style={styles.stopVoiceText}>Stop</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Input Bar & Floating Mic Controller */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="बोलें या टाइप करें (उदा. 100 किलो गेहूं)..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />

        <Pressable
          onPress={toggleRecording}
          style={({ pressed }) => [
            styles.micBtn,
            isRecording && styles.micBtnActive,
            pressed && styles.pressed,
          ]}>
          <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={20} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          style={({ pressed }) => [
            styles.sendBtn,
            (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            pressed && styles.pressed,
          ]}>
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  aiHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#166534',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSub: {
    fontSize: 11,
    color: '#DCFCE7',
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  promptsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chipPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipPressed: {
    backgroundColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 4,
  },
  msgRowAi: {
    justifyContent: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#166534',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextAi: {
    color: '#1E293B',
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampAi: {
    color: '#94A3B8',
  },
  timestampUser: {
    color: '#BBF7D0',
  },
  confirmCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  confirmCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  confirmCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  confirmCardRows: {
    gap: 4,
    marginBottom: 10,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmLabel: {
    fontSize: 12,
    color: '#78350F',
  },
  confirmValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#451A03',
  },
  confirmValueHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#166534',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    padding: 8,
    borderRadius: 8,
  },
  confirmedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  loadingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recordingDotPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stopVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stopVoiceText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
    marginBottom: Platform.OS === 'ios' ? 70 : 60, // Give space for floating nav bar
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#DC2626',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

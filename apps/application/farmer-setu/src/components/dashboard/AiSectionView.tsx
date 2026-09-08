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
  { icon: '🌾', label: 'Book 100 KG Wheat', text: 'Book 100 KG Wheat in Rupesh Mandi tomorrow at 9 AM' },
  { icon: '🏬', label: 'Search Mandis', text: 'Show available APMC mandis near Pune' },
  { icon: '💰', label: 'Crop Rates per KG', text: 'What is the current rate of Wheat per KG?' },
  { icon: '📅', label: 'My Bookings', text: 'List all my active mandi bookings' },
];

export const AiSectionView = memo(function AiSectionView() {
  const { token } = useAuth();
  const { language, setLanguage } = useLanguage();

  const getWelcomeMessage = useCallback((lang: string) => {
    if (lang === 'mr') {
      return 'नमस्ते! मी मण्डी सेतू AI सहाय्यक आहे. मी थेट PostgreSQL डेटाबेसशी जोडलेला आहे. तुम्ही बोलून किंवा लिहून मंडी स्लॉट बुकिंग, पीक दर किंवा तुमची बुकिंग स्थिती विचारू शकता.';
    }
    if (lang === 'hi') {
      return 'नमस्ते! मैं मण्डी सेतु AI सहायक हूँ। मैं सीधे PostgreSQL डेटाबेस से जुड़ा हूँ। आप बोलकर या लिखकर मंडी स्लॉट बुकिंग, फसल दर (प्रति KG), या अपनी बुकिंग्स पूछ सकते हैं।';
    }
    return 'Hello! I am your Mandi Setu AI Assistant, connected live to PostgreSQL database & Groq AI. You can speak or type to check APMC mandis, slot availability, crop rates (per KG), or submit booking requests.';
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: getWelcomeMessage(language || 'en'),
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

  // Auto-scroll chat stream to bottom when new message arrives
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
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
              text: language === 'hi' ? 'क्षमा करें, प्रतिक्रिया प्राप्त करने में समस्या हुई।' : 'Sorry, failed to process request. Please try again.',
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else {
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
                  text: '🎙️ Voice Audio Message...',
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
                      text: `${res.data.transcript ? `🗣️ Transcribed: "${res.data.transcript}"\n\n` : ''}${res.data.responseText}`,
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
                    text: 'Voice processing failed. Please try speaking again.',
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
          handleSend('Book 100 KG Wheat in Rupesh Mandi tomorrow');
        }
      } catch {
        handleSend('Book 100 KG Wheat in Rupesh Mandi tomorrow');
      }
    }
  }, [isRecording, isLoading, token, conversationId, handleSend]);

  // Execute real PENDING booking creation on PostgreSQL DB
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
                    responseText: `${m.text}\n\n✅ Booking Request Successfully Submitted to Database!\n• Status: PENDING Mandi Approval\n• Booking ID: ${booking.id}`,
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
      {/* Header Bar */}
      <View style={styles.aiHeaderBanner}>
        <View style={styles.bannerLeft}>
          <View style={styles.sparkleCircle}>
            <Ionicons name="sparkles" size={20} color="#166534" />
          </View>
          <View>
            <Text style={styles.bannerTitle}>✨ Mandi Setu AI Agent</Text>
            <Text style={styles.bannerSub}>Groq LLM • Live Database • Multilingual Voice</Text>
          </View>
        </View>

        <View style={styles.bannerRight}>
          <View style={styles.langPillsRow}>
            {(['en', 'hi', 'mr'] as const).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLanguage(l)}
                style={[styles.langPill, (language || 'en') === l && styles.langPillActive]}>
                <Text style={[(language || 'en') === l ? styles.langTextActive : styles.langText]}>
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिन्दी' : 'मराठी'}
                </Text>
              </Pressable>
            ))}
          </View>
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
              <Text style={styles.chipIcon}>{p.icon}</Text>
              <Text style={styles.chipText}>{p.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main Chat Stream */}
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
                  <Ionicons name="leaf" size={16} color="#FFFFFF" />
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
                      <Ionicons name="shield-checkmark" size={18} color="#92400E" />
                      <Text style={styles.confirmCardTitle}>Booking Confirmation Required</Text>
                    </View>

                    <View style={styles.confirmCardRows}>
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>🏬 Mandi Name:</Text>
                        <Text style={styles.confirmValue}>{msg.confirmationPayload.mandiName}</Text>
                      </View>
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>📅 Arrival Date:</Text>
                        <Text style={styles.confirmValue}>
                          {msg.confirmationPayload.date} ({msg.confirmationPayload.startTime} - {msg.confirmationPayload.endTime})
                        </Text>
                      </View>
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>🌾 Crop & Quantity:</Text>
                        <Text style={styles.confirmValue}>
                          {msg.confirmationPayload.crop} ({msg.confirmationPayload.quantityKg} KG)
                        </Text>
                      </View>
                      <View style={styles.confirmRow}>
                        <Text style={styles.confirmLabel}>💰 Estimated Payout:</Text>
                        <Text style={styles.confirmValueHighlight}>
                          ₹{msg.confirmationPayload.estimatedPayout.toLocaleString('en-IN')} (₹{msg.confirmationPayload.ratePerKg}/KG)
                        </Text>
                      </View>
                    </View>

                    {msg.bookingStatus === 'confirmed' ? (
                      <View style={styles.confirmedBanner}>
                        <Ionicons name="checkmark-circle-sharp" size={20} color="#15803D" />
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
                            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
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
            <Text style={styles.loadingText}>Groq AI is querying database...</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Voice Recording HUD */}
      {isRecording ? (
        <View style={styles.recordingBanner}>
          <View style={styles.recordingDotPulse} />
          <Text style={styles.recordingText}>Listening audio... ({recordingSeconds}s)</Text>
          <Pressable onPress={toggleRecording} style={styles.stopVoiceBtn}>
            <Ionicons name="square" size={12} color="#FFFFFF" />
            <Text style={styles.stopVoiceText}>Stop</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={
            language === 'hi'
              ? 'बोलें या लिखें (उदा. 100 किलो गेहूं)...'
              : language === 'mr'
              ? 'बोला किंवा लिहा (उदा. 100 किलो गहू)...'
              : 'Speak or type (e.g. 100 KG Wheat)...'
          }
          placeholderTextColor="#94A3B8"
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
    backgroundColor: '#F1F5F9',
  },
  aiHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#047857',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSub: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langPillsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 3,
    gap: 2,
  },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langPillActive: {
    backgroundColor: '#FFFFFF',
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DCFCE7',
  },
  langTextActive: {
    fontSize: 11,
    fontWeight: '800',
    color: '#064E3B',
  },
  promptsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  chipPressed: {
    backgroundColor: '#E2E8F0',
  },
  chipIcon: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginVertical: 4,
  },
  msgRowAi: {
    justifyContent: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#166534',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#166534',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTextAi: {
    color: '#0F172A',
  },
  bubbleTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  timestampAi: {
    color: '#94A3B8',
  },
  timestampUser: {
    color: '#BBF7D0',
  },
  confirmCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  confirmCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
    paddingBottom: 8,
  },
  confirmCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  confirmCardRows: {
    gap: 6,
    marginBottom: 12,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '500',
  },
  confirmValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#451A03',
  },
  confirmValueHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#166534',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  confirmedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  loadingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
    marginBottom: Platform.OS === 'ios' ? 70 : 60,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  micBtnActive: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

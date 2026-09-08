import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/theme';
import { sendAiTextMessage, sendAiVoiceMessage, AgentResponsePayload, BookingConfirmationPayload } from '@/services/ai.service';

interface AIAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  onBookingCreated?: (bookingId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  transcript?: string;
  confirmationPayload?: BookingConfirmationPayload | null;
  bookingResult?: any;
}

export const AIAssistantModal = memo(function AIAssistantModal({
  visible,
  onClose,
  onBookingCreated,
}: AIAssistantModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'नमस्ते! मैं आपका मंडी सेतू AI voice assistant हूँ। आप बोलकर या लिखकर स्लॉट बुक कर सकते हैं। (उदा: "रुपेश की मंडी में कल 9 बजे 100 किलो गेहूं बुक कर दो")',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [activeConfirmationPayload, setActiveConfirmationPayload] = useState<BookingConfirmationPayload | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [visible, messages]);

  // Handle sending text input message
  const handleSendText = useCallback(async (customText?: string, isConfirm: boolean = false) => {
    const textToSend = customText || inputQuery.trim();
    if (!textToSend && !isConfirm) return;

    if (!isConfirm) setInputQuery('');
    setIsProcessing(true);

    const userMsgId = `usr_${Date.now()}`;
    if (!isConfirm && textToSend) {
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, sender: 'user', text: textToSend },
      ]);
    }

    try {
      const res = await sendAiTextMessage({
        conversationId: activeConversationId,
        message: textToSend || 'Confirm booking request',
        confirmed: isConfirm,
        idempotencyKey: activeConfirmationPayload?.idempotencyKey,
      });

      if (res.success && res.data) {
        const payload: AgentResponsePayload = res.data;
        if (payload.conversationId) setActiveConversationId(payload.conversationId);
        if (payload.confirmationPayload) setActiveConfirmationPayload(payload.confirmationPayload);
        if (!payload.requiresConfirmation) setActiveConfirmationPayload(null);

        if (payload.bookingResult && onBookingCreated) {
          onBookingCreated(payload.bookingResult.id);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `ast_${Date.now()}`,
            sender: 'assistant',
            text: payload.responseText,
            confirmationPayload: payload.confirmationPayload,
            bookingResult: payload.bookingResult,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'assistant',
            text: res.message || 'क्षमा करें, बुकिंग दर्ज करने में समस्या आई। कृपया पुनः प्रयास करें।',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [inputQuery, activeConversationId, activeConfirmationPayload, onBookingCreated]);

  // Voice recording toggle (Web & Native abstraction)
  const startRecording = useCallback(async () => {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new (window as any).MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event: any) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          stream.getTracks().forEach((track) => track.stop());

          setIsProcessing(true);
          try {
            const res = await sendAiVoiceMessage({
              audioBlob,
              conversationId: activeConversationId,
            });

            if (res.success && res.data) {
              const payload: AgentResponsePayload = res.data;
              if (payload.conversationId) setActiveConversationId(payload.conversationId);
              if (payload.confirmationPayload) setActiveConfirmationPayload(payload.confirmationPayload);
              if (!payload.requiresConfirmation) setActiveConfirmationPayload(null);

              if (payload.bookingResult && onBookingCreated) {
                onBookingCreated(payload.bookingResult.id);
              }

              setMessages((prev) => [
                ...(payload.transcript
                  ? [{ id: `usr_${Date.now()}`, sender: 'user' as const, text: payload.transcript }]
                  : []),
                {
                  id: `ast_${Date.now()}`,
                  sender: 'assistant',
                  text: payload.responseText,
                  confirmationPayload: payload.confirmationPayload,
                  bookingResult: payload.bookingResult,
                },
              ]);
            }
          } catch (err) {
            setMessages((prev) => [
              ...prev,
              {
                id: `err_${Date.now()}`,
                sender: 'assistant',
                text: 'आवाज़ रिकॉर्ड करने में विफलता हुई।',
              },
            ]);
          } finally {
            setIsProcessing(false);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (err) {
        console.warn('Web microphone permission denied:', err);
      }
    } else {
      // Mobile native toggle simulation fallback
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        handleSendText('रुपेश की मंडी में कल 9 बजे 100 किलो गेहूं का स्लॉट बुक कर दो');
      }, 2500);
    }
  }, [activeConversationId, handleSendText, onBookingCreated]);

  const stopRecording = useCallback(() => {
    if (Platform.OS === 'web' && mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(false);
    }
  }, [isRecording]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={18} color="#C8F52F" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Agrovia AI Voice Assistant</Text>
                <Text style={styles.headerSubtitle}>Multilingual Voice Slot Booking</Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={ThemeColors.textSecondary} />
            </Pressable>
          </View>

          {/* Conversation Body */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatScrollContent}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.sender === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userText : styles.assistantText,
                  ]}
                >
                  {msg.text}
                </Text>

                {/* Booking Confirmation Card Component */}
                {msg.confirmationPayload && (
                  <View style={styles.confirmationCard}>
                    <View style={styles.cardHeader}>
                      <Ionicons name="clipboard" size={16} color="#059669" />
                      <Text style={styles.cardHeaderTitle}>Booking Confirmation Summary</Text>
                    </View>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Mandi:</Text>
                      <Text style={styles.cardValue}>{msg.confirmationPayload.mandiName}</Text>
                    </View>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Date & Time:</Text>
                      <Text style={styles.cardValue}>
                        {msg.confirmationPayload.date} ({msg.confirmationPayload.startTime} - {msg.confirmationPayload.endTime})
                      </Text>
                    </View>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Crop & Weight:</Text>
                      <Text style={styles.cardValue}>
                        {msg.confirmationPayload.crop} ({msg.confirmationPayload.quantityKg} KG)
                      </Text>
                    </View>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Estimated Value:</Text>
                      <Text style={[styles.cardValue, styles.highlightValue]}>
                        ₹{msg.confirmationPayload.estimatedPayout.toLocaleString('en-IN')} (@ ₹{msg.confirmationPayload.ratePerKg}/KG)
                      </Text>
                    </View>

                    <View style={styles.cardActions}>
                      <Pressable
                        style={[styles.confirmBtn, isProcessing && styles.disabledBtn]}
                        disabled={isProcessing}
                        onPress={() => handleSendText('हाँ, बुक कर दो', true)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                        <Text style={styles.confirmBtnText}>Confirm Booking Request</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Booking Result Success Banner */}
                {msg.bookingResult && (
                  <View style={styles.successBanner}>
                    <Ionicons name="checkmark-done-circle" size={24} color="#059669" />
                    <View style={styles.successBannerText}>
                      <Text style={styles.successTitle}>Booking Request Submitted!</Text>
                      <Text style={styles.successSub}>
                        Status: PENDING | Token ID: {msg.bookingResult.token}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {isProcessing && (
              <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.loadingText}>AI thinking & querying mandis...</Text>
              </View>
            )}
          </ScrollView>

          {/* Voice Mic & Input Footer */}
          <View style={styles.footer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="बोलें या संदेश लिखें (e.g. 100 kg wheat)"
                placeholderTextColor={ThemeColors.textMuted}
                value={inputQuery}
                onChangeText={setInputQuery}
                onSubmitEditing={() => handleSendText()}
              />
              <Pressable
                style={[styles.sendBtn, !inputQuery.trim() && styles.disabledSendBtn]}
                disabled={!inputQuery.trim() || isProcessing}
                onPress={() => handleSendText()}
              >
                <Ionicons name="send" size={16} color="#FFF" />
              </Pressable>
            </View>

            <View style={styles.micRow}>
              <Pressable
                style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons name={isRecording ? 'stop' : 'mic'} size={28} color="#C8F52F" />
              </Pressable>
              <Text style={styles.micHint}>
                {isRecording ? '🔴 Listening... Tap to stop' : 'Tap mic & speak in Hindi / Marathi / English'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#0B2D1B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(200, 245, 47, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#A0AEC0',
  },
  closeButton: {
    padding: 4,
  },
  chatScroll: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  chatScrollContent: {
    paddingVertical: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#059669',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userText: {
    color: '#FFF',
    fontWeight: '500',
  },
  assistantText: {
    color: '#1E293B',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  confirmationCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065F46',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  cardLabel: {
    fontSize: 11,
    color: '#475569',
  },
  cardValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  highlightValue: {
    color: '#059669',
  },
  cardActions: {
    marginTop: 10,
  },
  confirmBtn: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  successBanner: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successBannerText: {
    flex: 1,
  },
  successTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065F46',
  },
  successSub: {
    fontSize: 10,
    color: '#047857',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#0F172A',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSendBtn: {
    backgroundColor: '#CBD5E1',
  },
  micRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  micBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0B2D1B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  micBtnRecording: {
    backgroundColor: '#DC2626',
  },
  micHint: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});

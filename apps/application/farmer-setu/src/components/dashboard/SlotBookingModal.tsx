import React, { memo, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { translateMandiName, translateCropName } from '@/constants/translations';
import { createFarmerBookingApi } from '@/services/farmer.service';
import type { MandiItem, MandiSlotData } from '@/interfaces';

interface SlotBookingModalProps {
  visible: boolean;
  mandi: MandiItem | null;
  token?: string;
  onClose: () => void;
  onBookingSuccess?: (booking: any) => void;
}

export const SlotBookingModal = memo(function SlotBookingModal({
  visible,
  mandi,
  token,
  onClose,
  onBookingSuccess,
}: SlotBookingModalProps) {
  const { language, t } = useLanguage();

  // Form states
  const [selectedSlot, setSelectedSlot] = useState<MandiSlotData | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [quantityQuintals, setQuantityQuintals] = useState<string>('10');
  const [vehicleNumber, setVehicleNumber] = useState<string>('MH 12 DE 4821');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Pass State
  const [generatedBooking, setGeneratedBooking] = useState<any | null>(null);

  // Reset and initialize when mandi changes
  useEffect(() => {
    if (mandi) {
      setGeneratedBooking(null);
      setErrorMessage(null);

      // Default slot
      if (mandi.slots && mandi.slots.length > 0) {
        setSelectedSlot(mandi.slots[0]);
      } else {
        setSelectedSlot(null);
      }

      // Default crop
      const initialCrop =
        mandi.acceptedCrops && mandi.acceptedCrops.length > 0
          ? mandi.acceptedCrops[0]
          : mandi.topCrop
          ? mandi.topCrop.split(',')[0].trim()
          : 'Produce';
      setSelectedCrop(initialCrop);
    }
  }, [mandi, visible]);

  if (!mandi) return null;

  const handleConfirmBooking = async () => {
    if (!token) {
      setErrorMessage('Farmer login session missing. Please log in again.');
      return;
    }

    const qty = parseFloat(quantityQuintals);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Please enter a valid produce quantity in quintals.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const slotId = selectedSlot?.id || 'default-slot-1';

    try {
      const res = await createFarmerBookingApi(token, {
        mandiProfileId: mandi.id,
        slotId,
        crop: selectedCrop,
        variety: 'Grade-A Produce',
        quantityQuintals: qty,
        vehicleNumber: vehicleNumber.trim() || undefined,
      });

      if (res.success && res.data?.booking) {
        setGeneratedBooking(res.data.booking);
        onBookingSuccess?.(res.data.booking);
      } else {
        setErrorMessage(res.message || 'Failed to generate gate booking pass.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while booking arrival slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setGeneratedBooking(null);
    setErrorMessage(null);
    onClose();
  };

  const qrImageUrl = generatedBooking
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        generatedBooking.token || generatedBooking.id
      )}`
    : null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerInfo}>
              <View style={styles.mandiCodeRow}>
                <Text style={styles.mandiName}>
                  {translateMandiName(mandi.name, language)}
                </Text>
                <View style={styles.mandiCodeBadge}>
                  <Text style={styles.mandiCodeText}>
                    {mandi.mandiCode || 'MAN001'}
                  </Text>
                </View>
              </View>
              <Text style={styles.mandiAddress}>
                {mandi.address || mandi.district}
                {mandi.pincode ? ` • PIN ${mandi.pincode}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {generatedBooking ? (
              /* ═══ SUCCESS / DIGITAL PASS VIEW ═══ */
              <View style={styles.passContainer}>
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={26} color="#15803D" />
                  <View style={styles.successBannerTextCol}>
                    <Text style={styles.successTitle}>Arrival Slot Confirmed!</Text>
                    <Text style={styles.successSub}>
                      Official gate token generated. Show QR at APMC gate toll.
                    </Text>
                  </View>
                </View>

                {/* Digital Gate Pass Card */}
                <View style={styles.passCard}>
                  <View style={styles.passCardHeader}>
                    <View>
                      <Text style={styles.passMandiTitle}>
                        {translateMandiName(mandi.name, language)}
                      </Text>
                      <Text style={styles.passYardCode}>
                        APMC ID: {mandi.mandiCode || 'MAN001'} • Gate Toll 01
                      </Text>
                    </View>
                    <View style={styles.queueBadge}>
                      <Text style={styles.queueBadgeText}>
                        Q#{String(generatedBooking.queueNumber ?? 1).padStart(3, '0')}
                      </Text>
                    </View>
                  </View>

                  {/* Big Token Number */}
                  <View style={styles.tokenHighlightBox}>
                    <Text style={styles.tokenLabel}>GATE PASS TOKEN</Text>
                    <Text style={styles.tokenValue}>
                      {generatedBooking.token || '8SEP-10AM-001'}
                    </Text>
                  </View>

                  {/* Visual QR Code Pass */}
                  {qrImageUrl && (
                    <View style={styles.qrWrapper}>
                      <Image
                        source={{ uri: qrImageUrl }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.qrCaption}>Scan at Electronic Gate Terminal</Text>
                    </View>
                  )}

                  {/* Pass Meta Information */}
                  <View style={styles.passMetaGrid}>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Arrival Date:</Text>
                      <Text style={styles.metaValue}>
                        {generatedBooking.slot?.date || new Date().toISOString().split('T')[0]}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Window:</Text>
                      <Text style={styles.metaValue}>
                        {generatedBooking.slot
                          ? `${generatedBooking.slot.startTime} - ${generatedBooking.slot.endTime}`
                          : '08:00 AM - 11:30 AM'}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Crop / Intake:</Text>
                      <Text style={styles.metaValue}>
                        {generatedBooking.crop} ({generatedBooking.quantityQuintals} Qtl /{' '}
                        {generatedBooking.quantityQuintals * 100} KG)
                      </Text>
                    </View>
                    {generatedBooking.vehicleNumber && (
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Vehicle:</Text>
                        <Text style={[styles.metaValue, styles.vehicleText]}>
                          {generatedBooking.vehicleNumber}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Done Button */}
                <Pressable onPress={handleClose} style={styles.primaryActionBtn}>
                  <Text style={styles.primaryActionBtnText}>Done • View in Bookings</Text>
                </Pressable>
              </View>
            ) : (
              /* ═══ BOOKING CONFIGURATION FORM ═══ */
              <View style={styles.formContainer}>
                {errorMessage && (
                  <View style={styles.errorAlert}>
                    <Ionicons name="alert-circle" size={18} color="#B91C1C" />
                    <Text style={styles.errorAlertText}>{errorMessage}</Text>
                  </View>
                )}

                {/* 1. Slot Window Selection */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Select Arrival Window & Date</Text>
                  {mandi.slots && mandi.slots.length > 0 ? (
                    <View style={styles.slotsGrid}>
                      {mandi.slots.map((s) => {
                        const isSelected = selectedSlot?.id === s.id;
                        return (
                          <Pressable
                            key={s.id}
                            onPress={() => setSelectedSlot(s)}
                            style={[
                              styles.slotCard,
                              isSelected && styles.slotCardSelected,
                            ]}>
                            <View style={styles.slotCardHeader}>
                              <Ionicons
                                name="time-outline"
                                size={14}
                                color={isSelected ? '#15803D' : '#6B7280'}
                              />
                              <Text
                                style={[
                                  styles.slotTimeText,
                                  isSelected && styles.slotTimeTextSelected,
                                ]}>
                                {s.startTime} - {s.endTime}
                              </Text>
                            </View>
                            <Text style={styles.slotDateText}>{s.date}</Text>
                            <Text style={styles.slotCapText}>
                              {s.availableBookings ?? 10} slots open
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    /* Default Standard Windows if none configured */
                    <View style={styles.slotsGrid}>
                      {[
                        { id: 'def-1', time: '08:00 AM - 11:30 AM', label: 'Morning Slot' },
                        { id: 'def-2', time: '11:30 AM - 02:30 PM', label: 'Midday Slot' },
                        { id: 'def-3', time: '02:30 PM - 06:00 PM', label: 'Afternoon Slot' },
                      ].map((def) => {
                        const isSelected = selectedSlot?.id === def.id;
                        return (
                          <Pressable
                            key={def.id}
                            onPress={() =>
                              setSelectedSlot({
                                id: def.id,
                                mandiProfileId: mandi.id,
                                crop: selectedCrop,
                                date: new Date().toISOString().split('T')[0],
                                startTime: def.time.split(' - ')[0],
                                endTime: def.time.split(' - ')[1],
                                totalCapacityQuintals: 500,
                                bookedCapacityQuintals: 0,
                                maxFarmers: 10,
                                bookedFarmers: 0,
                                availableBookings: 10,
                                isActive: true,
                              })
                            }
                            style={[
                              styles.slotCard,
                              isSelected && styles.slotCardSelected,
                            ]}>
                            <View style={styles.slotCardHeader}>
                              <Ionicons
                                name="time-outline"
                                size={14}
                                color={isSelected ? '#15803D' : '#6B7280'}
                              />
                              <Text
                                style={[
                                  styles.slotTimeText,
                                  isSelected && styles.slotTimeTextSelected,
                                ]}>
                                {def.time}
                              </Text>
                            </View>
                            <Text style={styles.slotDateText}>{def.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* 2. Crop Selection */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Produce Commodity</Text>
                  <View style={styles.cropsRow}>
                    {(
                      mandi.acceptedCrops ||
                      (mandi.topCrop ? mandi.topCrop.split(',').map((s) => s.trim()) : ['Tomato', 'Onion', 'Wheat'])
                    ).map((c) => {
                      const isSelected = selectedCrop.toLowerCase() === c.toLowerCase();
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setSelectedCrop(c)}
                          style={[
                            styles.cropChip,
                            isSelected && styles.cropChipSelected,
                          ]}>
                          <Ionicons
                            name="leaf"
                            size={12}
                            color={isSelected ? '#FFFFFF' : '#15803D'}
                          />
                          <Text
                            style={[
                              styles.cropChipText,
                              isSelected && styles.cropChipTextSelected,
                            ]}>
                            {translateCropName(c, language)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Quantity Input */}
                <View style={styles.formSection}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.sectionLabel}>Expected Quantity (Quintals)</Text>
                    <Text style={styles.calcSubText}>
                      {parseFloat(quantityQuintals || '0') * 100} KG
                    </Text>
                  </View>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={quantityQuintals}
                      onChangeText={setQuantityQuintals}
                      placeholder="e.g. 10"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text style={styles.inputSuffix}>Qtl (100kg)</Text>
                  </View>
                </View>

                {/* 4. Vehicle Number */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Vehicle / Tractor Number</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={[styles.textInput, styles.vehicleInput]}
                      autoCapitalize="characters"
                      value={vehicleNumber}
                      onChangeText={setVehicleNumber}
                      placeholder="e.g. MH 12 AB 1234"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Ionicons name="car-outline" size={18} color="#6B7280" />
                  </View>
                </View>

                {/* Confirm Action Button */}
                <Pressable
                  onPress={handleConfirmBooking}
                  disabled={isSubmitting}
                  style={[
                    styles.primaryActionBtn,
                    isSubmitting && styles.btnDisabled,
                  ]}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="ticket-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryActionBtnText}>
                        Confirm Slot &amp; Generate QR Pass
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: ThemeColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  mandiCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mandiName: {
    fontSize: 16,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
  },
  mandiCodeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  mandiCodeText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#15803D',
  },
  mandiAddress: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingVertical: 16,
    gap: 16,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  formSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    flex: 1,
    minWidth: '46%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 2,
  },
  slotCardSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  slotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  slotTimeTextSelected: {
    color: '#15803D',
  },
  slotDateText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  slotCapText: {
    fontSize: 9,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  cropsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cropChipSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  cropChipTextSelected: {
    color: '#FFFFFF',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.textPrimary,
  },
  vehicleInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  inputSuffix: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Pass View Styles
  passContainer: {
    paddingVertical: 16,
    gap: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  successBannerTextCol: {
    flex: 1,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532D',
  },
  successSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
  passCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 14,
  },
  passCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
  },
  passMandiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  passYardCode: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  queueBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  queueBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B45309',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tokenHighlightBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 1,
  },
  tokenValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.5,
  },
  qrWrapper: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  qrCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  passMetaGrid: {
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  vehicleText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#059669',
  },
});

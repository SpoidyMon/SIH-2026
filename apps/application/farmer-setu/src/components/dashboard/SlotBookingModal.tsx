import React, { memo, useState, useEffect, useMemo, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { translateMandiName, translateCropName } from '@/constants/translations';
import { createFarmerBookingApi } from '@/services/farmer.service';
import type { MandiItem, MandiSlotData, CropBookingItem } from '@/interfaces';

interface SlotBookingModalProps {
  visible: boolean;
  mandi: MandiItem | null;
  token?: string;
  onClose: () => void;
  onBookingSuccess?: (booking: any) => void;
}

interface CropSelectionState {
  crop: string;
  variety: string;
  quantityKg: string;
  ratePerKg: number;
  selected: boolean;
}

export function isSlotExpired(dateStr?: string, endTimeStr?: string, startTimeStr?: string): boolean {
  if (!dateStr) return false;

  const now = new Date();
  let targetDate = new Date();
  const dLower = dateStr.trim().toLowerCase();
  if (dLower === 'today') {
    // keep current date
  } else if (dLower === 'tomorrow') {
    targetDate.setDate(targetDate.getDate() + 1);
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slotDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  if (slotDateOnly < todayOnly) return true;
  if (slotDateOnly > todayOnly) return false;

  const timeToCheck = endTimeStr || startTimeStr;
  if (!timeToCheck) return false;

  let hours = 0;
  let minutes = 0;
  const match = timeToCheck.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const meridiem = match[3] ? match[3].toUpperCase() : null;
    if (meridiem === 'PM' && h < 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    hours = h;
    minutes = m;
  }

  const slotEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  return now.getTime() > slotEndTime.getTime();
}

export const SlotBookingModal = memo(function SlotBookingModal({
  visible,
  mandi,
  token,
  onClose,
  onBookingSuccess,
}: SlotBookingModalProps) {
  const { language } = useLanguage();
  const scrollRef = useRef<ScrollView>(null);

  // Selected arrival slot
  const [selectedSlot, setSelectedSlot] = useState<MandiSlotData | null>(null);

  const handleSelectSlot = (s: MandiSlotData) => {
    setSelectedSlot(s);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 320, animated: true });
    }, 100);
  };

  // Multi-crop states
  const [cropItems, setCropItems] = useState<CropSelectionState[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Submitted Booking State (Initial status: PENDING)
  const [generatedBooking, setGeneratedBooking] = useState<any | null>(null);

  // Extract base rate from modal price string (e.g. "₹2,450/qtl" -> 24.50/kg or default 25/kg)
  const defaultRatePerKg = useMemo(() => {
    if (mandi?.modalPrice) {
      const match = mandi.modalPrice.replace(/[^\d.]/g, '');
      const num = parseFloat(match);
      if (!isNaN(num) && num > 0) {
        return Math.round((num / 100) * 100) / 100; // Qtl to Kg
      }
    }
    return 25.0;
  }, [mandi]);

  // Reset and initialize when mandi changes or opens
  useEffect(() => {
    if (mandi && visible) {
      setGeneratedBooking(null);
      setErrorMessage(null);

      // Default slot selection: pick first non-expired active slot
      if (mandi.slots && mandi.slots.length > 0) {
        const validSlot = mandi.slots.find(
          (s) => !(s as any).isExpired && !isSlotExpired(s.date, s.endTime, s.startTime)
        );
        setSelectedSlot(validSlot || mandi.slots[0]);
      } else {
        setSelectedSlot(null);
      }

      // Initialize crops list from mandi accepted crops or slot allowed crops
      const sourceCrops: string[] =
        mandi.acceptedCrops && mandi.acceptedCrops.length > 0
          ? mandi.acceptedCrops
          : mandi.topCrop
          ? mandi.topCrop.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Wheat', 'Paddy', 'Mustard', 'Tomato'];

      const initialCrops: CropSelectionState[] = sourceCrops.map((cropName, index) => ({
        crop: cropName,
        variety: 'Grade-A Standard',
        quantityKg: index === 0 ? '500' : '200',
        ratePerKg: defaultRatePerKg,
        selected: index === 0, // Select first crop by default
      }));

      setCropItems(initialCrops);
    }
  }, [mandi, visible, defaultRatePerKg]);

  // Update crop items whenever selected slot changes
  useEffect(() => {
    if (!mandi) return;

    let targetCrops: Array<{ crop: string; ratePerKg: number }> = [];

    if (selectedSlot) {
      if (selectedSlot.allowedCrops && Array.isArray(selectedSlot.allowedCrops)) {
        (selectedSlot.allowedCrops as any[]).forEach((item) => {
          if (item?.crop) {
            targetCrops.push({
              crop: item.crop,
              ratePerKg: Number(item.ratePerKg) || defaultRatePerKg,
            });
          }
        });
      } else if (selectedSlot.crop) {
        selectedSlot.crop.split(',').forEach((c) => {
          const name = c.trim();
          targetCrops.push({
            crop: name,
            ratePerKg: defaultRatePerKg,
          });
        });
      }
    }

    if (targetCrops.length === 0) {
      const sourceCrops =
        mandi.acceptedCrops && mandi.acceptedCrops.length > 0
          ? mandi.acceptedCrops
          : mandi.topCrop
          ? mandi.topCrop.split(',').map((s) => s.trim())
          : ['Wheat', 'Mustard'];
      targetCrops = sourceCrops.map((c) => ({ crop: c, ratePerKg: defaultRatePerKg }));
    }

    const updatedItems: CropSelectionState[] = targetCrops.map((item, index) => ({
      crop: item.crop,
      variety: 'Grade-A Standard',
      quantityKg: index === 0 ? '500' : '200',
      ratePerKg: item.ratePerKg,
      selected: index === 0,
    }));

    setCropItems(updatedItems);
  }, [selectedSlot, mandi, defaultRatePerKg]);

  // Calculate totals across selected crops
  const selectedCropsList = useMemo(() => {
    return cropItems.filter((c) => c.selected);
  }, [cropItems]);

  const totalQuantityKg = useMemo(() => {
    return selectedCropsList.reduce((acc, c) => {
      const q = parseFloat(c.quantityKg);
      return acc + (isNaN(q) ? 0 : q);
    }, 0);
  }, [selectedCropsList]);

  const totalEstimatedPayout = useMemo(() => {
    return selectedCropsList.reduce((acc, c) => {
      const q = parseFloat(c.quantityKg);
      const rate = c.ratePerKg || defaultRatePerKg;
      return acc + (isNaN(q) ? 0 : q * rate);
    }, 0);
  }, [selectedCropsList, defaultRatePerKg]);

  // Expected queue position
  const expectedQueueNumber = useMemo(() => {
    const currentCount =
      selectedSlot && typeof selectedSlot.bookedFarmers === 'number'
        ? selectedSlot.bookedFarmers
        : mandi?.activeFarmersCount || 0;
    return currentCount + 1;
  }, [selectedSlot, mandi]);

  if (!mandi) return null;

  // Toggle crop selection
  const handleToggleCrop = (index: number) => {
    setCropItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  // Update crop quantity in KG
  const handleUpdateQuantityKg = (index: number, text: string) => {
    setCropItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantityKg: text };
      return updated;
    });
  };

  // Confirm and create booking
  const handleConfirmBooking = async () => {
    if (!token) {
      setErrorMessage('Farmer login session missing. Please log in again.');
      return;
    }

    if (selectedCropsList.length === 0) {
      setErrorMessage('Please select at least one crop to book.');
      return;
    }

    if (totalQuantityKg <= 0) {
      setErrorMessage('Please enter a valid quantity in KG for selected crops.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const slotId = selectedSlot?.id || 'default-slot-1';

    // Build payload with multi-crop in KG
    const cropsPayload: CropBookingItem[] = selectedCropsList.map((c) => ({
      crop: c.crop,
      variety: c.variety,
      quantityKg: parseFloat(c.quantityKg) || 0,
      ratePerKg: c.ratePerKg,
      estimatedPayout: (parseFloat(c.quantityKg) || 0) * (c.ratePerKg || defaultRatePerKg),
    }));

    try {
      const primaryCrop = selectedCropsList[0];
      const res = await createFarmerBookingApi(token, {
        mandiProfileId: mandi.id,
        slotId,
        crop: primaryCrop.crop,
        variety: primaryCrop.variety,
        quantityKg: totalQuantityKg,
        quantityQuintals: totalQuantityKg / 100,
        cropsList: cropsPayload,
      });

      if (res.success && res.data?.booking) {
        setGeneratedBooking(res.data.booking);
        onBookingSuccess?.(res.data.booking);
      } else {
        setErrorMessage(res.message || 'Failed to submit booking request.');
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
                    {mandi.mandiCode || 'APMC'}
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
            ref={scrollRef}
            style={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            showsVerticalScrollIndicator={false}>
            {generatedBooking ? (
              /* ═══ SUCCESS / PENDING APPROVAL VIEW (NO QR UNTIL ACCEPTED) ═══ */
              <View style={styles.passContainer}>
                <View style={styles.pendingBanner}>
                  <View style={styles.pendingIconWrap}>
                    <Ionicons name="time" size={24} color="#D97706" />
                  </View>
                  <View style={styles.pendingBannerTextCol}>
                    <Text style={styles.pendingTitle}>Booking Submitted!</Text>
                    <Text style={styles.pendingSub}>
                      Status: <Text style={styles.boldAmber}>PENDING MANDI APPROVAL</Text>
                    </Text>
                  </View>
                </View>

                {/* Information Notice */}
                <View style={styles.noticeCard}>
                  <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
                  <Text style={styles.noticeText}>
                    Your arrival request has been forwarded to the Mandi Yard Gate Admin. Once approved, your official Gate Pass QR Code and verification token will unlock automatically in your Bookings tab.
                  </Text>
                </View>

                {/* Summary Card */}
                <View style={styles.passCard}>
                  <View style={styles.passCardHeader}>
                    <View>
                      <Text style={styles.passMandiTitle}>
                        {translateMandiName(mandi.name, language)}
                      </Text>
                      <Text style={styles.passYardCode}>
                        Booking Code: #{generatedBooking.id?.slice(0, 8).toUpperCase() || 'SUBMITTED'}
                      </Text>
                    </View>
                    <View style={styles.queueBadge}>
                      <Text style={styles.queueBadgeText}>
                        Expected Queue: #{generatedBooking.queueNumber ?? expectedQueueNumber}
                      </Text>
                    </View>
                  </View>

                  {/* Summary Details */}
                  <View style={styles.passMetaGrid}>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Arrival Date:</Text>
                      <Text style={styles.metaValue}>
                        {generatedBooking.slot?.date || selectedSlot?.date || new Date().toISOString().split('T')[0]}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Gate Window:</Text>
                      <Text style={styles.metaValue}>
                        {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : 'Morning Slot'}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Total Consignment:</Text>
                      <Text style={styles.metaValueBold}>
                        {generatedBooking.quantityKg ?? totalQuantityKg} KG
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Est. Total Payout:</Text>
                      <Text style={styles.metaValueGreen}>
                        ₹{(generatedBooking.estimatedPayout ?? totalEstimatedPayout).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Multi-Crop Breakdown */}
                  {selectedCropsList.length > 0 && (
                    <View style={styles.cropsBreakdownCard}>
                      <Text style={styles.cropsBreakdownTitle}>Crops Breakdown:</Text>
                      {selectedCropsList.map((c, i) => (
                        <View key={i} style={styles.cropBreakdownRow}>
                          <Text style={styles.cropBreakdownName}>• {c.crop}</Text>
                          <Text style={styles.cropBreakdownQty}>
                            {c.quantityKg} KG @ ₹{c.ratePerKg}/kg = ₹{((parseFloat(c.quantityKg) || 0) * c.ratePerKg).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
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

                {/* 1. Slot Window & Date Selection */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>1. Select Date &amp; Arrival Window</Text>
                  {(() => {
                    const activeSlots = (mandi.slots || []).filter(
                      (s) => !(s as any).isExpired && !isSlotExpired(s.date, s.endTime, s.startTime)
                    );

                    if (activeSlots.length === 0) {
                      return (
                        <View style={styles.noSlotsBanner}>
                          <Ionicons name="time-outline" size={18} color="#D97706" />
                          <Text style={styles.noSlotsText}>
                            All arrival slots for today have passed. Please check back for upcoming slots.
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <View style={styles.slotsGrid}>
                        {activeSlots.map((s) => {
                          const isSelected = selectedSlot?.id === s.id;
                          const slotCropsText =
                            s.allowedCrops && Array.isArray(s.allowedCrops) && s.allowedCrops.length > 0
                              ? s.allowedCrops.map((ac: any) => ac.crop || ac).join(', ')
                              : s.crop || 'Wheat, Mustard';

                          return (
                            <Pressable
                              key={s.id}
                              onPress={() => handleSelectSlot(s)}
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
                              <Text style={styles.slotCapText} numberOfLines={1}>
                                Crops: {slotCropsText}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    );
                  })()}
                </View>

                {/* 2. Expected Queue Position */}
                <View style={styles.queueInfoCard}>
                  <Ionicons name="people" size={18} color="#059669" />
                  <View style={styles.queueInfoTextCol}>
                    <Text style={styles.queueInfoTitle}>
                      Expected Queue Position: <Text style={styles.queueInfoBold}>#{expectedQueueNumber}</Text>
                    </Text>
                    <Text style={styles.queueInfoSub}>
                      Queue Farmers: {selectedSlot?.bookedFarmers || 0} / {selectedSlot?.maxFarmers || 20} • Expected Wait: {(selectedSlot?.bookedFarmers || 0) === 0 ? 0 : Math.min((selectedSlot?.bookedFarmers || 0) * 6, 45)} mins
                    </Text>
                  </View>
                </View>

                {/* 2. Multi-Crop Selection & Quantity in KG (Filtered by Slot) */}
                <View style={styles.formSection}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.sectionLabel}>2. Crops Allowed in this Slot (Rates per KG)</Text>
                    <Text style={styles.calcSubText}>
                      Total: {totalQuantityKg.toLocaleString('en-IN')} KG
                    </Text>
                  </View>

                  <View style={styles.cropsListContainer}>
                    {cropItems.map((item, index) => (
                      <View
                        key={item.crop}
                        style={[
                          styles.cropItemCard,
                          item.selected && styles.cropItemCardSelected,
                        ]}>
                        <Pressable
                          onPress={() => handleToggleCrop(index)}
                          style={styles.cropItemHeader}>
                          <View style={styles.checkboxWrap}>
                            <Ionicons
                              name={item.selected ? 'checkbox' : 'square-outline'}
                              size={20}
                              color={item.selected ? '#16A34A' : '#9CA3AF'}
                            />
                            <Text style={styles.cropNameText}>
                              {translateCropName(item.crop, language)}
                            </Text>
                          </View>
                          <Text style={styles.cropRateText}>
                            Rate: ₹{item.ratePerKg}/KG
                          </Text>
                        </Pressable>

                        {item.selected && (
                          <View style={styles.cropInputsRow}>
                            <View style={styles.qtyInputBox}>
                              <Text style={styles.qtyInputLabel}>Quantity (KG):</Text>
                              <TextInput
                                style={styles.qtyTextInput}
                                keyboardType="numeric"
                                value={item.quantityKg}
                                onChangeText={(val) => handleUpdateQuantityKg(index, val)}
                                placeholder="e.g. 500"
                                placeholderTextColor="#9CA3AF"
                              />
                            </View>
                            <View style={styles.cropPayoutBox}>
                              <Text style={styles.qtyInputLabel}>Est. Payout:</Text>
                              <Text style={styles.cropPayoutValue}>
                                ₹{((parseFloat(item.quantityKg) || 0) * item.ratePerKg).toLocaleString('en-IN')}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {/* 4. Estimated Overall Total */}
                <View style={styles.payoutSummaryBox}>
                  <View>
                    <Text style={styles.payoutSummaryLabel}>Total Consignment</Text>
                    <Text style={styles.payoutSummaryKg}>{totalQuantityKg.toLocaleString('en-IN')} KG</Text>
                  </View>
                  <View style={styles.alignRight}>
                    <Text style={styles.payoutSummaryLabel}>Estimated Payout</Text>
                    <Text style={styles.payoutSummaryAmount}>
                      ₹{totalEstimatedPayout.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Confirm Action Button */}
                <Pressable
                  onPress={handleConfirmBooking}
                  disabled={isSubmitting || selectedCropsList.length === 0}
                  style={[
                    styles.primaryActionBtn,
                    (isSubmitting || selectedCropsList.length === 0) && styles.btnDisabled,
                  ]}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryActionBtnText}>
                        Submit Booking for Approval
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
    maxHeight: '92%',
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
    fontSize: 12,
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
  queueInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  queueInfoTextCol: {
    flex: 1,
  },
  queueInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  queueInfoBold: {
    fontWeight: '900',
    color: '#047857',
  },
  queueInfoSub: {
    fontSize: 11,
    color: '#059669',
    marginTop: 1,
  },
  cropsListContainer: {
    gap: 8,
  },
  cropItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 10,
    gap: 8,
  },
  cropItemCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  cropItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cropNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  cropRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cropInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  qtyInputBox: {
    flex: 1,
  },
  qtyInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
  },
  qtyTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  cropPayoutBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cropPayoutValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 4,
  },
  payoutSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 14,
  },
  payoutSummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  payoutSummaryKg: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 1,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  payoutSummaryAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
    marginTop: 1,
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
    opacity: 0.5,
  },

  // Success / Pending Pass Styles
  passContainer: {
    paddingVertical: 16,
    gap: 14,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBannerTextCol: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  pendingSub: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  boldAmber: {
    fontWeight: '800',
    color: '#B45309',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noticeText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 16,
  },
  passCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 12,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
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
  metaValueBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  metaValueGreen: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  cropsBreakdownCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  cropsBreakdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 2,
  },
  cropBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropBreakdownName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  cropBreakdownQty: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },

  // Expired Slot Card Styles
  slotCardExpired: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.65,
  },
  slotTimeTextExpired: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  slotCapTextExpired: {
    color: '#9CA3AF',
  },
  expiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  expiredBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#991B1B',
    textTransform: 'uppercase',
  },
  noSlotsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noSlotsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
});

import React, { memo, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/theme';
import { BookingsFilterModal } from './BookingsFilterModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { translateMandiName, translateCropName } from '@/constants/translations';
import { getFarmerBookingsApi } from '@/services/farmer.service';
import type { BookingItem, BookingStatus, BookingsFilterCriteria } from '@/interfaces';

const ITEMS_PER_PAGE = 3;

const INITIAL_BOOKING_CRITERIA: BookingsFilterCriteria = {
  searchQuery: '',
  selectedCrop: 'All Crops',
  manualDate: '',
  manualCrop: '',
  minFarmers: '',
  status: 'all',
};

export const BookingsSectionView = memo(function BookingsSectionView() {
  const { token } = useAuth();
  const { language, t } = useLanguage();
  const [criteria, setCriteria] = useState<BookingsFilterCriteria>(INITIAL_BOOKING_CRITERIA);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [liveBookings, setLiveBookings] = useState<BookingItem[]>([]);
  const [selectedPassBooking, setSelectedPassBooking] = useState<BookingItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getStatusBadge = (status: BookingStatus | string) => {
    switch (status) {
      case 'PENDING':
      case 'in_progress':
        return {
          bg: '#FEF3C7',
          text: '#B45309',
          label: 'Awaiting Approval',
        };
      case 'ACCEPTED':
      case 'VERIFIED':
      case 'confirmed':
        return {
          bg: '#DCFCE7',
          text: '#15803D',
          label: 'Gate Pass Active',
        };
      case 'COMPLETED':
      case 'completed':
        return {
          bg: '#EAECEE',
          text: '#374151',
          label: 'Completed',
        };
      case 'REJECTED':
        return {
          bg: '#FEE2E2',
          text: '#991B1B',
          label: 'Rejected',
        };
      case 'CANCELLED':
      case 'cancelled':
      default:
        return {
          bg: '#FEE2E2',
          text: '#991B1B',
          label: 'Cancelled',
        };
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadBookings() {
      if (!token) return;
      setIsLoading(true);
      try {
        const res = await getFarmerBookingsApi(token);
        if (isMounted && res.success && res.data && res.data.bookings) {
          const mapped: BookingItem[] = res.data.bookings.map((b: any) => {
            const rawStatus = b.status || 'PENDING';
            const qtyKg = b.quantityKg ?? ((b.quantityQuintals || 0) * 100);

            return {
              id: b.id,
              bookingCode: b.token || `BK-${b.id.slice(0, 6).toUpperCase()}`,
              token: b.token,
              queueNumber: b.queueNumber,
              qrCodeData: b.qrCodeData,
              cropName: b.crop || 'Produce',
              cropVariety: b.variety || 'A-Grade',
              cropsList: b.cropsList,
              mandiName: b.mandiProfile?.mandiName || 'APMC Mandi',
              mandiCode: b.mandiProfile?.mandiCode || 'MAN001',
              gateNo: 'Gate Toll 01',
              dateString: b.slot?.date || (b.createdAt ? b.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
              timeSlot: b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : '08:00 - 13:30',
              status: rawStatus,
              statusLabel: rawStatus,
              progressPercent: rawStatus === 'COMPLETED' ? 100 : rawStatus === 'VERIFIED' ? 75 : rawStatus === 'ACCEPTED' ? 50 : 20,
              progressLabel:
                rawStatus === 'COMPLETED'
                  ? 'Auction Settled'
                  : rawStatus === 'VERIFIED'
                  ? 'Weighbridge Weighed'
                  : rawStatus === 'ACCEPTED'
                  ? 'Gate Pass Verified'
                  : rawStatus === 'REJECTED'
                  ? 'Application Discarded'
                  : 'Pending Review',
              inspectorName: 'APMC Gate Officer',
              quantityKg: qtyKg,
              quantityQuintals: b.quantityQuintals || (qtyKg / 100),
              rejectionReason: b.rejectionReason,
              estimatedPayout: b.estimatedPayout,
              finalPayoutAmount: b.finalPayoutAmount,
              vehicleNumber: b.vehicleNumber,
            };
          });
          setLiveBookings(mapped);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadBookings();
    return () => { isMounted = false; };
  }, [token]);

  const allBookings = liveBookings;

  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      // 1. Search Query (ID, Crop, Mandi)
      if (criteria.searchQuery.trim()) {
        const query = criteria.searchQuery.toLowerCase();
        const matchesCode = b.bookingCode.toLowerCase().includes(query);
        const matchesCrop = b.cropName.toLowerCase().includes(query);
        const matchesMandi = b.mandiName.toLowerCase().includes(query);
        if (!matchesCode && !matchesCrop && !matchesMandi) return false;
      }

      // 2. Status Filter
      if (criteria.status !== 'all' && b.status !== criteria.status) {
        return false;
      }

      // 3. Crop Filter
      const targetCrop = criteria.manualCrop.trim() || (criteria.selectedCrop !== 'All Crops' ? criteria.selectedCrop : '');
      if (targetCrop) {
        if (!b.cropName.toLowerCase().includes(targetCrop.toLowerCase())) {
          return false;
        }
      }

      // 4. Date Filter
      if (criteria.manualDate.trim()) {
        if (!b.dateString.includes(criteria.manualDate.trim())) {
          return false;
        }
      }

      // 5. Quantity Filter
      if (criteria.minFarmers.trim()) {
        const min = parseInt(criteria.minFarmers, 10);
        if (!isNaN(min) && b.quantityQuintals < min) {
          return false;
        }
      }

      return true;
    });
  }, [allBookings, criteria]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const handleShowQrPass = (booking: BookingItem) => {
    setSelectedPassBooking(booking);
  };

  const hasActiveFilters =
    criteria.status !== 'all' ||
    Boolean(criteria.manualCrop) ||
    criteria.selectedCrop !== 'All Crops' ||
    Boolean(criteria.manualDate) ||
    Boolean(criteria.minFarmers);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      
      {/* Search Bar & Filter Trigger */}
      <View style={styles.topControlSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={ThemeColors.textSecondary} />
          <TextInput
            placeholder="Search booking ID, crop, mandi..."
            placeholderTextColor="#9CA3AF"
            value={criteria.searchQuery}
            onChangeText={(text) => {
              setCriteria((prev) => ({ ...prev, searchQuery: text }));
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />
          {criteria.searchQuery ? (
            <Pressable
              onPress={() => {
                setCriteria((prev) => ({ ...prev, searchQuery: '' }));
                setCurrentPage(1);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Modal Button */}
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          style={[
            styles.filterBtn,
            hasActiveFilters && styles.filterBtnActive,
          ]}>
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? '#FFFFFF' : ThemeColors.primary}
          />
        </Pressable>
      </View>

      {/* Active Filter Chips */}
      {hasActiveFilters ? (
        <View style={styles.activeFiltersRow}>
          <Text style={styles.activeFiltersLabel}>Filters:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
            {criteria.manualCrop || criteria.selectedCrop !== 'All Crops' ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>🌾 {criteria.manualCrop || criteria.selectedCrop}</Text>
              </View>
            ) : null}
            {criteria.manualDate ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>📅 {criteria.manualDate}</Text>
              </View>
            ) : null}
            {criteria.minFarmers ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>📦 {criteria.minFarmers}+ Qtl</Text>
              </View>
            ) : null}
            {criteria.status !== 'all' ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>🏷️ {criteria.status}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => {
                setCriteria(INITIAL_BOOKING_CRITERIA);
                setCurrentPage(1);
              }}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <Text style={styles.clearAllText}>Clear</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}

      {/* Status Quick Filter Chips */}
      <View style={styles.statusPillsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusPillsContent}>
          {[
            { key: 'all', label: language === 'mr' ? 'सर्व स्लॉट्स' : language === 'hi' ? 'सभी स्लॉट' : 'All Slots' },
            { key: 'in_progress', label: t('status.in_progress') },
            { key: 'confirmed', label: t('status.confirmed') },
            { key: 'completed', label: t('status.completed') },
          ].map((st) => {
            const active = criteria.status === st.key;
            return (
              <Pressable
                key={st.key}
                onPress={() => {
                  setCriteria((prev) => ({ ...prev, status: st.key as any }));
                  setCurrentPage(1);
                }}
                style={[
                  styles.statusChip,
                  active ? styles.statusChipActive : styles.statusChipInactive,
                ]}>
                <Text
                  style={[
                    styles.statusChipText,
                    active ? styles.statusChipTextActive : styles.statusChipTextInactive,
                  ]}>
                  {st.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Cards List */}
      <View style={styles.cardsList}>
        {paginatedBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{t('dash.no_recent_bookings')}</Text>
            <Text style={styles.emptySubtitle}>{t('dash.no_recent_sub')}</Text>
            <Pressable
              onPress={() => {
                setCriteria(INITIAL_BOOKING_CRITERIA);
                setCurrentPage(1);
              }}
              style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>{t('mandi.reset_filters')}</Text>
            </Pressable>
          </View>
        ) : (
          paginatedBookings.map((b) => {
            const statusStyle = getStatusBadge(b.status);
            const isPending = b.status === 'PENDING' || b.status === 'in_progress';
            const isRejected = b.status === 'REJECTED';
            const isCompleted = b.status === 'COMPLETED' || b.status === 'completed';
            const qtyKg = b.quantityKg ?? ((b.quantityQuintals || 0) * 100);

            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {b.queueNumber ? (
                      <View style={styles.cardQueueBadge}>
                        <Text style={styles.cardQueueBadgeText}>
                          Q#{String(b.queueNumber).padStart(3, '0')}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={styles.cardCode}>{b.token || `#${b.bookingCode}`}</Text>
                  </View>
                </View>

                <Text style={styles.cardCropTitle}>
                  {translateCropName(b.cropName, language)} {b.cropVariety ? `(${b.cropVariety})` : ''}
                </Text>
                <Text style={styles.cardMandiSubtitle}>
                  {translateMandiName(b.mandiName, language)} • {b.gateNo}
                </Text>

                {/* Crop Intake Requirement Strip */}
                <View style={{ backgroundColor: '#F0FDF4', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 8, gap: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#166534', textTransform: 'uppercase' }}>
                    Mandi Crop Intake Requirements &amp; Rates:
                  </Text>
                  {b.cropsList && b.cropsList.length > 0 ? (
                    b.cropsList.map((c, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>
                          • {c.crop}: {c.quantityKg} KG @ ₹{c.ratePerKg || 25}/KG
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: '#047857' }}>
                          Requirement: {(c.quantityKg ? Math.max(c.quantityKg * 5, 5000) : 5000).toLocaleString('en-IN')} KG
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>
                        • {translateCropName(b.cropName, language)}: {qtyKg} KG
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#047857' }}>
                        Requirement: 5,000 KG
                      </Text>
                    </View>
                  )}
                </View>

                {/* Rejection Alert Banner */}
                {isRejected && (
                  <View style={{ backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', padding: 8, borderRadius: 8, marginBottom: 8, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="alert-circle" size={14} color="#991B1B" />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#991B1B' }}>
                        Application Discarded:
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#B91C1C' }}>
                      {b.rejectionReason || 'Rejected by APMC Admin.'} (Cannot reapply for this slot)
                    </Text>
                  </View>
                )}

                <View style={styles.cardInfoRow}>
                  <View style={styles.infoCol}>
                    <Ionicons name="calendar-outline" size={13} color={ThemeColors.textSecondary} />
                    <Text style={styles.infoColText}>{b.dateString}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Ionicons name="time-outline" size={13} color={ThemeColors.textSecondary} />
                    <Text style={styles.infoColText}>{b.timeSlot}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Ionicons name="cube-outline" size={13} color={ThemeColors.textSecondary} />
                    <Text style={styles.infoColText}>{qtyKg.toLocaleString('en-IN')} KG</Text>
                  </View>
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={styles.inspectorText}>{language === 'mr' ? 'अधिकारी:' : language === 'hi' ? 'अधिकारी:' : 'Officer:'} {b.inspectorName}</Text>
                  
                  {isPending ? (
                    <Pressable
                      onPress={() => handleShowQrPass(b)}
                      style={({ pressed }) => [styles.pendingPassBtn, pressed && styles.pressed]}>
                      <Ionicons name="time-outline" size={14} color="#B45309" />
                      <Text style={styles.pendingPassBtnText}>Review Status</Text>
                    </Pressable>
                  ) : isRejected ? (
                    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FEE2E2' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#991B1B' }}>Discarded</Text>
                    </View>
                  ) : isCompleted ? (
                    <Pressable
                      onPress={() => handleShowQrPass(b)}
                      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#7C3AED' }, pressed && styles.pressed]}>
                      <Ionicons name="receipt-outline" size={14} color="#FFFFFF" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>View Slip</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => handleShowQrPass(b)}
                      style={({ pressed }) => [styles.passBtn, pressed && styles.pressed]}>
                      <Ionicons name="qr-code-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.passBtnText}>QR Gate Pass</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Pagination Controls */}
      {totalPages > 1 ? (
        <View style={styles.paginationRow}>
          <Pressable
            disabled={currentPage <= 1}
            onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={[styles.pageBtn, currentPage <= 1 && styles.pageBtnDisabled]}>
            <Ionicons
              name="chevron-back"
              size={16}
              color={currentPage <= 1 ? '#9CA3AF' : ThemeColors.textPrimary}
            />
            <Text style={[styles.pageBtnText, currentPage <= 1 && styles.pageTextDisabled]}>{t('mandi.prev')}</Text>
          </Pressable>

          <View style={styles.pageIndicatorPill}>
            <Text style={styles.pageIndicatorText}>
              {t('mandi.page_indicator', { page: currentPage, total: totalPages })}
            </Text>
          </View>

          <Pressable
            disabled={currentPage >= totalPages}
            onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={[styles.pageBtn, currentPage >= totalPages && styles.pageBtnDisabled]}>
            <Text style={[styles.pageBtnText, currentPage >= totalPages && styles.pageTextDisabled]}>{t('mandi.next')}</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={currentPage >= totalPages ? '#9CA3AF' : ThemeColors.textPrimary}
            />
          </Pressable>
        </View>
      ) : null}

      {/* Bookings Multi-Criteria Filter Modal */}
      <BookingsFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        criteria={criteria}
        onApply={(newCriteria) => {
          setCriteria(newCriteria);
          setCurrentPage(1);
        }}
        onReset={() => {
          setCriteria(INITIAL_BOOKING_CRITERIA);
          setCurrentPage(1);
        }}
      />

      {/* Digital QR Gate Pass / Pending Status Modal */}
      {selectedPassBooking ? (
        <Modal
          visible={Boolean(selectedPassBooking)}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPassBooking(null)}>
          <View style={styles.passModalOverlay}>
            <View style={styles.passModalCard}>
              <View style={styles.passModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.passModalTitle}>
                    {translateMandiName(selectedPassBooking.mandiName, language)}
                  </Text>
                  <Text style={styles.passModalSub}>
                    APMC ID: {selectedPassBooking.mandiCode || 'MAN001'} • {selectedPassBooking.gateNo}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedPassBooking(null)}
                  style={styles.passCloseBtn}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <ScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
                {selectedPassBooking.status === 'PENDING' || selectedPassBooking.status === 'in_progress' ? (
                  /* Pending Notice */
                  <View style={{ backgroundColor: '#FEF3C7', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#FCD34D', gap: 6, marginVertical: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="time" size={20} color="#B45309" />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>
                        Application Pending Mandi Review
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#78350F', lineHeight: 16 }}>
                      Your slot arrival application is under review by the APMC Gate Admin. Once approved, your official Gate Pass Token & QR barcode will be unlocked here.
                    </Text>
                  </View>
                ) : selectedPassBooking.status === 'COMPLETED' || selectedPassBooking.status === 'completed' ? (
                  /* Settlement Slip for Completed Bookings */
                  <View style={{ marginVertical: 10, gap: 10 }}>
                    {/* Success Banner */}
                    <View style={{ backgroundColor: '#F0FDF4', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#BBF7D0', gap: 6, alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={36} color="#15803D" />
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#15803D', textAlign: 'center' }}>
                        Auction Settled Successfully
                      </Text>
                      <Text style={{ fontSize: 11, color: '#166534', textAlign: 'center', lineHeight: 16 }}>
                        Your consignment has been weighed, graded, and the transaction has been completed at the APMC yard.
                      </Text>
                    </View>

                    {/* Settlement Receipt Card */}
                    <View style={{ backgroundColor: '#FAFAFA', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                      {/* Receipt Header */}
                      <View style={{ backgroundColor: '#7C3AED', paddingVertical: 10, paddingHorizontal: 14 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#E9D5FF', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                          SETTLEMENT RECEIPT
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF', marginTop: 2 }}>
                          Token: {selectedPassBooking.token || selectedPassBooking.bookingCode}
                        </Text>
                      </View>

                      {/* Receipt Details */}
                      <View style={{ padding: 14, gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Produce</Text>
                          <Text style={{ fontSize: 12, color: '#111827', fontWeight: '700' }}>
                            {selectedPassBooking.cropName} {selectedPassBooking.cropVariety ? `(${selectedPassBooking.cropVariety})` : ''}
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Consignment Weight</Text>
                          <Text style={{ fontSize: 12, color: '#111827', fontWeight: '700' }}>
                            {(selectedPassBooking.quantityKg ?? (selectedPassBooking.quantityQuintals * 100)).toLocaleString('en-IN')} KG
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Mandi</Text>
                          <Text style={{ fontSize: 12, color: '#111827', fontWeight: '700' }}>
                            {selectedPassBooking.mandiName}
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Arrival Date & Time</Text>
                          <Text style={{ fontSize: 12, color: '#111827', fontWeight: '700' }}>
                            {selectedPassBooking.dateString} • {selectedPassBooking.timeSlot}
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />

                        {selectedPassBooking.vehicleNumber ? (
                          <>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Vehicle No.</Text>
                              <Text style={{ fontSize: 12, color: '#111827', fontWeight: '700' }}>
                                {selectedPassBooking.vehicleNumber}
                              </Text>
                            </View>
                            <View style={{ height: 1, backgroundColor: '#F3F4F6' }} />
                          </>
                        ) : null}

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Queue Number</Text>
                          <Text style={{ fontSize: 12, color: '#111827', fontWeight: '700' }}>
                            #{String(selectedPassBooking.queueNumber ?? 1).padStart(3, '0')}
                          </Text>
                        </View>
                      </View>

                      {/* Payout Section */}
                      {selectedPassBooking.finalPayoutAmount ? (
                        <View style={{ backgroundColor: '#F0FDF4', padding: 14, borderTopWidth: 1, borderTopColor: '#BBF7D0' }}>
                          <Text style={{ fontSize: 10, color: '#166534', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                            FINAL PAYOUT (DBT)
                          </Text>
                          <Text style={{ fontSize: 20, color: '#15803D', fontWeight: '900', marginTop: 2 }}>
                            ₹{selectedPassBooking.finalPayoutAmount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      ) : selectedPassBooking.estimatedPayout ? (
                        <View style={{ backgroundColor: '#FFFBEB', padding: 14, borderTopWidth: 1, borderTopColor: '#FDE68A' }}>
                          <Text style={{ fontSize: 10, color: '#92400E', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                            ESTIMATED PAYOUT
                          </Text>
                          <Text style={{ fontSize: 20, color: '#B45309', fontWeight: '900', marginTop: 2 }}>
                            ₹{selectedPassBooking.estimatedPayout.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Status Progress Complete Bar */}
                    <View style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0', gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#166534', textTransform: 'uppercase' }}>Progress</Text>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803D' }}>100%</Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: '#DCFCE7', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ width: '100%', height: 6, backgroundColor: '#15803D', borderRadius: 3 }} />
                      </View>
                      <Text style={{ fontSize: 10, color: '#166534', fontWeight: '600' }}>✅ Auction Settled • Weighbridge Complete • DBT Processed</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    {/* Queue & Token Box */}
                    <View style={styles.passTokenBox}>
                      <View style={styles.passQueuePill}>
                        <Text style={styles.passQueuePillText}>
                          QUEUE #{String(selectedPassBooking.queueNumber ?? 1).padStart(3, '0')}
                        </Text>
                      </View>
                      <Text style={styles.passTokenLabel}>GATE PASS TOKEN</Text>
                      <Text style={styles.passTokenValue}>
                        {selectedPassBooking.token || selectedPassBooking.bookingCode}
                      </Text>
                    </View>

                    {/* QR Code Image */}
                    <View style={styles.passQrBox}>
                      <Image
                        source={{
                          uri: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                            selectedPassBooking.qrCodeData || selectedPassBooking.token || selectedPassBooking.bookingCode
                          )}`,
                        }}
                        style={styles.passQrImg}
                        resizeMode="contain"
                      />
                      <Text style={styles.passQrHint}>
                        Present this QR barcode to APMC operator gate scanner
                      </Text>
                    </View>
                  </>
                )}

                {/* Meta details */}
                <View style={styles.passDetailsCard}>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailLabel}>Produce:</Text>
                    <Text style={styles.passDetailValue}>
                      {translateCropName(selectedPassBooking.cropName, language)} {selectedPassBooking.cropVariety ? `(${selectedPassBooking.cropVariety})` : ''}
                    </Text>
                  </View>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailLabel}>Quantity:</Text>
                    <Text style={styles.passDetailValue}>
                      {(selectedPassBooking.quantityKg ?? (selectedPassBooking.quantityQuintals * 100)).toLocaleString('en-IN')} KG
                    </Text>
                  </View>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailLabel}>Date & Time:</Text>
                    <Text style={styles.passDetailValue}>
                      {selectedPassBooking.dateString} • {selectedPassBooking.timeSlot}
                    </Text>
                  </View>
                  {selectedPassBooking.estimatedPayout ? (
                    <View style={styles.passDetailRow}>
                      <Text style={styles.passDetailLabel}>Estimated Payout:</Text>
                      <Text style={[styles.passDetailValue, { color: '#15803D', fontWeight: '800' }]}>
                        ₹{selectedPassBooking.estimatedPayout.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ) : null}
                  {selectedPassBooking.finalPayoutAmount ? (
                    <View style={styles.passDetailRow}>
                      <Text style={styles.passDetailLabel}>Final Settled Payout:</Text>
                      <Text style={[styles.passDetailValue, { color: '#15803D', fontWeight: '900' }]}>
                        ₹{selectedPassBooking.finalPayoutAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>

              <View style={styles.passModalFooter}>
                <Pressable
                  onPress={() => setSelectedPassBooking(null)}
                  style={styles.passDismissBtn}>
                  <Text style={styles.passDismissBtnText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: 110,
  },
  topControlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: ThemeColors.textPrimary,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: ThemeColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  filterBtnActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primaryDark,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 6,
  },
  activeFiltersLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.textMuted,
  },
  filterChipScroll: {
    gap: 6,
    alignItems: 'center',
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  clearAllText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
    marginLeft: 4,
  },
  statusPillsRow: {
    marginTop: 10,
  },
  statusPillsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusChipActive: {
    backgroundColor: ThemeColors.primary,
  },
  statusChipInactive: {
    backgroundColor: ThemeColors.white,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  statusChipTextInactive: {
    color: ThemeColors.textSecondary,
  },
  cardsList: {
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 12,
  },
  card: {
    backgroundColor: ThemeColors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardCode: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.textMuted,
  },
  cardCropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
  },
  cardMandiSubtitle: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    marginBottom: 10,
    marginTop: 2,
  },
  cardInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoColText: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  inspectorText: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
  },
  passBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  passBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  pendingPassBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  pageBtnDisabled: {
    opacity: 0.45,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.textPrimary,
  },
  pageTextDisabled: {
    color: '#9CA3AF',
  },
  pageIndicatorPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  emptyCard: {
    backgroundColor: ThemeColors.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  resetBtn: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  cardQueueBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  cardQueueBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B45309',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Digital QR Pass Modal Styles
  passModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
  },
  passModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  passModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  passModalSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  passCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  passTokenBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    gap: 2,
  },
  passQueuePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 4,
  },
  passQueuePillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B45309',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  passTokenLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 1,
  },
  passTokenValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.5,
  },
  passQrBox: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 12,
  },
  passQrImg: {
    width: 170,
    height: 170,
  },
  passQrHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  passDetailsCard: {
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  passDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passDetailLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  passDetailValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  passModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  passDismissBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  passDismissBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

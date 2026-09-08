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

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'in_progress':
        return {
          bg: '#FFE8C6',
          text: '#8D4004',
          label: t('status.in_progress'),
        };
      case 'confirmed':
        return {
          bg: '#DCFCE7',
          text: '#15803D',
          label: t('status.confirmed'),
        };
      case 'completed':
        return {
          bg: '#EAECEE',
          text: '#374151',
          label: t('status.completed'),
        };
      case 'cancelled':
      default:
        return {
          bg: '#FEE2E2',
          text: '#991B1B',
          label: t('status.cancelled'),
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
        if (isMounted && res.success && res.data && res.data.bookings && res.data.bookings.length > 0) {
          const mapped: BookingItem[] = res.data.bookings.map((b: any) => ({
            id: b.id,
            bookingCode: b.token || `BK-${b.id.slice(0, 4)}`,
            token: b.token,
            queueNumber: b.queueNumber,
            qrCodeData: b.qrCodeData,
            cropName: b.crop,
            cropVariety: b.variety || 'A-Grade',
            mandiName: b.mandiProfile?.mandiName || 'APMC Mandi',
            mandiCode: b.mandiProfile?.mandiCode || 'MAN001',
            gateNo: 'Gate 1 (E-Weighbridge)',
            dateString: b.slot?.date || (b.createdAt ? b.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
            timeSlot: b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : '08:00 AM - 11:00 AM',
            status:
              b.status === 'COMPLETED'
                ? 'completed'
                : b.status === 'VERIFIED' || b.status === 'ARRIVED'
                ? 'in_progress'
                : b.status === 'CANCELLED' || b.status === 'REJECTED'
                ? 'cancelled'
                : 'confirmed',
            statusLabel: b.status,
            progressPercent: b.status === 'COMPLETED' ? 100 : b.status === 'VERIFIED' ? 65 : 25,
            progressLabel: b.status === 'COMPLETED' ? 'Auction Settled' : b.status === 'VERIFIED' ? 'Assay in Progress' : 'Gate Pass Issued',
            inspectorName: 'APMC Officer',
            quantityQuintals: b.quantityQuintals || 10,
            vehicleNumber: b.vehicleNumber,
          }));
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
  }, [criteria]);

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
                  {translateCropName(b.cropName, language)} ({b.cropVariety})
                </Text>
                <Text style={styles.cardMandiSubtitle}>
                  {translateMandiName(b.mandiName, language)} • {b.gateNo}
                </Text>

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
                    <Text style={styles.infoColText}>{b.quantityQuintals} {t('dash.qtl')}</Text>
                  </View>
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={styles.inspectorText}>{language === 'mr' ? 'अधिकारी:' : language === 'hi' ? 'अधिकारी:' : 'Officer:'} {b.inspectorName}</Text>
                  <Pressable
                    onPress={() => handleShowQrPass(b)}
                    style={({ pressed }) => [styles.passBtn, pressed && styles.pressed]}>
                    <Ionicons name="qr-code-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.passBtnText}>QR Pass</Text>
                  </Pressable>
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

      {/* Digital QR Gate Pass Modal */}
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
                        selectedPassBooking.token || selectedPassBooking.bookingCode
                      )}`,
                    }}
                    style={styles.passQrImg}
                    resizeMode="contain"
                  />
                  <Text style={styles.passQrHint}>
                    Present this QR barcode to APMC operator gate scanner
                  </Text>
                </View>

                {/* Meta details */}
                <View style={styles.passDetailsCard}>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailLabel}>Produce:</Text>
                    <Text style={styles.passDetailValue}>
                      {translateCropName(selectedPassBooking.cropName, language)} ({selectedPassBooking.cropVariety})
                    </Text>
                  </View>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailLabel}>Quantity:</Text>
                    <Text style={styles.passDetailValue}>
                      {selectedPassBooking.quantityQuintals} Qtl ({(selectedPassBooking.quantityQuintals * 100).toLocaleString('en-IN')} KG)
                    </Text>
                  </View>
                  <View style={styles.passDetailRow}>
                    <Text style={styles.passDetailLabel}>Date & Time:</Text>
                    <Text style={styles.passDetailValue}>
                      {selectedPassBooking.dateString} • {selectedPassBooking.timeSlot}
                    </Text>
                  </View>
                  {selectedPassBooking.vehicleNumber && (
                    <View style={styles.passDetailRow}>
                      <Text style={styles.passDetailLabel}>Vehicle:</Text>
                      <Text style={[styles.passDetailValue, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#059669' }]}>
                        {selectedPassBooking.vehicleNumber}
                      </Text>
                    </View>
                  )}
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

import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/theme';
import { MandiFilterModal } from './MandiFilterModal';
import { MandiMapViewModal } from './MandiMapViewModal';
import { ProfileCompletionModal } from './ProfileCompletionModal';
import { SlotBookingModal } from './SlotBookingModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { translateMandiName, translateCropName } from '@/constants/translations';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getApprovedMandisApi, createFarmerBookingApi } from '@/services/farmer.service';
import { calculateDistanceKm, formatDistance } from '@/utils/location.utils';
import type { MandiItem, MandiFilterCriteria } from '@/interfaces';

const ITEMS_PER_PAGE = 4;

const INITIAL_FILTER_CRITERIA: MandiFilterCriteria = {
  searchQuery: '',
  selectedCrop: 'All Crops',
  selectedLocation: 'All Locations',
  selectedDate: 'Today',
  manualDate: '',
  manualCrop: '',
  minFarmers: '',
  timeSlot: 'Any Time',
};

export const MandiSectionView = memo(function MandiSectionView() {
  const { token, isProfileComplete } = useAuth();
  const { language, t } = useLanguage();
  const { coordinates: userCoords, locationName } = useUserLocation();

  const [criteria, setCriteria] = useState<MandiFilterCriteria>(INITIAL_FILTER_CRITERIA);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [infoModalMandi, setInfoModalMandi] = useState<MandiItem | null>(null);
  const [infoTab, setInfoTab] = useState<'overview' | 'slots'>('overview');
  const [bookingModalMandi, setBookingModalMandi] = useState<MandiItem | null>(null);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dbMandis, setDbMandis] = useState<MandiItem[]>([]);
  const [isLoadingMandis, setIsLoadingMandis] = useState<boolean>(true);

  // Fetch real mandis from database
  useEffect(() => {
    let isMounted = true;

    async function loadMandis() {
      setIsLoadingMandis(true);
      try {
        const res = await getApprovedMandisApi(token || undefined);
        if (isMounted && res.success && res.data && res.data.mandis && res.data.mandis.length > 0) {
          const formatted = res.data.mandis.map((m) => {
            const distance = calculateDistanceKm(
              userCoords.latitude,
              userCoords.longitude,
              m.latitude,
              m.longitude
            );
            return {
              ...m,
              distanceKm: distance,
            };
          });
          setDbMandis(formatted);
        } else {
          if (isMounted) {
            setDbMandis([]);
          }
        }
      } catch {
        if (isMounted) {
          setDbMandis([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMandis(false);
        }
      }
    }

    loadMandis();

    return () => {
      isMounted = false;
    };
  }, [token, userCoords]);

  // Recalculate distances dynamically & sort nearest 1st based on GPS
  const dynamicMandis = useMemo(() => {
    if (dbMandis.length === 0) {
      return [];
    }
    const list = dbMandis.map((m) => {
      const distance = calculateDistanceKm(
        userCoords.latitude,
        userCoords.longitude,
        m.latitude,
        m.longitude
      );
      return {
        ...m,
        distanceKm: distance,
      };
    });
    // Sort nearest 1st
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [dbMandis, userCoords]);

  const filteredMandis = useMemo(() => {
    return dynamicMandis.filter((mandi) => {
      // 1. Text Search
      if (criteria.searchQuery.trim()) {
        const query = criteria.searchQuery.toLowerCase();
        const matchesName = mandi.name.toLowerCase().includes(query) || translateMandiName(mandi.name, language).toLowerCase().includes(query);
        const matchesCrop = mandi.topCrop.toLowerCase().includes(query) || (mandi.acceptedCrops && mandi.acceptedCrops.some((c) => c.toLowerCase().includes(query) || translateCropName(c, language).toLowerCase().includes(query)));
        const matchesDistrict = mandi.district.toLowerCase().includes(query);
        if (!matchesName && !matchesCrop && !matchesDistrict) return false;
      }

      // 2. Crop filter
      const targetCrop =
        criteria.manualCrop.trim() ||
        (criteria.selectedCrop !== 'All Crops' ? criteria.selectedCrop : '');
      if (targetCrop) {
        const hasCrop =
          mandi.topCrop.toLowerCase().includes(targetCrop.toLowerCase()) ||
          (mandi.acceptedCrops &&
            mandi.acceptedCrops.some((c) => c.toLowerCase().includes(targetCrop.toLowerCase())));
        if (!hasCrop) return false;
      }

      // 3. Location filter
      if (criteria.selectedLocation !== 'All Locations') {
        if (!mandi.district.toLowerCase().includes(criteria.selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // 4. Min Farmers count in queue
      if (criteria.minFarmers.trim()) {
        const min = parseInt(criteria.minFarmers, 10);
        if (!isNaN(min) && (mandi.activeFarmersCount || 0) < min) {
          return false;
        }
      }

      return true;
    });
  }, [dynamicMandis, criteria, language]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMandis.length / ITEMS_PER_PAGE));
  const paginatedMandis = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMandis.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMandis, currentPage]);

  const handleBookSlot = useCallback(
    async (mandi: MandiItem) => {
      // 1. KYC Profile Completion Check (Strict Requirement)
      if (!isProfileComplete) {
        Alert.alert(
          t('mandi.booking_kyc_required_title'),
          t('mandi.booking_kyc_required_msg'),
          [
            { text: t('general.cancel'), style: 'cancel' },
            {
              text: t('mandi.complete_kyc_now'),
              onPress: () => setProfileModalVisible(true),
            },
          ]
        );
        return;
      }

      // 2. Open interactive slot booking modal
      setBookingModalMandi(mandi);
      setIsBookingModalVisible(true);
    },
    [isProfileComplete, t]
  );

  const hasActiveFilters =
    criteria.selectedCrop !== 'All Crops' ||
    Boolean(criteria.manualCrop) ||
    criteria.selectedLocation !== 'All Locations' ||
    Boolean(criteria.manualDate) ||
    Boolean(criteria.minFarmers);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      
      {/* Search Bar & Map Trigger */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={ThemeColors.textSecondary} />
          <TextInput
            placeholder={t('mandi.search_placeholder')}
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
              onPress={() => setCriteria((prev) => ({ ...prev, searchQuery: '' }))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Button */}
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          style={[
            styles.iconActionBtn,
            hasActiveFilters && styles.filterBtnActive,
          ]}>
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? '#FFFFFF' : ThemeColors.primary}
          />
        </Pressable>

        {/* Map Radar Button */}
        <Pressable
          onPress={() => setMapModalVisible(true)}
          style={[styles.iconActionBtn, styles.mapBtn]}>
          <Ionicons name="map" size={19} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Active Filter Chips */}
      {hasActiveFilters ? (
        <View style={styles.activeFiltersRow}>
          <Text style={styles.activeFiltersLabel}>{t('mandi.filter_label')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
            {criteria.manualCrop || criteria.selectedCrop !== 'All Crops' ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{translateCropName(criteria.manualCrop || criteria.selectedCrop, language)}</Text>
              </View>
            ) : null}
            {criteria.manualDate ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{criteria.manualDate}</Text>
              </View>
            ) : null}
            {criteria.minFarmers ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{criteria.minFarmers}+ {t('mandi.in_queue')}</Text>
              </View>
            ) : null}
            {criteria.selectedLocation !== 'All Locations' ? (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{criteria.selectedLocation}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => {
                setCriteria(INITIAL_FILTER_CRITERIA);
                setCurrentPage(1);
              }}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <Text style={styles.clearAllText}>{t('mandi.clear')}</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}

      {/* Quick Location Hint */}
      <View style={styles.locationHintRow}>
        <Ionicons name="navigate-circle" size={15} color={ThemeColors.primary} />
        <Text style={styles.locationHintText}>
          {t('mandi.showing_count', {
            count: filteredMandis.length,
            location: locationName || t('dash.cluster_name'),
          })}
        </Text>
      </View>

      {/* Mandis List */}
      <View style={styles.list}>
        {isLoadingMandis ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={ThemeColors.primary} />
            <Text style={styles.loadingText}>{t('mandi.loading')}</Text>
          </View>
        ) : paginatedMandis.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="storefront-outline" size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{t('mandi.no_match')}</Text>
            <Text style={styles.emptySubtitle}>{t('mandi.no_match_sub')}</Text>
            <Pressable
              onPress={() => setCriteria(INITIAL_FILTER_CRITERIA)}
              style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>{t('mandi.reset_filters')}</Text>
            </Pressable>
          </View>
        ) : (
          paginatedMandis.map((mandi) => {
            const cropsList = mandi.acceptedCrops && mandi.acceptedCrops.length > 0
              ? mandi.acceptedCrops
              : mandi.topCrop.split(',').map((c) => c.trim());
            const cropsDisplay = cropsList.slice(0, 3).map((c) => translateCropName(c, language)).join(' • ') + (cropsList.length > 3 ? '...' : '');

            return (
              <View key={mandi.id} style={styles.mandiCard}>
                {/* 1. Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.mandiTitleRow}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="storefront" size={18} color={ThemeColors.primary} />
                    </View>
                    <View style={styles.nameContainer}>
                      <View style={styles.mandiNameRow}>
                        <Text style={styles.mandiName}>{translateMandiName(mandi.name, language)}</Text>
                        <View style={styles.mandiCodePill}>
                          <Text style={styles.mandiCodePillText}>{mandi.mandiCode || 'MAN001'}</Text>
                        </View>
                      </View>
                      <Text style={styles.mandiDistrict}>
                        {mandi.district} • {formatDistance(mandi.distanceKm)} {t('mandi.away')}
                      </Text>
                      {mandi.address ? (
                        <Text style={styles.mandiAddress} numberOfLines={1}>
                          {mandi.address}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{mandi.isOpen ? t('mandi.open') : t('mandi.closed')}</Text>
                  </View>
                </View>

                {/* 2. Top Commodities Strip */}
                <View style={styles.topCommodityStrip}>
                  <View style={styles.topCommodityBadge}>
                    <Ionicons name="leaf-outline" size={12} color="#15803D" />
                    <Text style={styles.topCommodityLabel}>{t('mandi.crops')}</Text>
                    <Text style={styles.topCommodityText} numberOfLines={1}>
                      {cropsDisplay}
                    </Text>
                  </View>
                </View>

                {/* 3. Card Body */}
                <View style={styles.cardBody}>
                  <View style={styles.bodyLeftCol}>
                    <Text style={styles.operatingTimeText}>{t('mandi.hours')} {mandi.operatingHours || '05:30 AM - 07:00 PM'}</Text>
                    <Text style={styles.gateInfoText}>{t('mandi.arrival_gate')}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.bodyRightCol}>
                    <Text style={styles.uniformMetricText}>
                      {mandi.activeFarmersCount} {t('mandi.in_queue')}
                    </Text>
                    <Text style={styles.uniformMetricText}>
                      {mandi.modalPrice}
                    </Text>
                  </View>
                </View>

                {/* 4. Action Buttons */}
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => handleBookSlot(mandi)}
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                    <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>{t('mandi.book_gate_slot')}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setInfoModalMandi(mandi)}
                    style={({ pressed }) => [styles.infoBtn, pressed && styles.pressed]}>
                    <Ionicons name="information-circle-outline" size={18} color={ThemeColors.primary} />
                    <Text style={styles.infoBtnText}>{t('mandi.info')}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Pagination Bar */}
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

      {/* Multi-Criteria Filter Modal */}
      <MandiFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        criteria={criteria}
        onApply={(newCriteria) => {
          setCriteria(newCriteria);
          setCurrentPage(1);
        }}
        onReset={() => {
          setCriteria(INITIAL_FILTER_CRITERIA);
          setCurrentPage(1);
        }}
      />

      {/* Interactive Map Radar Modal */}
      <MandiMapViewModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        mandis={dynamicMandis}
        onSelectMandi={(mandi) => handleBookSlot(mandi)}
      />

      {/* KYC Profile Completion Modal */}
      <ProfileCompletionModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        onSuccess={() => {
          setProfileModalVisible(false);
        }}
      />

      {/* Interactive Slot Booking & Pass Generation Modal */}
      <SlotBookingModal
        visible={isBookingModalVisible}
        mandi={bookingModalMandi}
        token={token || undefined}
        onClose={() => {
          setIsBookingModalVisible(false);
          setBookingModalMandi(null);
        }}
      />

      {/* Mandi Detailed Info Popup Modal */}
      {infoModalMandi ? (
        <Modal
          visible={Boolean(infoModalMandi)}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setInfoModalMandi(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.infoModalCard}>
              <View style={styles.infoModalHeader}>
                <View style={styles.infoModalTitleCol}>
                  <Text style={styles.infoModalName}>{translateMandiName(infoModalMandi.name, language)}</Text>
                  <Text style={styles.infoModalCode}>APMC Code: {(infoModalMandi as any).apmcCode || 'MH-APMC-001'}</Text>
                </View>
                <Pressable
                  onPress={() => setInfoModalMandi(null)}
                  style={styles.infoCloseBtn}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Segmented Control Header to minimize scrolling */}
              <View style={styles.infoTabContainer}>
                <Pressable
                  onPress={() => setInfoTab('overview')}
                  style={[styles.infoTabBtn, infoTab === 'overview' && styles.infoTabBtnActive]}>
                  <Ionicons
                    name="information-circle"
                    size={15}
                    color={infoTab === 'overview' ? '#15803D' : '#6B7280'}
                  />
                  <Text style={[styles.infoTabText, infoTab === 'overview' && styles.infoTabTextActive]}>
                    Yard &amp; Contact
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setInfoTab('slots')}
                  style={[styles.infoTabBtn, infoTab === 'slots' && styles.infoTabBtnActive]}>
                  <Ionicons
                    name="time"
                    size={15}
                    color={infoTab === 'slots' ? '#15803D' : '#6B7280'}
                  />
                  <Text style={[styles.infoTabText, infoTab === 'slots' && styles.infoTabTextActive]}>
                    Slots &amp; Allowed Crops
                  </Text>
                </Pressable>
              </View>

              <ScrollView style={styles.infoScroll} showsVerticalScrollIndicator={false}>
                {infoTab === 'overview' ? (
                  <>
                    {/* Mandi Operator & Contact Details Card */}
                    <View style={styles.infoSection}>
                      <Text style={styles.infoSectionTitle}>Yard Admin &amp; Contact Details</Text>
                      <View style={styles.operatorContactCard}>
                        <View style={styles.operatorRow}>
                          <Ionicons name="person-circle" size={24} color="#15803D" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.operatorNameText}>{infoModalMandi.operatorName || 'Rupesh Sharma (Yard Admin)'}</Text>
                            <Text style={styles.operatorRoleText}>Authorized APMC Mandi Operator</Text>
                          </View>
                        </View>
                        <View style={styles.operatorDetailRow}>
                          <Ionicons name="call" size={14} color="#059669" />
                          <Text style={styles.operatorDetailText}>{infoModalMandi.contactPhone || '+91 98765 43210'}</Text>
                        </View>
                        <View style={styles.operatorDetailRow}>
                          <Ionicons name="mail" size={14} color="#059669" />
                          <Text style={styles.operatorDetailText}>{infoModalMandi.contactEmail || 'operator@apmc.gov.in'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Address & Hours */}
                    <View style={styles.infoSection}>
                      <Text style={styles.infoSectionTitle}>{t('mandi.modal_title')}</Text>
                      <Text style={styles.infoAddressText}>{infoModalMandi.address || infoModalMandi.district}</Text>
                      <Text style={styles.infoTimingText}>{t('mandi.hours')} {infoModalMandi.operatingHours || '05:30 AM - 07:00 PM (Mon - Sat)'}</Text>
                    </View>

                    {/* Accepted Crops Overview */}
                    <View style={styles.infoSection}>
                      <Text style={styles.infoSectionTitle}>All Accepted Crops (per KG)</Text>
                      <View style={styles.cropRatesGrid}>
                        {(
                          infoModalMandi.cropRates && infoModalMandi.cropRates.length > 0
                            ? infoModalMandi.cropRates
                            : (infoModalMandi.acceptedCrops || ['Wheat', 'Mustard', 'Onion', 'Tomato']).map((c) => ({
                                crop: c.trim(),
                                ratePerKg: c.trim() === 'Mustard' ? 52 : c.trim() === 'Wheat' ? 28 : c.trim() === 'Onion' ? 19 : 24,
                                availableKg: 10000,
                              }))
                        ).map((cr, idx) => (
                          <View key={idx} style={styles.cropRateCard}>
                            <View style={styles.cropRateHeader}>
                              <Ionicons name="leaf" size={14} color="#15803D" />
                              <Text style={styles.cropRateName}>{translateCropName(cr.crop, language)}</Text>
                            </View>
                            <Text style={styles.cropRatePrice}>₹{cr.ratePerKg} / KG</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                ) : (
                  /* Slots & Slot-Varying Crops View */
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>Configured Intake Slots &amp; Specific Crops</Text>
                    {infoModalMandi.slots && infoModalMandi.slots.length > 0 ? (
                      infoModalMandi.slots.map((slot, sIdx) => {
                        const booked = slot.bookedFarmers || 0;
                        const maxF = slot.maxFarmers || 20;
                        const waitMins = booked === 0 ? 0 : Math.min(booked * 6, 45);

                        // Crops specific to this slot
                        const allowedList = slot.allowedCrops && Array.isArray(slot.allowedCrops) && slot.allowedCrops.length > 0
                          ? slot.allowedCrops
                          : [{ crop: slot.crop || 'Wheat', ratePerKg: 28, quantityKg: 5000 }];

                        return (
                          <View key={sIdx} style={styles.slotDetailBox}>
                            <View style={styles.slotHeaderRow}>
                              <Ionicons name="time-outline" size={16} color="#059669" />
                              <Text style={styles.slotTitleText}>
                                Slot {sIdx + 1}: {slot.startTime} - {slot.endTime} ({slot.date})
                              </Text>
                            </View>

                            <View style={styles.slotMetricsGrid}>
                              <View style={styles.slotMetricItem}>
                                <Text style={styles.slotMetricLabel}>Queue Farmers</Text>
                                <Text style={styles.slotMetricVal}>{booked} / {maxF}</Text>
                              </View>
                              <View style={styles.slotMetricItem}>
                                <Text style={styles.slotMetricLabel}>Expected Wait</Text>
                                <Text style={styles.slotMetricVal}>{waitMins} mins</Text>
                              </View>
                              <View style={styles.slotMetricItem}>
                                <Text style={styles.slotMetricLabel}>Intake Capacity</Text>
                                <Text style={styles.slotMetricVal}>{(slot.totalCapacityKg || 10000).toLocaleString()} KG</Text>
                              </View>
                            </View>

                            {/* Crops available for this slot */}
                            <View style={styles.slotCropsSection}>
                              <Text style={styles.slotCropsLabel}>Allowed Crops for this Slot:</Text>
                              <View style={styles.slotCropsPillsRow}>
                                {allowedList.map((ac: any, idx: number) => (
                                  <View key={idx} style={styles.slotCropBadge}>
                                    <Ionicons name="leaf" size={11} color="#15803D" />
                                    <Text style={styles.slotCropBadgeText}>
                                      {translateCropName(ac.crop || ac, language)} @ ₹{ac.ratePerKg || 25}/KG
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.slotDetailBox}>
                        <View style={styles.slotHeaderRow}>
                          <Ionicons name="time-outline" size={16} color="#059669" />
                          <Text style={styles.slotTitleText}>Slot 1: 09:00 AM - 01:30 PM (Tomorrow)</Text>
                        </View>
                        <View style={styles.slotMetricsGrid}>
                          <View style={styles.slotMetricItem}>
                            <Text style={styles.slotMetricLabel}>Queue Farmers</Text>
                            <Text style={styles.slotMetricVal}>0 / 20</Text>
                          </View>
                          <View style={styles.slotMetricItem}>
                            <Text style={styles.slotMetricLabel}>Expected Wait</Text>
                            <Text style={styles.slotMetricVal}>0 mins</Text>
                          </View>
                          <View style={styles.slotMetricItem}>
                            <Text style={styles.slotMetricLabel}>Intake Capacity</Text>
                            <Text style={styles.slotMetricVal}>10,000 KG</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>

              <View style={styles.infoModalFooter}>
                <Pressable
                  onPress={() => {
                    const target = infoModalMandi;
                    setInfoModalMandi(null);
                    handleBookSlot(target);
                  }}
                  style={styles.infoModalBookBtn}>
                  <Text style={styles.infoModalBookBtnText}>{t('mandi.book_entry_pass')}</Text>
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
  searchSection: {
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
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: ThemeColors.textPrimary,
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ThemeColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  filterBtnActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primaryDark,
  },
  mapBtn: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primaryDark,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 8,
  },
  activeFiltersLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.textSecondary,
  },
  filterChipScroll: {
    gap: 6,
    alignItems: 'center',
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  locationHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
    gap: 6,
  },
  locationHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.primaryDark,
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 6,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  emptyCard: {
    backgroundColor: ThemeColors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginVertical: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  resetBtn: {
    marginTop: 14,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  mandiCard: {
    backgroundColor: ThemeColors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mandiTitleRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  mandiNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  mandiCodePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  mandiCodePillText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#15803D',
  },
  mandiName: {
    fontSize: 15,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
    letterSpacing: -0.2,
  },
  mandiDistrict: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  mandiAddress: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },

  // Top Commodity Strip at top of card
  topCommodityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCommodityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 5,
    flex: 1,
  },
  topCommodityLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  topCommodityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    flex: 1,
  },

  // Card Body
  cardBody: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  bodyLeftCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  operatingTimeText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  gateInfoText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  bodyRightCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
  },
  // Exactly SAME SIZE on right side (Requirement 6)
  uniformMetricText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    backgroundColor: ThemeColors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    height: 40,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  infoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // Pagination
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    gap: 4,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.textPrimary,
  },
  pageTextDisabled: {
    color: '#9CA3AF',
  },
  pageIndicatorPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.textSecondary,
  },

  // Info Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 12,
  },
  infoModalTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  infoModalName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  infoModalCode: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  infoCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoScroll: {
    maxHeight: 360,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 6,
  },
  infoAddressText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  infoTimingText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  cropTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cropTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  cropTagPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  rateHighlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rateHighlightLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  rateHighlightValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  metricBoxNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  metricBoxLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  infoModalFooter: {
    marginTop: 14,
  },
  infoModalBookBtn: {
    backgroundColor: ThemeColors.primary,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalBookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Operator Contact Card Styles
  operatorContactCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  operatorNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532D',
  },
  operatorRoleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
  },
  operatorDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  operatorDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },

  // Per-Crop Rates Grid Styles
  cropRatesGrid: {
    gap: 8,
  },
  cropRateCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cropRateName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
  },
  cropRatePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  cropRateCapacity: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Slot Detail Box Styles
  slotDetailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 8,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  slotMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  slotMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  slotMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  slotMetricVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },

  // Segmented Info Tab Styles
  infoTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
    gap: 4,
  },
  infoTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  infoTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  infoTabTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },

  // Slot Crops Section Styles
  slotCropsSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  slotCropsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  slotCropsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  slotCropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  slotCropBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
});

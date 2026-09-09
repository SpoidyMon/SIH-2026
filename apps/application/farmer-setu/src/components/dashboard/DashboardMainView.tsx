import React, { memo, useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatCardsList } from './StatCardsList';
import { CommodityTickerSection } from './CommodityTickerSection';
import { RecentBookingsList } from './RecentBookingsList';
import { AIAssistantModal } from './AIAssistantModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { translateMandiName, translateCropName } from '@/constants/translations';
import { getFarmerBookingsApi, getApprovedMandisApi } from '@/services/farmer.service';
import type { StatCardItem, BookingItem } from '@/interfaces';

interface DashboardMainViewProps {
  onNavigateToBookings: () => void;
  onNavigateToMandi: () => void;
  onNavigateToAi?: () => void;
}

export const DashboardMainView = memo(function DashboardMainView({
  onNavigateToBookings,
  onNavigateToMandi,
  onNavigateToAi,
}: DashboardMainViewProps) {
  const { token } = useAuth();
  const { language, t } = useLanguage();
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [totalMandisCount, setTotalMandisCount] = useState<number>(0);
  const [isAiModalVisible, setIsAiModalVisible] = useState<boolean>(false);

  // Fetch real bookings and mandi count from backend
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (token) {
        try {
          const bookingsRes = await getFarmerBookingsApi(token);
          if (isMounted && bookingsRes.success && bookingsRes.data?.bookings) {
            setDbBookings(bookingsRes.data.bookings);
          }
        } catch {}
      }

      try {
        const mandisRes = await getApprovedMandisApi(token || undefined);
        if (isMounted && mandisRes.success && mandisRes.data?.mandis) {
          setTotalMandisCount(mandisRes.data.mandis.length);
        }
      } catch {}
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Formatted booking items for recent bookings section
  const recentBookings: BookingItem[] = useMemo(() => {
    return dbBookings.map((b) => ({
      id: b.id,
      bookingCode: b.token || `BK-${b.id.slice(0, 4)}`,
      cropName: translateCropName(b.crop || 'Agricultural Produce', language),
      cropVariety: b.variety || 'Standard APMC Grade',
      mandiName: translateMandiName(b.mandiProfile?.mandiName || 'APMC Yard', language),
      gateNo: t('dash.gate_no', { no: 1 }),
      dateString: b.slot?.date || new Date(b.createdAt).toLocaleDateString(),
      timeSlot: `${b.slot?.startTime || '07:00'} - ${b.slot?.endTime || '11:00'}`,
      status: (b.status?.toLowerCase() === 'accepted' ? 'confirmed' : b.status?.toLowerCase() === 'completed' ? 'completed' : 'in_progress') as any,
      statusLabel: b.status === 'COMPLETED' ? t('status.completed') : b.status === 'ACCEPTED' ? t('status.confirmed') : t('status.in_progress'),
      progressPercent: b.status === 'COMPLETED' ? 100 : b.status === 'VERIFIED' ? 75 : 30,
      progressLabel: b.status === 'COMPLETED' ? t('status.transaction_completed') : b.status === 'VERIFIED' ? t('status.gate_verified') : t('status.slot_confirmed'),
      quantityQuintals: b.quantityQuintals || 0,
    }));
  }, [dbBookings, language, t]);

  // Calculate Real Metric Counts
  const totalBookingsCount = dbBookings.length;
  const activeBookingsCount = dbBookings.filter(
    (b) => b.status === 'PENDING' || b.status === 'ACCEPTED' || b.status === 'ARRIVED' || b.status === 'VERIFIED'
  ).length;

  // Total Crop Sold in kg (1 Quintal = 100 kg)
  const totalKgSold = dbBookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.quantityQuintals || 0) * 100, 0);

  const dynamicStats: StatCardItem[] = useMemo(() => {
    return [
      {
        id: 'stat-total-bookings',
        title: t('dash.total_bookings'),
        value: String(totalBookingsCount),
        colorTheme: 'mint',
        iconName: 'calendar-outline',
        subtitle: totalBookingsCount === 0 ? t('dash.no_bookings_desc') : t('dash.total_passes', { count: totalBookingsCount }),
      },
      {
        id: 'stat-crop-sold',
        title: t('dash.total_crop_sold'),
        value: `${totalKgSold}`,
        unit: 'kg',
        colorTheme: 'peach',
        iconName: 'leaf-outline',
        subtitle: totalKgSold === 0 ? t('dash.zero_kg') : t('dash.kg_completed', { count: totalKgSold }),
      },
      {
        id: 'stat-total-mandis',
        title: t('dash.total_mandis'),
        value: String(totalMandisCount),
        colorTheme: 'lavender',
        iconName: 'storefront-outline',
        subtitle: t('dash.cluster_name'),
      },
      {
        id: 'stat-active-bookings',
        title: t('dash.active_bookings'),
        value: String(activeBookingsCount),
        colorTheme: 'softGray',
        iconName: 'time-outline',
        subtitle: activeBookingsCount === 0 ? t('dash.no_active_slots') : t('dash.active_gate_slots', { count: activeBookingsCount }),
      },
    ];
  }, [totalBookingsCount, totalKgSold, totalMandisCount, activeBookingsCount, t]);

  const handleStatPress = (statId: string) => {
    if (statId === 'stat-total-mandis') {
      onNavigateToMandi();
    } else {
      onNavigateToBookings();
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}>
        
        {/* 2x2 Grid of pastel stat cards renamed as requested */}
        <View style={styles.statsSection}>
          <StatCardsList stats={dynamicStats} onCardPress={handleStatPress} />
        </View>

        {/* Live APMC Commodity Price Ticker */}
        <CommodityTickerSection onSelectCrop={() => onNavigateToMandi()} />

        {/* Recent Bookings Section (Empty state if 0 bookings) */}
        <RecentBookingsList
          bookings={recentBookings}
          onViewAllPress={onNavigateToBookings}
          onBookingPress={onNavigateToBookings}
          onExploreMandis={onNavigateToMandi}
        />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    paddingBottom: 80,
  },
  statsSection: {
    marginTop: 4,
    marginBottom: 6,
  },
  floatingAiBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0B2D1B',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(200, 245, 47, 0.4)',
  },
  floatingAiText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});


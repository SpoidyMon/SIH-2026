import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, BackHandler, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeColors } from '@/constants/theme';
import { FloatingBottomNav } from '@/components/navigation/FloatingBottomNav';
import { ProfileCompletionModal } from '@/components/dashboard/ProfileCompletionModal';
import {
  DashboardHeader,
  DashboardMainView,
  MandiSectionView,
  BookingsSectionView,
  SettingsSectionView,
  AiSectionView,
} from '@/components/dashboard';
import type { NavTabType } from '@/interfaces';

export default function FarmerDashboardScreen() {
  const { user, farmerProfile, farmerCode, isProfileComplete } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);

  const farmerName = user?.name || 'Ramesh Kisan';

  // Automatically trigger KYC popup on first load if profile is incomplete
  useEffect(() => {
    if (farmerProfile && !isProfileComplete) {
      const timer = setTimeout(() => {
        setProfileModalVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [farmerProfile, isProfileComplete]);

  // Prevent back action from popping back to auth screens
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return true;
      }
      return true; // prevent going back to auth
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeTab]);

  const getHeaderInfo = useCallback(() => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: t('nav.dashboard'),
          subtitle: t('nav.sub.dashboard', { name: farmerName }),
        };
      case 'mandi':
        return {
          title: t('nav.mandi'),
          subtitle: t('nav.sub.mandi'),
        };
      case 'ai':
        return {
          title: t('nav.ai'),
          subtitle: t('nav.sub.ai'),
        };
      case 'bookings':
        return {
          title: t('nav.bookings'),
          subtitle: t('nav.sub.bookings'),
        };
      case 'settings':
        return {
          title: t('nav.settings'),
          subtitle: t('nav.sub.settings'),
        };
    }
  }, [activeTab, farmerName, t]);

  const handleSearchPress = useCallback(() => {
    Alert.alert('Search Mandi Setu', 'Search crops, modal prices, mandi slots, or token numbers.', [
      { text: 'OK' },
    ]);
  }, []);

  const handleNotificationPress = useCallback(() => {
    Alert.alert(
      'Mandi Notifications',
      '• Morwadi APMC Sub-Yard daily auction rates updated.\n• Pimpri Chinchwad tomato mandi gates open.',
      [{ text: 'OK' }]
    );
  }, []);

  const headerInfo = getHeaderInfo();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header with Farmer ID & KYC Badges */}
        <DashboardHeader
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          farmerCode={farmerCode}
          isProfileComplete={isProfileComplete}
          onKycPress={() => setProfileModalVisible(true)}
          showSearchButton={activeTab === 'dashboard'}
          onSearchPress={handleSearchPress}
          onNotificationPress={handleNotificationPress}
          hasUnreadNotifications={true}
        />

        {/* Persistent Incomplete Profile Warning Banner */}
        {!isProfileComplete ? (
          <Pressable
            onPress={() => setProfileModalVisible(true)}
            style={({ pressed }) => [styles.kycWarningBanner, pressed && styles.pressed]}>
            <View style={styles.kycBannerLeft}>
              <View style={styles.warningIconCircle}>
                <Ionicons name="alert-circle" size={18} color="#B45309" />
              </View>
              <View style={styles.kycBannerTextCol}>
                <Text style={styles.kycBannerTitle}>{t('kyc.banner_title')}</Text>
                <Text style={styles.kycBannerSub}>
                  {t('kyc.banner_sub')}
                </Text>
              </View>
            </View>
            <View style={styles.completePill}>
              <Text style={styles.completePillText}>{t('kyc.verify_btn')}</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </View>
          </Pressable>
        ) : null}

        {/* Dynamic Section Content */}
        <View style={styles.contentArea}>
          {activeTab === 'dashboard' ? (
            <DashboardMainView
              onNavigateToBookings={() => setActiveTab('bookings')}
              onNavigateToMandi={() => setActiveTab('mandi')}
              onNavigateToAi={() => setActiveTab('ai')}
            />
          ) : null}

          {activeTab === 'mandi' ? <MandiSectionView /> : null}

          {activeTab === 'ai' ? <AiSectionView /> : null}

          {activeTab === 'bookings' ? <BookingsSectionView /> : null}

          {activeTab === 'settings' ? <SettingsSectionView /> : null}
        </View>

        {/* Sleek Floating Bottom Navigation Bar */}
        <FloatingBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Profile KYC Completion Modal */}
        <ProfileCompletionModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  contentArea: {
    flex: 1,
  },
  kycWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  kycBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  warningIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycBannerTextCol: {
    flex: 1,
  },
  kycBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  kycBannerSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
    lineHeight: 14,
  },
  completePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  completePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

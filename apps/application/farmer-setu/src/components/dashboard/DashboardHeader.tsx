import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  farmerCode?: string | null;
  isProfileComplete?: boolean;
  onKycPress?: () => void;
  showSearchButton?: boolean;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onAiPress?: () => void;
  hasUnreadNotifications?: boolean;
}

export const DashboardHeader = memo(function DashboardHeader({
  title,
  subtitle,
  farmerCode,
  isProfileComplete = true,
  onKycPress,
  showSearchButton = false,
  onSearchPress,
  onNotificationPress,
  onAiPress,
  hasUnreadNotifications = true,
}: DashboardHeaderProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        {farmerCode ? (
          <View style={styles.badgeRow}>
            <View style={styles.farmerIdPill}>
              <Text style={styles.farmerIdText}>ID: {farmerCode}</Text>
            </View>
            {!isProfileComplete ? (
              <Pressable
                onPress={onKycPress}
                style={({ pressed }) => [styles.kycPendingPill, pressed && styles.buttonPressed]}>
                <Ionicons name="warning" size={11} color="#B45309" />
                <Text style={styles.kycPendingText}>{t('kyc.incomplete')}</Text>
              </Pressable>
            ) : (
              <View style={styles.kycVerifiedPill}>
                <Ionicons name="checkmark-circle" size={11} color="#15803D" />
                <Text style={styles.kycVerifiedText}>{t('kyc.verified')}</Text>
              </View>
            )}
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.actionsRow}>
        {onAiPress ? (
          <Pressable
            onPress={onAiPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.aiIconButton, pressed && styles.buttonPressed]}>
            <Ionicons name="sparkles" size={19} color="#15803D" />
          </Pressable>
        ) : null}

        {showSearchButton ? (
          <Pressable
            onPress={onSearchPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}>
            <Ionicons name="search-outline" size={20} color={ThemeColors.textPrimary} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={onNotificationPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}>
          <Ionicons name="notifications-outline" size={20} color={ThemeColors.textPrimary} />
          {hasUnreadNotifications ? <View style={styles.unreadBadgeDot} /> : null}
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ThemeColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  aiIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ThemeColors.lavender,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  farmerIdPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  farmerIdText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.2,
  },
  kycPendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  kycPendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  kycVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  kycVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
});

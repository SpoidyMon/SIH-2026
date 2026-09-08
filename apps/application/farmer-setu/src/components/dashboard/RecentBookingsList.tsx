import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { translateMandiName, translateCropName } from '@/constants/translations';
import type { BookingItem, BookingStatus } from '@/interfaces';

interface RecentBookingsListProps {
  bookings: BookingItem[];
  onBookingPress?: (bookingId: string) => void;
  onViewAllPress?: () => void;
  onExploreMandis?: () => void;
}

export const RecentBookingsList = memo(function RecentBookingsList({
  bookings,
  onBookingPress,
  onViewAllPress,
  onExploreMandis,
}: RecentBookingsListProps) {
  const { language, t } = useLanguage();

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

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('dash.recent_bookings')}</Text>
        {bookings.length > 0 && onViewAllPress ? (
          <Pressable
            onPress={onViewAllPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.viewAllBtn, pressed && styles.pressed]}>
            <Text style={styles.viewAllText}>{t('dash.view_all')}</Text>
            <Ionicons name="chevron-forward" size={14} color={ThemeColors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* When no bookings exist, show clean empty state */}
      {bookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-outline" size={28} color={ThemeColors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('dash.no_recent_bookings')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('dash.no_recent_sub')}
          </Text>
          {onExploreMandis ? (
            <Pressable
              onPress={onExploreMandis}
              style={({ pressed }) => [styles.exploreBtn, pressed && styles.pressed]}>
              <Ionicons name="storefront-outline" size={16} color="#FFFFFF" />
              <Text style={styles.exploreBtnText}>{t('dash.explore_mandis')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.cardsList}>
          {bookings.map((booking) => {
            const statusStyle = getStatusBadge(booking.status);
            const qtyKg = booking.quantityKg ?? ((booking.quantityQuintals || 0) * 100);

            return (
              <Pressable
                key={booking.id}
                onPress={() => onBookingPress?.(booking.id)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                
                {/* Header: Status pill and Slot Code */}
                <View style={styles.cardHeader}>
                  <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {booking.queueNumber ? (
                      <View style={styles.queueBadge}>
                        <Text style={styles.queueBadgeText}>Q#{String(booking.queueNumber).padStart(3, '0')}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.codeText}>{booking.token || `#${booking.bookingCode}`}</Text>
                  </View>
                </View>

                {/* Crop & Mandi info */}
                <Text style={styles.cropTitle}>
                  {translateCropName(booking.cropName, language)} {booking.cropVariety ? `(${booking.cropVariety})` : ''}
                </Text>
                <Text style={styles.mandiSubtitle}>
                  {translateMandiName(booking.mandiName, language)} • {booking.gateNo}
                </Text>

                {/* Rejection Reason Notice */}
                {booking.rejectionReason && (
                  <View style={styles.rejectionNotice}>
                    <Ionicons name="alert-circle" size={14} color="#B91C1C" />
                    <Text style={styles.rejectionText}>
                      Reason: {booking.rejectionReason} (Slot reapplication blocked)
                    </Text>
                  </View>
                )}

                {/* Details footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.infoCol}>
                    <Ionicons name="calendar-outline" size={13} color={ThemeColors.textSecondary} />
                    <Text style={styles.infoText}>{booking.dateString}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Ionicons name="time-outline" size={13} color={ThemeColors.textSecondary} />
                    <Text style={styles.infoText}>{booking.timeSlot}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Ionicons name="cube-outline" size={13} color={ThemeColors.textSecondary} />
                    <Text style={styles.infoText}>{qtyKg.toLocaleString('en-IN')} KG</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 90,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
    letterSpacing: -0.3,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ThemeColors.primary,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardsList: {
    gap: 10,
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
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  cardHeader: {
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
  codeText: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.textMuted,
  },
  queueBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  queueBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B45309',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
    letterSpacing: -0.3,
  },
  mandiSubtitle: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  rejectionText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '700',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
  },
});

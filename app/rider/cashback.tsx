import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import Animated, { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

const TreasureChestModal = ({ visible, onClose, discountPercentage, hasOpened }: {
  visible: boolean;
  onClose: () => void;
  discountPercentage: number | null;
  hasOpened: boolean;
}) => {
  const scaleValue = useSharedValue(0);
  const [isOpen, setIsOpen] = useState(false);
  const [localDiscount, setLocalDiscount] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      // Update local discount when modal opens or discount changes
      if (discountPercentage !== null) {
        setLocalDiscount(discountPercentage);
        // Animate chest opening if not already opened
        if (!hasOpened) {
          setTimeout(() => {
            scaleValue.value = withTiming(1, {
              duration: 800,
              easing: Easing.elastic(1),
            });
            setIsOpen(true);
          }, 500);
        }
      }
    }
  }, [visible, discountPercentage, hasOpened]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#888" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>🎁 Your Reward Awaits!</Text>
          <Text style={styles.modalSubtitle}>
            Complete your first ride to unlock your treasure!
          </Text>

          <View style={styles.chestContainer}>
            <Animated.View style={{ transform: [{ scale: scaleValue.value }] }}>
              <MaterialCommunityIcons 
                name="treasure-chest" 
                size={150} 
                color={isOpen ? "#FFD700" : "#8B4513"} 
              />
            </Animated.View>
          </View>

          {isOpen && localDiscount !== null && (
            <View style={styles.revealContainer}>
              <Text style={styles.revealTitle}>Congratulations!</Text>
              <Text style={styles.revealText}>You won {localDiscount}% off your next ride!</Text>
              <TouchableOpacity style={styles.claimButton} onPress={onClose}>
                <Text style={styles.claimButtonText}>Claim Reward</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function RiderCashback() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [cashbackData, setCashbackData] = useState<any>(null);
  const [treasureModalVisible, setTreasureModalVisible] = useState(false);
  const [hasOpenedChest, setHasOpenedChest] = useState(false);

  useEffect(() => {
    loadCashbackData();
  }, []);

  const loadCashbackData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/user/cashback');
      setCashbackData(response);
    } catch (error: any) {
      console.error('Failed to load cashback data:', error);
      setCashbackData(null);
      Alert.alert('Error', 'Unable to load cashback data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChest = async () => {
    try {
      // Find the first ride bonus reward percentage
      const firstRideReward = cashbackData?.availableRewards?.find(
        (r: any) => r.cashback_programs?.program_type === 'first_ride'
      );

      // If no reward exists yet, create it by calling the API
      if (!firstRideReward && cashbackData?.stats?.first_ride_bonus_earned) {
        const response: any = await apiService.post('/user/cashback', {
          action: 'generate_first_ride_reward'
        });
        // Reload data to get the new reward
        await loadCashbackData();
      }
      setTreasureModalVisible(true);
    } catch (error: any) {
      console.error('Failed to generate reward:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate reward');
    }
  };

  const formatMoney = (value: number) => `₦${value.toLocaleString()}`;

  // Find the first ride bonus reward percentage
  const firstRideReward = cashbackData?.availableRewards?.find(
    (r: any) => r.cashback_programs?.program_type === 'first_ride'
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700', marginLeft: 12, flex: 1 }}>Cashback Rewards</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF8A00" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <MaterialCommunityIcons name="wallet-giftcard" size={24} color="#FF8A00" />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {formatMoney(cashbackData?.stats?.available_cashback_balance ?? 0)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Available Balance</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <MaterialCommunityIcons name="cash" size={24} color="#10B981" />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {formatMoney(cashbackData?.stats?.total_cashback_earned ?? 0)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total Earned</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <MaterialCommunityIcons name="history" size={24} color="#3B82F6" />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {cashbackData?.stats?.total_rides_completed ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Rides Completed</Text>
            </View>
          </View>

          {/* Treasure Chest Gamification */}
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="treasure-chest" size={24} color="#FF8A00" />
              <View style={styles.cardHeaderContent}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Your Treasure</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>Open to reveal your reward!</Text>
              </View>
            </View>
            <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              {cashbackData?.stats?.first_ride_bonus_earned
                ? "You have a treasure waiting! Tap the chest below to reveal your discount percentage (1-5% off)!"
                : "Complete your first ride to unlock your treasure chest with a random discount (1-5% off)!"}
            </Text>
            {cashbackData?.stats?.first_ride_bonus_earned && !hasOpenedChest && (
              <TouchableOpacity style={styles.chestButton} onPress={handleOpenChest}>
                <MaterialCommunityIcons name="treasure-chest" size={32} color="#FF8A00" />
                <Text style={styles.chestButtonText}>Open Chest</Text>
              </TouchableOpacity>
            )}
            {hasOpenedChest && firstRideReward && (
              <View style={styles.chestOpenedBadge}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                <Text style={styles.chestOpenedText}>Reward Revealed: {firstRideReward.discount_percentage}%</Text>
              </View>
            )}
          </View>

          {/* Available Rewards */}
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Available Rewards</Text>
            {!cashbackData || cashbackData?.availableRewards?.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No available rewards. Complete rides to earn cashback!
              </Text>
            ) : (
              cashbackData.availableRewards.map((reward: any) => (
                <View key={reward.id} style={[styles.rewardItem, { borderColor: theme.colors.border }]}>
                  <View style={styles.rewardIcon}>
                    <MaterialCommunityIcons name="tag" size={20} color="#FF8A00" />
                  </View>
                  <View style={styles.rewardContent}>
                    <Text style={[styles.rewardTitle, { color: theme.colors.textPrimary }]}>
                      {reward.cashback_programs?.name || 'Cashback Reward'}
                    </Text>
                    <Text style={[styles.rewardDiscount, { color: theme.colors.textSecondary }]}>
                      {reward.discount_percentage}% off
                      {reward.discount_amount > 0 && ` (max ${formatMoney(reward.discount_amount)})`}
                    </Text>
                    <Text style={[styles.rewardExpiry, { color: theme.colors.textSecondary }]}>
                      Expires: {reward.expires_at ? new Date(reward.expires_at).toLocaleDateString() : 'Never'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <TreasureChestModal
        visible={treasureModalVisible}
        onClose={async () => {
          setTreasureModalVisible(false);
          setHasOpenedChest(true);
          await loadCashbackData();
        }}
        discountPercentage={cashbackData?.availableRewards?.find((r: any) => r.cashback_programs?.program_type === 'first_ride')?.discount_percentage}
        hasOpened={hasOpenedChest}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight:  18,
  },
  chestButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  chestButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  chestOpenedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  chestOpenedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  rewardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardContent: {
    flex: 1,
    marginLeft: 12,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rewardDiscount: {
    fontSize: 12,
    marginTop: 2,
  },
  rewardExpiry: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 10,
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
    color: '#6b7280',
  },
  chestContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  revealContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  revealTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    color: '#1f2937',
  },
  revealText: {
    fontSize: 16,
    marginTop: 4,
    color: '#6b7280',
    textAlign: 'center',
  },
  claimButton: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

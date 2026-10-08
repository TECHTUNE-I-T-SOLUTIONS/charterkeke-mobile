import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import Animated, {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHEST_OPENED_KEY = '@charter_keke_chest_opened';

const TreasureChestModal = ({
  visible,
  onClose,
  discountPercentage,
  alreadyRevealed,
}: {
  visible: boolean;
  onClose: () => void;
  discountPercentage: number | null;
  alreadyRevealed: boolean;
}) => {
  const scaleValue = useSharedValue(alreadyRevealed ? 1 : 0);
  const [isOpen, setIsOpen] = useState(alreadyRevealed);

  // Animated style — never read .value in JSX
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  useEffect(() => {
    if (visible) {
      if (alreadyRevealed) {
        // Chest was opened before — show fully open immediately
        scaleValue.value = 1;
        setIsOpen(true);
      } else if (discountPercentage !== null) {
        // First time opening — animate
        scaleValue.value = 0;
        setIsOpen(false);
        setTimeout(() => {
          scaleValue.value = withTiming(1, {
            duration: 800,
            easing: Easing.elastic(1),
          });
          setIsOpen(true);
        }, 500);
      }
    }
  }, [visible, alreadyRevealed, discountPercentage]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#888" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>
            {alreadyRevealed ? '🎉 Your Reward' : '🎁 Your Reward Awaits!'}
          </Text>
          <Text style={styles.modalSubtitle}>
            {alreadyRevealed
              ? 'Your first ride discount is ready to use!'
              : 'Complete your first ride to unlock your treasure!'}
          </Text>

          <View style={styles.chestContainer}>
            {/* Use animatedStyle — NOT scaleValue.value directly */}
            <Animated.View style={animatedStyle}>
              <MaterialCommunityIcons
                name="treasure-chest"
                size={150}
                color={isOpen ? '#FFD700' : '#8B4513'}
              />
            </Animated.View>
          </View>

          {isOpen && discountPercentage !== null && (
            <View style={styles.revealContainer}>
              <Text style={styles.revealTitle}>
                {alreadyRevealed ? 'Your Reward 🎊' : 'Congratulations!'}
              </Text>
              <Text style={styles.revealText}>
                You {alreadyRevealed ? 'have' : 'won'} {discountPercentage}% off your next ride!
              </Text>
              <TouchableOpacity style={styles.claimButton} onPress={onClose}>
                <Text style={styles.claimButtonText}>
                  {alreadyRevealed ? 'Great!' : 'Claim Reward'}
                </Text>
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
  // Whether the user has ever opened the chest (persisted in AsyncStorage)
  const [chestOpenedBefore, setChestOpenedBefore] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    // Check AsyncStorage first for persisted chest-opened state
    try {
      const stored = await AsyncStorage.getItem(CHEST_OPENED_KEY);
      if (stored === 'true') setChestOpenedBefore(true);
    } catch (_) {}
    await loadCashbackData();
  };

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

  // The first_ride reward from the API — if it exists, user already unlocked it
  const firstRideReward = cashbackData?.availableRewards?.find(
    (r: any) => r.cashback_programs?.program_type === 'first_ride'
  );

  // Chest is considered opened if:
  // 1. User has opened it in this session (chestOpenedBefore from AsyncStorage), OR
  // 2. The API already returned a first_ride reward (means they opened it before and it's still valid)
  const chestAlreadyOpened = chestOpenedBefore || !!firstRideReward;

  const handleOpenChest = async () => {
    try {
      if (!firstRideReward && cashbackData?.stats?.first_ride_bonus_earned) {
        await apiService.post('/user/cashback', { action: 'generate_first_ride_reward' });
        await loadCashbackData();
      }
      setTreasureModalVisible(true);
    } catch (error: any) {
      console.error('Failed to generate reward:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate reward');
    }
  };

  const handleCloseModal = useCallback(async () => {
    setTreasureModalVisible(false);
    // Persist that the chest has been opened
    try {
      await AsyncStorage.setItem(CHEST_OPENED_KEY, 'true');
      setChestOpenedBefore(true);
    } catch (_) {}
    await loadCashbackData();
  }, []);

  const formatMoney = (value: number) => `₦${value.toLocaleString()}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontSize: 18,
            fontWeight: '700',
            marginLeft: 12,
            flex: 1,
          }}
        >
          Cashback Rewards
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF8A00" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <MaterialCommunityIcons name="wallet-giftcard" size={24} color="#FF8A00" />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {formatMoney(cashbackData?.stats?.available_cashback_balance ?? 0)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Available Balance
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <MaterialCommunityIcons name="cash" size={24} color="#10B981" />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {formatMoney(cashbackData?.stats?.total_cashback_earned ?? 0)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total Earned
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <MaterialCommunityIcons name="history" size={24} color="#3B82F6" />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {cashbackData?.stats?.total_rides_completed ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Rides Completed
              </Text>
            </View>
          </View>

          {/* Treasure Chest */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="treasure-chest" size={24} color="#FF8A00" />
              <View style={styles.cardHeaderContent}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  Your Treasure
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  {chestAlreadyOpened ? 'Your reward has been revealed!' : 'Open to reveal your reward!'}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              {cashbackData?.stats?.first_ride_bonus_earned
                ? chestAlreadyOpened
                  ? `You have a ${firstRideReward?.discount_percentage ?? ''}% discount ready to use on your next booking!`
                  : 'You have a treasure waiting! Tap the chest below to reveal your discount (1-5% off)!'
                : 'Complete your first ride to unlock your treasure chest with a random discount (1-5% off)!'}
            </Text>

            {/* Show "Open Chest" only if bonus earned but not yet opened */}
            {cashbackData?.stats?.first_ride_bonus_earned && !chestAlreadyOpened && (
              <TouchableOpacity style={styles.chestButton} onPress={handleOpenChest}>
                <MaterialCommunityIcons name="treasure-chest" size={32} color="#FF8A00" />
                <Text style={styles.chestButtonText}>Open Chest</Text>
              </TouchableOpacity>
            )}

            {/* Show "View Reward" if already opened */}
            {chestAlreadyOpened && firstRideReward && (
              <View>
                <View style={styles.chestOpenedBadge}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                  <Text style={styles.chestOpenedText}>
                    Reward Revealed: {firstRideReward.discount_percentage}% off
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.chestButton, { backgroundColor: '#FF8A0020', marginTop: 8 }]}
                  onPress={() => setTreasureModalVisible(true)}
                >
                  <MaterialCommunityIcons name="eye" size={20} color="#FF8A00" />
                  <Text style={[styles.chestButtonText, { color: '#FF8A00' }]}>View Reward</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Available Rewards */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Available Rewards
            </Text>
            {!cashbackData || cashbackData?.availableRewards?.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No available rewards. Complete rides to earn cashback!
              </Text>
            ) : (
              cashbackData.availableRewards.map((reward: any) => (
                <View
                  key={reward.id}
                  style={[styles.rewardItem, { borderColor: theme.colors.border }]}
                >
                  <View style={styles.rewardIcon}>
                    <MaterialCommunityIcons name="tag" size={20} color="#FF8A00" />
                  </View>
                  <View style={styles.rewardContent}>
                    <Text style={[styles.rewardTitle, { color: theme.colors.textPrimary }]}>
                      {reward.cashback_programs?.name || 'Cashback Reward'}
                    </Text>
                    <Text style={[styles.rewardDiscount, { color: theme.colors.textSecondary }]}>
                      {reward.discount_percentage}% off
                      {reward.discount_amount > 0 &&
                        ` (max ${formatMoney(reward.discount_amount)})`}
                    </Text>
                    <Text style={[styles.rewardExpiry, { color: theme.colors.textSecondary }]}>
                      Expires:{' '}
                      {reward.expires_at
                        ? new Date(reward.expires_at).toLocaleDateString()
                        : 'Never'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Used Rewards history */}
          {cashbackData?.usedRewards?.length > 0 && (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Used Rewards
              </Text>
              {cashbackData.usedRewards.map((reward: any) => (
                <View
                  key={reward.id}
                  style={[
                    styles.rewardItem,
                    { borderColor: theme.colors.border, opacity: 0.6 },
                  ]}
                >
                  <View style={[styles.rewardIcon, { backgroundColor: '#F3F4F6' }]}>
                    <MaterialCommunityIcons name="check" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.rewardContent}>
                    <Text style={[styles.rewardTitle, { color: theme.colors.textPrimary }]}>
                      {reward.cashback_programs?.name || 'Used Reward'}
                    </Text>
                    <Text style={[styles.rewardDiscount, { color: theme.colors.textSecondary }]}>
                      {reward.discount_percentage}% off · Saved{' '}
                      {formatMoney(reward.discount_amount || 0)}
                    </Text>
                    <Text style={[styles.rewardExpiry, { color: theme.colors.textSecondary }]}>
                      Used on: {reward.used_at ? new Date(reward.used_at).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <TreasureChestModal
        visible={treasureModalVisible}
        onClose={handleCloseModal}
        discountPercentage={firstRideReward?.discount_percentage ?? null}
        alreadyRevealed={chestAlreadyOpened}
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
    textAlign: 'center',
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
    lineHeight: 18,
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

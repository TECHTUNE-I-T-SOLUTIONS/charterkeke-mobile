import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { BRAND } from '@/utils/colors';

interface CancelRideModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (waiveFee: boolean) => void;
  isLoading: boolean;
  isFreeCancellation: boolean;
  fareAmount: number;
  cancellationPenaltyPercent: number;
  hasDriverAccepted: boolean;
}

export default function CancelRideModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
  isFreeCancellation,
  fareAmount,
  cancellationPenaltyPercent,
  hasDriverAccepted,
}: CancelRideModalProps) {
  const { theme } = useTheme();
  const isLight = theme.mode === 'light';

  const penaltyAmount = fareAmount * cancellationPenaltyPercent;
  const finalFare = fareAmount - penaltyAmount;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: isFreeCancellation ? '#FEF3C7' : '#FEE2E2' }]}>
              <MaterialCommunityIcons
                name={isFreeCancellation ? 'information' : 'alert-circle'}
                size={28}
                color={isFreeCancellation ? '#F59E0B' : '#EF4444'}
              />
            </View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {isFreeCancellation ? 'Cancel Ride' : 'Cancel Ride — Penalty Applies'}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
              {isFreeCancellation
                ? 'You are still within the free cancellation window. No fees will be charged.'
                : 'The free cancellation window has closed. A cancellation fee will be applied.'}
            </Text>

            {!isFreeCancellation && (
              <View style={[styles.penaltyBox, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                <View style={styles.penaltyRow}>
                  <Text style={[styles.penaltyLabel, { color: theme.colors.textSecondary }]}>Original Fare:</Text>
                  <Text style={[styles.penaltyValue, { color: theme.colors.textPrimary }]}>₦{fareAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.penaltyRow}>
                  <Text style={[styles.penaltyLabel, { color: theme.colors.textSecondary }]}>Cancellation Fee ({cancellationPenaltyPercent * 100}%):</Text>
                  <Text style={[styles.penaltyValue, { color: '#EF4444' }]}>-₦{penaltyAmount.toLocaleString()}</Text>
                </View>
                <View style={[styles.penaltyDivider, { backgroundColor: '#EF4444' }]} />
                <View style={styles.penaltyRow}>
                  <Text style={[styles.penaltyLabel, { color: theme.colors.textPrimary, fontWeight: '700' }]}>You'll be charged:</Text>
                  <Text style={[styles.penaltyValue, { color: '#EF4444', fontWeight: '700' }]}>₦{finalFare.toLocaleString()}</Text>
                </View>
              </View>
            )}

            {hasDriverAccepted && (
              <View style={[styles.infoBox, { backgroundColor: isLight ? '#F3F4F6' : '#374151' }]}>
                <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  The driver has already accepted this ride.
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary }]}>Keep Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onConfirm(isFreeCancellation)}
              disabled={isLoading}
              style={[styles.button, styles.primaryButton, { backgroundColor: isFreeCancellation ? BRAND.primary : '#EF4444' }]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isFreeCancellation ? 'Cancel Ride' : 'Cancel & Accept Penalty'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  penaltyBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  penaltyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  penaltyLabel: {
    fontSize: 13,
  },
  penaltyValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  penaltyDivider: {
    height: 1,
    marginVertical: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

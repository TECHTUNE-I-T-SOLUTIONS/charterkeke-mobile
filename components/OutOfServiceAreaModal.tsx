import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { COLORS, BRAND } from '@/utils/colors';

interface OutOfServiceAreaModalProps {
  visible: boolean;
  onClose: () => void;
  closestArea?: string;
  distance?: number;
  onNavigateToArea?: () => void;
  onAutoSelectNearestArea?: () => void;
}

export function OutOfServiceAreaModal({
  visible,
  onClose,
  closestArea,
  distance,
  onNavigateToArea,
  onAutoSelectNearestArea,
}: OutOfServiceAreaModalProps) {
  const { theme } = useTheme();
  const isLight = theme.mode === 'light';
  const colors = isLight ? COLORS.light : COLORS.dark;

  const themeStyles = {
    overlay: {
      backgroundColor: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.7)',
    },
    container: {
      backgroundColor: colors.surface,
    },
    title: {
      color: colors.textPrimary,
    },
    message: {
      color: colors.textSecondary,
    },
    detailsBox: {
      backgroundColor: isLight ? '#F0F4FF' : '#1a1f3a',
      borderColor: isLight ? '#D0DCFF' : '#2d3a7a',
    },
    detailLabel: {
      color: colors.textSecondary,
    },
    detailValue: {
      color: BRAND.primary,
    },
    areaBadge: {
      backgroundColor: isLight ? '#FFF5E6' : '#2a2410',
      borderColor: BRAND.primary,
    },
    areaBadgeText: {
      color: colors.textPrimary,
    },
    areasBox: {
      backgroundColor: isLight ? '#F5F5F5' : '#111827',
      borderColor: isLight ? '#E5E7EB' : '#374151',
    },
    areasTitle: {
      color: colors.textPrimary,
    },
    areasList: {
      color: colors.textSecondary,
    },
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.overlay, themeStyles.overlay]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, themeStyles.container]}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={64}
                color={BRAND.error}
              />
            </View>

            {/* Title */}
            <Text style={[styles.title, themeStyles.title]}>
              Outside Service Area
            </Text>

            {/* Message */}
            <Text style={[styles.message, themeStyles.message]}>
              This location isn't within our current service area yet.{'\n'}
              <Text style={{ fontWeight: '600' }}>
                We're expanding soon!
              </Text>
            </Text>

            {/* Closest Area Details */}
            {closestArea && (
              <View style={[styles.detailsBox, themeStyles.detailsBox]}>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons
                    name="map-search"
                    size={20}
                    color={BRAND.primary}
                  />
                  <View style={styles.detailText}>
                    <Text style={[styles.detailLabel, themeStyles.detailLabel]}>
                      Nearest Service Area
                    </Text>
                    <View style={styles.detailValueContainer}>
                      <Text
                        style={[styles.detailValue, themeStyles.detailValue]}
                      >
                        {closestArea}
                      </Text>
                      {distance !== undefined && (
                        <View style={[styles.areaBadge, themeStyles.areaBadge]}>
                          <Text
                            style={[
                              styles.areaBadgeText,
                              themeStyles.areaBadgeText,
                            ]}
                          >
                            {distance} km away
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Service Areas List */}
            <View style={[styles.areasBox, themeStyles.areasBox]}>
              <View style={styles.areasHeaderRow}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={BRAND.primary}
                />
                <Text
                  style={[
                    styles.areasTitle,
                    themeStyles.areasTitle,
                    { marginLeft: 8 },
                  ]}
                >
                  We Serve These Areas:
                </Text>
              </View>
              <Text style={[styles.areasList, themeStyles.areasList]}>
                <MaterialCommunityIcons name="circle-small" size={14} />{' '}
                <Text style={{ fontWeight: '600' }}>Shomolu Zone</Text> -
                Includes Palmgrove, Bariga, Onipanu{'\n'}
                <MaterialCommunityIcons name="circle-small" size={14} />{' '}
                <Text style={{ fontWeight: '600' }}>Ikeja Zone</Text> - Allen
                Avenue, Computer Village, Omole{'\n'}
                <MaterialCommunityIcons name="circle-small" size={14} />{' '}
                <Text style={{ fontWeight: '600' }}>Yaba Zone</Text> - Ebute
                Metta, Akoka, UNILAG{'\n'}
                <MaterialCommunityIcons name="circle-small" size={14} />{' '}
                <Text style={{ fontWeight: '600' }}>Lekki Zone</Text> - Phases
                1&2, Ikate, Oniru, Ajah{'\n'}
                <MaterialCommunityIcons name="circle-small" size={14} />{' '}
                <Text style={{ fontWeight: '600' }}>Ikoyi Zone</Text> -{' '}
                Falomo, Banana Island{'\n'}
                <MaterialCommunityIcons name="circle-small" size={14} />{' '}
                <Text style={{ fontWeight: '600' }}>VI Zone</Text> - Bar
                Beach, Eko Atlantic{'\n'}
                <MaterialCommunityIcons name="circle-small" size={14} />{' '}
                <Text style={{ fontWeight: '600' }}>Surulere Zone</Text> -
                Ojuelegba, Ijesha{'\n'}
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {onAutoSelectNearestArea && closestArea && (
                <TouchableOpacity
                  style={[styles.autoSelectButton, { backgroundColor: BRAND.primary }]}
                  onPress={onAutoSelectNearestArea}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="auto-fix"
                    size={20}
                    color="#000"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.autoSelectButtonText}>
                    Auto-Select {closestArea}
                  </Text>
                </TouchableOpacity>
              )}

              {onNavigateToArea && (
                <TouchableOpacity
                  style={[
                    styles.navigationButton,
                    {
                      borderColor: BRAND.primary,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={onNavigateToArea}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="map"
                    size={20}
                    color={BRAND.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.navigationButtonText, { color: BRAND.primary }]}>
                    View Service Areas Map
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.closeButtonStyled,
                  {
                    backgroundColor: isLight ? '#E5E7EB' : '#374151',
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Try Different Location
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 21,
  },
  detailsBox: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  detailValueContainer: {
    gap: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  areaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  areaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  areasBox: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  areasHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  areasTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  areasList: {
    fontSize: 13,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 12,
  },
  autoSelectButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoSelectButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  navigationButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navigationButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButtonStyled: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});


import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, BRAND } from '@/utils/colors';
import { OPERATIONAL_AREA_BOUNDARIES } from '@/utils/constants';

interface OperationalAreasModalProps {
  visible: boolean;
  onClose: () => void;
}

export const OperationalAreasModal: React.FC<OperationalAreasModalProps> = ({
  visible,
  onClose,
}) => {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const zones = Object.values(OPERATIONAL_AREA_BOUNDARIES);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        {/* Modal Content */}
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
            minHeight: '60%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              📍 Service Zones
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: 20,
              }}
            >
              Charter Keke operates across {zones.length} major zones in Lagos. Book rides within these service areas.
            </Text>
          </View>

          {/* Zones List - Scrollable */}
          <ScrollView
            style={{ 
              flex: 1,
              minHeight: 200,
            }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {zones && zones.length > 0 ? (
              <>
                {zones.map((zone, zoneIndex) => (
                  <View key={`zone-${zoneIndex}`} style={{ marginBottom: 20 }}>
                    {/* Zone Header */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 12,
                        paddingBottom: 10,
                        borderBottomWidth: 2,
                        borderBottomColor: BRAND.primary + '30',
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: BRAND.primary,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={16}
                          color="#000"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '700',
                            color: colors.text,
                          }}
                        >
                          {zone.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          Zone Code: {zone.zone}
                        </Text>
                      </View>
                    </View>

                    {/* Sub-areas List */}
                    <View
                      style={{
                        paddingLeft: 44,
                        backgroundColor: colors.surface + (isDark ? '40' : '80'),
                        borderRadius: 10,
                        padding: 12,
                      }}
                    >
                      {zone.areaNames.map((area, areaIndex) => (
                        <View
                          key={`area-${areaIndex}`}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: areaIndex < zone.areaNames.length - 1 ? 8 : 0,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="circle-small"
                            size={16}
                            color={BRAND.primary}
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.textSecondary,
                              flex: 1,
                              lineHeight: 18,
                            }}
                          >
                            {area}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}

                {/* Footer Note */}
                <View
                  style={{
                    backgroundColor: BRAND.primary + '15',
                    borderLeftWidth: 4,
                    borderLeftColor: BRAND.primary,
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 8,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      lineHeight: 18,
                    }}
                  >
                    <Text style={{ fontWeight: '600', color: colors.text }}>
                      💡 Always Stay In Zone:
                    </Text>
                    {' '}
                    Both pickup and drop-off locations must be within these service zones. If selected outside, you'll be alerted with the nearest service area.
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: 200 }}>
                <Text style={{ color: colors.textSecondary }}>No operational areas available</Text>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: BRAND.primary,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#000',
                  fontSize: 14,
                  fontWeight: '700',
              }}
              >
                Got It
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

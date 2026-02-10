// 'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { COLORS } from '@utils/colors';

const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function DocumentViewerScreen() {
  const router = useRouter();
  const { mode } = useTheme();
  const { url, title } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingHorizontal: scale(16),
          paddingVertical: scale(16),
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={scale(24)} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: scale(18), fontWeight: '600', color: colors.foreground }}>
            {title || 'Document'}
          </Text>
          <View style={{ width: scale(24) }} />
        </View>

        {/* Document View */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: scale(16) }}
          scrollEventThrottle={16}
        >
          <View style={{ paddingHorizontal: scale(16), paddingVertical: scale(20), alignItems: 'center' }}>
            <View style={{
              width: width - scale(32),
              borderRadius: scale(12),
              overflow: 'hidden',
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              {url ? (
                <Image
                  source={{ uri: typeof url === 'string' ? url : String(url) }}
                  style={{
                    width: '100%',
                    height: height * 0.6,
                    resizeMode: 'contain',
                    backgroundColor: colors.background,
                  }}
                  onLoadStart={() => setLoading(true)}
                  onLoadEnd={() => setLoading(false)}
                />
              ) : (
                <View style={{ 
                  width: '100%', 
                  height: height * 0.6, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: colors.card,
                }}>
                  <MaterialCommunityIcons name="file-question" size={scale(48)} color={colors.mutedForeground} />
                  <Text style={{ marginTop: scale(12), color: colors.mutedForeground, fontSize: scale(14) }}>
                    Document not available
                  </Text>
                </View>
              )}
              {loading && url && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            </View>

            {/* Info Section */}
            <View style={{
              marginTop: scale(24),
              paddingHorizontal: scale(16),
              paddingVertical: scale(16),
              backgroundColor: colors.card,
              borderRadius: scale(12),
              borderWidth: 1,
              borderColor: colors.border,
              width: '100%',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <MaterialCommunityIcons 
                  name="information" 
                  size={scale(20)} 
                  color={colors.primary}
                  style={{ marginRight: scale(12), marginTop: scale(2) }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: scale(12), fontWeight: '600', color: colors.foreground, marginBottom: scale(6) }}>
                    Document Information
                  </Text>
                  <Text style={{ fontSize: scale(11), color: colors.mutedForeground, lineHeight: scale(16) }}>
                    This is your {title || 'document'}. Please ensure it is clear and valid. If you need to update it, please contact support.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

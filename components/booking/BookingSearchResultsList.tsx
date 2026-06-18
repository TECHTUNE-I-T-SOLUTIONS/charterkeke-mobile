import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Keyboard } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BRAND } from '@/utils/colors';

type Props = {
  results: any[];
  onSelect: (item: any) => void;
  onClose?: () => void;
  theme: any;
  styles: any;
  title: string;
  subtitle?: string;
  emptyLabel?: string;
};

export function BookingSearchResultsList({ results, onSelect, onClose, theme, styles, title, subtitle, emptyLabel = 'No locations found' }: Props) {
  return (
    <View style={[styles.resultsList, { backgroundColor: theme.colors.inputBackground }]}>
      <View style={styles.resultsHeader}>
        <View>
          <Text style={[styles.resultsTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.resultsSubtitle, { color: theme.colors.textTertiary }]}>{subtitle}</Text>}
        </View>
        <TouchableOpacity onPress={() => onClose?.()} style={styles.resultsCloseButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialCommunityIcons name="close" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={[styles.resultsHint, { borderColor: theme.colors.border }]}>
        <MaterialCommunityIcons name="gesture-tap" size={14} color={BRAND.primary} />
        <Text style={[styles.resultsHintText, { color: theme.colors.textSecondary }]}>Tap once to select a location.</Text>
      </View>
      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator contentContainerStyle={{ paddingBottom: 8 }}>
        {results.map((item, idx) => (
          <TouchableOpacity
            key={`${item.address}-${idx}`}
            style={[styles.resultItem, { borderBottomColor: theme.colors.border, borderBottomWidth: idx < results.length - 1 ? 1 : 0 }]}
            onPress={() => {
              onSelect(item);
              Keyboard.dismiss();
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="map-marker" size={18} color={BRAND.primary} />
            <Text numberOfLines={2} style={[styles.resultText, { color: theme.colors.textPrimary }]}>{item.address}</Text>
          </TouchableOpacity>
        ))}
        {results.length === 0 && (
          <View style={styles.emptyResults}>
            <MaterialCommunityIcons name="map-search" size={32} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>{emptyLabel}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

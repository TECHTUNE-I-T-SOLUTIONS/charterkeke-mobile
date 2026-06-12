import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BRAND } from '@/utils/colors';

type Props = {
  label: string;
  value: string;
  icon: string;
  theme: any;
  styles: any;
  onEdit: () => void;
};

export function BookingPreviousChoice({ label, value, icon, theme, styles, onEdit }: Props) {
  return (
    <TouchableOpacity
      style={[styles.previousChoiceCard, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
      onPress={onEdit}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons name={icon as any} size={18} color={BRAND.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.previousChoiceLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text numberOfLines={1} style={[styles.previousChoiceValue, { color: theme.colors.textPrimary }]}>
          {value}
        </Text>
      </View>
      <Text style={[styles.previousChoiceEdit, { color: BRAND.primary }]}>Edit</Text>
    </TouchableOpacity>
  );
}

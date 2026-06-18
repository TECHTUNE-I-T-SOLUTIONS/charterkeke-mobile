import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BRAND } from '@/utils/colors';

type Props = {
  label: string;
  value: string;
  placeholder: string;
  icon: string;
  theme: any;
  styles: any;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onClear?: () => void;
};

export function BookingLocationField({
  label,
  value,
  placeholder,
  icon,
  theme,
  styles,
  onChangeText,
  onFocus,
  onClear,
}: Props) {
  return (
    <View style={styles.locationFieldCard}>
      <Text style={[styles.locationFieldLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <View style={[styles.locationFieldInputWrap, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={BRAND.primary} />
        <TextInput
          style={[styles.locationFieldInput, { color: theme.colors.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
        />
        {!!value && onClear ? (
          <TouchableOpacity onPress={onClear} style={styles.locationFieldClear} activeOpacity={0.8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

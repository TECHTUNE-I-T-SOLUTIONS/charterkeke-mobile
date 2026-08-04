import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BRAND } from '@/utils/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type StepPanelProps = {
  theme: any;
  styles: any;
  insets: { top: number; bottom: number };
  currentStep: 'pickup' | 'destination' | 'time' | 'review';
  title: string;
  stepLabel: string;
  showBack: boolean;
  onBack: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  keyboardHeight?: number;
};

export function BookingStepPanel({
  theme,
  styles,
  insets,
  currentStep,
  title,
  stepLabel,
  showBack,
  onBack,
  headerRight,
  children,
  keyboardHeight = 0,
}: StepPanelProps) {
  // Calculate a safe max height that considers top offset, keyboard, and bottom insets
  const topOffset = insets.top + 58;
  const bottomSpace = keyboardHeight > 0 ? keyboardHeight + 20 : insets.bottom + 20;
  const availableHeight = SCREEN_HEIGHT - topOffset - bottomSpace;

  return (
    <View
      style={[
        styles.stepSheet,
        {
          backgroundColor: theme.colors.surface,
          left: 12,
          right: 12,
          top: topOffset,
          bottom: undefined,
          maxHeight: Math.max(availableHeight, SCREEN_HEIGHT * 0.43), // Keep original as minimum but allow growth up to available space
          borderRadius: 26,
          paddingTop: 8,
          paddingBottom: 8,
          overflow: 'hidden',
          opacity: 90 / 100,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        },
      ]}
    >
      <View style={styles.sheetGrabberWrap}>
        <View style={styles.sheetGrabber} />
      </View>

      <View style={styles.stepHeader}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={[styles.stepBackButton, { backgroundColor: theme.colors.inputBackground }]} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.stepBackGhost} />
        )}
        <View style={styles.stepTitleWrap}>
          <Text style={[styles.stepEyebrow, { color: BRAND.primary }]}>{stepLabel}</Text>
          <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
        </View>
        {headerRight ? <View style={styles.stepHeaderRight}>{headerRight}</View> : <View style={styles.stepBackGhost} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.stepContent}>
        {children}
      </ScrollView>
    </View>
  );
}

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { COLORS } from '@/utils/colors';

interface ProfileSkeletonProps {
  isDark?: boolean;
}

export const ProfileSkeleton = ({ isDark = false }: ProfileSkeletonProps) => {
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <>
      {/* Profile Card Skeleton */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.profileContent}>
          {/* Profile Image Skeleton */}
          <View
            style={[
              styles.profileImageSkeleton,
              { backgroundColor: colors.border + '40' }
            ]}
          />
          
          {/* Name Skeleton */}
          <SkeletonLoader isDark={isDark} height={20} width="70%" marginBottom={8} />
          
          {/* Email Skeleton */}
          <SkeletonLoader isDark={isDark} height={14} width="80%" marginBottom={4} />
          
          {/* Phone Skeleton */}
          <SkeletonLoader isDark={isDark} height={14} width="75%" marginBottom={12} />

          {/* Stats Row Skeleton */}
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.statItem}>
              <SkeletonLoader isDark={isDark} height={16} width="60%" marginBottom={4} />
              <SkeletonLoader isDark={isDark} height={12} width="70%" marginBottom={0} />
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <SkeletonLoader isDark={isDark} height={16} width="60%" marginBottom={4} />
              <SkeletonLoader isDark={isDark} height={12} width="70%" marginBottom={0} />
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <SkeletonLoader isDark={isDark} height={16} width="60%" marginBottom={4} />
              <SkeletonLoader isDark={isDark} height={12} width="70%" marginBottom={0} />
            </View>
          </View>
        </View>
      </View>

      {/* Menu Skeleton */}
      <View style={[styles.menuSection, { borderTopColor: colors.border }]}>
        <SkeletonLoader isDark={isDark} height={16} width="40%" marginBottom={12} />
        {[1, 2, 3, 4].map((i) => (
          <View
            key={`menu-${i}`}
            style={[
              styles.menuItemSkeleton,
              { borderColor: colors.border, backgroundColor: colors.card || colors.background }
            ]}
          >
            <SkeletonLoader isDark={isDark} height={20} width="20%" marginBottom={0} />
            <SkeletonLoader isDark={isDark} height={14} width="40%" marginBottom={0} />
          </View>
        ))}
      </View>

      {/* Settings Skeleton */}
      <View style={[styles.menuSection, { borderTopColor: colors.border }]}>
        <SkeletonLoader isDark={isDark} height={16} width="40%" marginBottom={12} />
        {[1, 2, 3].map((i) => (
          <View
            key={`settings-${i}`}
            style={[
              styles.menuItemSkeleton,
              { borderColor: colors.border, backgroundColor: colors.card || colors.background }
            ]}
          >
            <SkeletonLoader isDark={isDark} height={20} width="20%" marginBottom={0} />
            <SkeletonLoader isDark={isDark} height={14} width="50%" marginBottom={0} />
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  profileContent: {
    alignItems: 'center',
  },
  profileImageSkeleton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  menuItemSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
});

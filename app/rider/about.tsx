import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

export default function AboutScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const features = [
    { icon: 'map-marker-radius', title: 'Easy Booking', description: 'Book a ride in seconds' },
    { icon: 'credit-card', title: 'Secure Payment', description: 'Multiple payment options' },
    { icon: 'star', title: 'Quality Service', description: 'Verified drivers and vehicles' },
    { icon: 'phone-in-talk', title: '24/7 Support', description: 'Always here to help' },
  ];

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(err => console.log('Could not open URL:', err));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About Charter Keke</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Logo Section */}
        <View style={[styles.logoSection, { backgroundColor: colors.card || colors.surfaceLight }]}>
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.primary + '20' }
            ]}
          >
            <MaterialCommunityIcons 
              name="taxi" 
              size={60} 
              color={colors.primary} 
            />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Charter Keke</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={[styles.descriptionTitle, { color: colors.text }]}>
            Our Mission
          </Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            Charter Keke is committed to making transportation affordable, reliable, and accessible to everyone. We connect riders with trusted drivers to provide safe and convenient rides across the city.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Why Choose Us?</Text>
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureItem,
                  { borderColor: colors.border, backgroundColor: colors.card || colors.background }
                ]}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: colors.primary + '20' }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name={feature.icon as any} 
                    size={24} 
                    color={colors.primary} 
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Company Info</Text>
          
          <View style={[styles.infoItem, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Founded</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>2023</Text>
          </View>

          <View style={[styles.infoItem, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Headquarters</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Lagos, Nigeria</Text>
          </View>

          <View style={[styles.infoItem, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Active Cities</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>Lagos, Abuja, Ibadan</Text>
          </View>

          <View style={[styles.infoItem, { borderTopColor: colors.border, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Support Email</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>support@charterkeke.com</Text>
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.socialSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Follow Us</Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity
              onPress={() => handleSocialLink('https://facebook.com/charterkeke')}
              style={[
                styles.socialButton,
                { backgroundColor: colors.card || colors.background, borderColor: colors.border }
              ]}
            >
              <MaterialCommunityIcons name="facebook" size={24} color={colors.primary} />
              <Text style={[styles.socialLabel, { color: colors.text }]}>Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialLink('https://twitter.com/charterkeke')}
              style={[
                styles.socialButton,
                { backgroundColor: colors.card || colors.background, borderColor: colors.border }
              ]}
            >
              <MaterialCommunityIcons name="twitter" size={24} color={colors.primary} />
              <Text style={[styles.socialLabel, { color: colors.text }]}>Twitter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialLink('https://instagram.com/charterkeke')}
              style={[
                styles.socialButton,
                { backgroundColor: colors.card || colors.background, borderColor: colors.border }
              ]}
            >
              <MaterialCommunityIcons name="instagram" size={24} color={colors.primary} />
              <Text style={[styles.socialLabel, { color: colors.text }]}>Instagram</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.legalSection}>
          <TouchableOpacity
            onPress={() => router.push('/rider/privacy-settings')}
            style={[
              styles.legalLink,
              { borderBottomColor: colors.border }
            ]}
          >
            <Text style={[styles.legalText, { color: colors.primary }]}>Privacy Policy</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/rider/terms')}
            style={[
              styles.legalLink,
              { borderTopColor: colors.border }
            ]}
          >
            <Text style={[styles.legalText, { color: colors.primary }]}>Terms & Conditions</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <Text style={[styles.copyright, { color: colors.textSecondary }]}>
          © 2026 Charter Keke. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoSection: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  version: {
    fontSize: 12,
  },
  descriptionSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  featuresSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  socialSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  socialLabel: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500',
  },
  legalSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 0,
  },
  legalLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  legalText: {
    fontSize: 13,
    fontWeight: '500',
  },
  copyright: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 24,
  },
});

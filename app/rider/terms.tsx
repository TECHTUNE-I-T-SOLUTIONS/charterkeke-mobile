import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { BRAND, COLORS } from '@/utils/colors';

export default function TermsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.content}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Last Updated: February 2026 | Version 2.2.1
          </Text>

          {/* Section 1 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>1. Acceptance of Terms</Text>
            <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
              By downloading, accessing, or using the Charter Keke mobile application ("Platform"), you agree to be bound by these Terms of Use and Legal Policy. If you do not agree to these terms, please refrain from using our service.
            </Text>
          </View>

          {/* Section 2 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>2. Cancellation & Delay Fee Policy</Text>
            <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
              To maintain reliability and fairness across the network for both riders and drivers, the following fee structure applies:
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • <Text style={styles.boldText}>Free Cancellation Window:</Text> Riders may cancel bookings at no cost as long as no driver has accepted the ride. Once a driver accepts the ride, you have a 5-minute free cancellation window from the time of acceptance.
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • <Text style={styles.boldText}>Rider Cancellation Fee:</Text> A 30% flat cancellation fee of the ride fare applies if a rider cancels a booking after the 5-minute window following driver acceptance.
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • <Text style={styles.boldText}>Driver Arrival Window:</Text> Drivers must arrive at the pickup location within 15 minutes of accepting the ride. If a driver fails to arrive within this window without valid communication, you may cancel without any fee and receive a 10% credit back of the ride fare.
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • <Text style={styles.boldText}>Driver Penalty for Lateness:</Text> Drivers who fail to arrive within the 15-minute window after accepting a ride will be penalized by adding 10% to their next remittance (usual 15% + 10% penalty = 25% total remittance).
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • <Text style={styles.boldText}>Driver Location Requirement:</Text> Drivers must keep their location service and data connection compulsorily enabled for the app to track their status and location properly. Failure to do so may result in penalties or account suspension.
            </Text>
          </View>

          {/* Section 3 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>3. Limitation of Liability & Disclaimers</Text>
            <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
              Charter Keke operates as a technology platform connecting riders with independent licensed tricycle ("Keke") drivers. Please note our liabilities:
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • <Text style={styles.boldText}>Independent Contractors:</Text> Drivers are independent operators and not employees of Charter Keke. Charter Keke is not liable for personal misconduct, route decisions, or traffic delays caused by drivers or road conditions.
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • <Text style={styles.boldText}>Lost or Left-Behind Items:</Text> Charter Keke is not responsible or liable for personal belongings left inside vehicles. Passengers are solely responsible for inspecting the vehicle prior to alighting. While our support team assists in contacting drivers to return lost items, a ₦1,000 driver delivery compensation fee applies to returned items.
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • <Text style={styles.boldText}>Third-Party & Indirect Damage:</Text> Charter Keke disclaims all liability for indirect, incidental, consequential, or special damages arising out of or related to trip disruptions, adverse weather conditions, or unexpected vehicle breakdowns.
            </Text>
          </View>

          {/* Section 4 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>4. Code of Conduct & Safety Rules</Text>
            <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
              All users (riders and drivers) must strictly adhere to the community safety guidelines:
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • Zero tolerance for physical or verbal harassment, discrimination, or abusive language.
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • Smoking, alcohol consumption, or carrying illegal substances inside vehicles is strictly prohibited.
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • Passengers must not exceed vehicle capacity (maximum 3 passengers per Keke).
            </Text>
            <Text style={[styles.bulletPoint, { color: theme.colors.textSecondary }]}>
              • Violation of safety rules results in immediate, permanent account suspension.
            </Text>
          </View>

          {/* Section 5 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>5. Payments, Wallets & Refunds</Text>
            <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
              All electronic wallet deposits, cash transfers, and ride fares are processed securely. Fare calculations are based on upfront distance and estimated duration. Fare adjustments may occur only if the destination is modified mid-ride or excessive detour occurs upon passenger request. Refund claims for erroneous charges must be reported via Customer Support within 48 hours.
            </Text>
          </View>

          {/* Section 6 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>6. Revisions & Governing Law</Text>
            <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
              Charter Keke reserves the right to amend these Terms of Use at any time. Continued use of the platform following modifications constitutes acceptance of the revised terms. These terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
            </Text>
          </View>

          {/* Contact Support */}
          <View style={[styles.contactSection, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.contactTitle, { color: theme.colors.textPrimary }]}>Legal or Support Inquiries</Text>
            <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
              If you have any questions or require legal clarification regarding these terms, please reach out to our team:
            </Text>
            <Text style={[styles.contactEmail, { color: BRAND.primary }]}>
              support@charterkeke.com
            </Text>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 6,
    marginBottom: 6,
  },
  boldText: {
    fontWeight: '700',
  },
  contactSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  contactEmail: {
    fontSize: 13,
    fontWeight: '700',
  },
});

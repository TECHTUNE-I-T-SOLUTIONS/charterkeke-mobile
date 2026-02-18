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
import { COLORS } from '@/utils/colors';

export default function TermsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.content}>
          {/* Version */}
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Last Updated: February 2026 | Version 1.0.0
          </Text>

          {/* Section 1 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              By accessing and using the Charter Keke application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </Text>
          </View>

          {/* Section 2 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Use License</Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              Permission is granted to temporarily download one copy of the materials (information or software) on Charter Keke's application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </Text>
            <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
              • Modifying or copying the materials
            </Text>
            <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
              • Using the materials for any commercial purpose or for any public display
            </Text>
            <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
              • Attempting to decompile or reverse engineer any software contained on the application
            </Text>
          </View>

          {/* Section 3 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Disclaimer</Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              The materials on Charter Keke's application are provided on an 'as is' basis. Charter Keke makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </Text>
          </View>

          {/* Section 4 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Limitations</Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              In no event shall Charter Keke or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the Charter Keke application.
            </Text>
          </View>

          {/* Section 5 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Accuracy of Materials</Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              The materials appearing on Charter Keke's application could include technical, typographical, or photographic errors. Charter Keke does not warrant that any of the materials on the application are accurate, complete, or current. Charter Keke may make changes to the materials contained on the application at any time without notice.
            </Text>
          </View>

          {/* Section 6 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Links</Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              Charter Keke has not reviewed all of the sites linked to its application and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Charter Keke of the site. Use of any such linked website is at the user's own risk.
            </Text>
          </View>

          {/* Section 7 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Modifications</Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              Charter Keke may revise these terms of service for the application at any time without notice. By using the application, you are agreeing to be bound by the then current version of these terms of service.
            </Text>
          </View>

          {/* Section 8 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Governing Law</Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              These terms and conditions are governed by and construed in accordance with the laws of Nigeria, and you irrevocably submit to the exclusive jurisdiction of the courts located in Nigeria.
            </Text>
          </View>

          {/* Contact */}
          <View style={[styles.contactSection, { backgroundColor: colors.card || colors.surfaceLight }]}>
            <Text style={[styles.contactTitle, { color: colors.text }]}>Questions?</Text>
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
              If you have any questions about these terms, please contact us at:
            </Text>
            <Text style={[styles.contactEmail, { color: colors.primary }]}>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 11,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
    marginBottom: 4,
  },
  contactSection: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 12,
    fontWeight: '600',
  },
});

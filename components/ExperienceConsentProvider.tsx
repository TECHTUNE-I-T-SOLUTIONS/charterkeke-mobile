import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getExperienceConsent, setExperienceConsent } from '@/services/experienceReporting';
import { BRAND } from '@/utils/colors';

type ExperienceConsentContextType = { consent: boolean | null; requestConsent: () => void };
const ExperienceConsentContext = createContext<ExperienceConsentContextType | null>(null);

export function useExperienceConsent() {
  const value = useContext(ExperienceConsentContext);
  if (!value) throw new Error('useExperienceConsent must be used within ExperienceConsentProvider');
  return value;
}

export function ExperienceConsentProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const [consent, setConsent] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const loadSequence = useRef(0);

  useEffect(() => {
    if (isLoading) return;
    const sequence = ++loadSequence.current;
    let active = true;
    setVisible(false);
    getExperienceConsent().then((value) => {
      if (!active || sequence !== loadSequence.current) return;
      setConsent(value);
      setVisible(value === null && !!user);
    });
    return () => {
      active = false;
    };
  }, [user?.id, isLoading]);

  const choose = useCallback(async (granted: boolean) => {
    if (saving) return;
    // Invalidate any consent read that started before the user's choice was saved.
    loadSequence.current += 1;
    setSaving(true);
    setSaveError('');
    try {
      await setExperienceConsent(granted);
      setConsent(granted);
      setVisible(false);
    } catch {
      setSaveError('Your choice could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [saving]);

  const requestConsent = useCallback(() => setVisible(true), []);
  return (
    <ExperienceConsentContext.Provider value={{ consent, requestConsent }}>
      {children}
      <Modal visible={visible && !!user && !isLoading} transparent animationType="fade" onRequestClose={() => { if (!saving) void choose(false); }} statusBarTranslucent>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!saving) void choose(false); }} />
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.icon}><MaterialCommunityIcons name="chart-box-outline" size={28} color={BRAND.primary} /></View>
            <Text style={[styles.eyebrow, { color: BRAND.primary }]}>OPTIONAL PRIVACY CHOICE</Text>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Help improve Charter Keke</Text>
            <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
              If you agree, Charter Keke may use limited app diagnostics, such as error details, screen names, and feature success or failure counts, to understand issues and improve the app. We do not collect message contents, payment details, or precise location through this feature. You can change your choice in Privacy & Security.
            </Text>
            {saveError ? <Text style={[styles.saveError, { color: theme.colors.error || '#ef4444' }]}>{saveError}</Text> : null}
            <TouchableOpacity disabled={saving} style={[styles.primaryButton, { opacity: saving ? 0.65 : 1 }]} onPress={() => void choose(true)}>
              <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Allow optional diagnostics'}</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={saving} style={[styles.secondaryButton, saving && { opacity: 0.65 }]} onPress={() => void choose(false)}>
              <Text style={[styles.secondaryText, { color: theme.colors.textSecondary }]}>{saving ? 'Saving…' : 'Not now'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ExperienceConsentContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', alignItems: 'center', padding: 22 },
  card: { width: '100%', maxWidth: 420, padding: 22, borderRadius: 22, borderWidth: 1 },
  icon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#FF910122', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 21, marginBottom: 18 },
  primaryButton: { backgroundColor: BRAND.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#1A1206', fontSize: 14, fontWeight: '900' },
  secondaryButton: { paddingVertical: 13, alignItems: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '700' },
  saveError: { fontSize: 12, lineHeight: 18, marginBottom: 10, textAlign: 'center' },
});

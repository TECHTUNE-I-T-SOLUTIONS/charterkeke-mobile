import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RideReceiptFormat } from '@/utils/rideReceipt';
import { BRAND } from '@/utils/colors';

type Props = {
  visible: boolean;
  mode: 'share' | 'download';
  onClose: () => void;
  onSelect: (format: RideReceiptFormat) => void;
  colors: {
    surface: string;
    background: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
  };
};

export function RideReceiptExportModal({ visible, mode, onClose, onSelect, colors }: Props) {
  const verb = mode === 'share' ? 'Share' : 'Download';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{verb} ride details</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose a polished receipt format.</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => onSelect('image')} style={[styles.option, styles.primaryOption]}>
            <View style={styles.iconWrapDark}>
              <MaterialCommunityIcons name="image" size={24} color="#000" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.primaryTitle}>PNG Image</Text>
              <Text style={styles.primarySub}>High-quality receipt screenshot, best for WhatsApp and quick sharing.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onSelect('pdf')} style={[styles.option, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <View style={[styles.iconWrap, { backgroundColor: `${BRAND.primary}22` }]}>
              <MaterialCommunityIcons name="file-pdf-box" size={25} color={BRAND.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>PDF Document</Text>
              <Text style={[styles.optionSub, { color: colors.textSecondary }]}>Best for printing, email records, and official support reference.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  option: {
    minHeight: 98,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  primaryOption: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  iconWrap: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconWrapDark: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.12)' },
  optionText: { flex: 1 },
  primaryTitle: { color: '#000', fontSize: 16, fontWeight: '900' },
  primarySub: { color: 'rgba(0,0,0,0.72)', fontSize: 12, lineHeight: 17, marginTop: 4, fontWeight: '600' },
  optionTitle: { fontSize: 16, fontWeight: '900' },
  optionSub: { fontSize: 12, lineHeight: 17, marginTop: 4, fontWeight: '600' },
});

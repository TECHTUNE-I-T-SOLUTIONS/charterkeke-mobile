import React, { useState, useMemo } from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BRAND } from '@/utils/colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PickupTimeModalProps {
  visible: boolean;
  onConfirm: (pickupTime: string) => void;
  onCancel: () => void;
  theme: any;
  isLoading?: boolean;
}

export function PickupTimeModal({
  visible,
  onConfirm,
  onCancel,
  theme,
  isLoading = false,
}: PickupTimeModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const quickTimes = useMemo(() => {
    const now = new Date();
    const times: Array<{
      group: string;
      label: string;
      sublabel: string;
      icon: string;
      date: Date;
    }> = [];

    // Today - quick offsets
    const todaySlots = [
      { label: 'ASAP', sublabel: 'Now', icon: 'flash', offset: 0 },
      { label: '30 min', sublabel: 'Soon', icon: 'clock-fast', offset: 30 },
      { label: '1 hour', sublabel: 'Soon', icon: 'clock', offset: 60 },
      { label: '2 hours', sublabel: 'Later', icon: 'clock-outline', offset: 120 },
      { label: '4 hours', sublabel: 'Later', icon: 'sun-clock', offset: 240 },
      { label: '8 hours', sublabel: 'Evening', icon: 'moon-waning-crescent', offset: 480 },
    ];

    todaySlots.forEach((slot) => {
      const slotDate = new Date(now);
      slotDate.setMinutes(slotDate.getMinutes() + slot.offset);
      times.push({
        group: 'Today',
        label: slot.label,
        sublabel: slot.sublabel,
        icon: slot.icon,
        date: slotDate,
      });
    });

    // Next 6 days
    for (let dayOffset = 1; dayOffset < 7; dayOffset++) {
      const baseDate = new Date(now);
      baseDate.setDate(baseDate.getDate() + dayOffset);
      baseDate.setHours(8, 0, 0, 0);

      const dayTimes = [
        { label: '8:00 AM', sublabel: 'Morning', icon: 'white-balance-sunny', hour: 8 },
        { label: '12:00 PM', sublabel: 'Afternoon', icon: 'sun-clock', hour: 12 },
        { label: '6:00 PM', sublabel: 'Evening', icon: 'moon-waning-crescent', hour: 18 },
      ];

      dayTimes.forEach((slot) => {
        const slotDate = new Date(baseDate);
        slotDate.setHours(slot.hour, 0, 0, 0);
        times.push({
          group: dayOffset === 1 ? 'Tomorrow' : `Day ${dayOffset + 1}`,
          label: slot.label,
          sublabel: slot.sublabel,
          icon: slot.icon,
          date: slotDate,
        });
      });
    }

    return times.slice(0, 24);
  }, []);

  const groupedQuickTimes = useMemo(() => {
    const groups = new Map<string, typeof quickTimes>();
    quickTimes.forEach((slot) => {
      const list = groups.get(slot.group) || [];
      list.push(slot);
      groups.set(slot.group, list);
    });
    return Array.from(groups.entries()).map(([group, slots]) => ({ group, slots }));
  }, [quickTimes]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setSelectedDate(newDate);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setSelectedDate(newDate);
    }
  };

  const handleConfirm = () => {
    const formattedTime = formatPickupTime(selectedDate);
    onConfirm(formattedTime);
  };

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  const isSelected = (dateTime: Date) => {
    return (
      selectedDate.getFullYear() === dateTime.getFullYear() &&
      selectedDate.getMonth() === dateTime.getMonth() &&
      selectedDate.getDate() === dateTime.getDate() &&
      selectedDate.getHours() === dateTime.getHours() &&
      selectedDate.getMinutes() === dateTime.getMinutes()
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      hardwareAccelerated
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onCancel} disabled={isLoading}>
            <Text style={[styles.headerButton, { color: BRAND.primary, opacity: isLoading ? 0.5 : 1 }]}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="clock-check" size={20} color={BRAND.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, marginLeft: 8 }]}>Pickup Time</Text>
          </View>
          <TouchableOpacity onPress={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={BRAND.primary} />
            ) : (
              <Text style={[styles.headerButton, { color: BRAND.primary, fontWeight: '700' }]}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.doneHint, { backgroundColor: BRAND.primary + '10', borderColor: BRAND.primary + '35' }]}>
            <MaterialCommunityIcons name="arrow-up-right-bold" size={17} color={BRAND.primary} />
            <Text style={[styles.doneHintText, { color: theme.colors.textSecondary }]}>
              Select a time, then tap Done at the top-right to continue booking.
            </Text>
          </View>

          {/* Current Selection Card */}
          <LinearGradient
            colors={[BRAND.primary + '15', BRAND.primary + '08']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.selectionCard}
          >
            <View style={styles.selectionHeader}>
              <View style={styles.selectionIconBg}>
                <MaterialCommunityIcons name="calendar-clock" size={28} color={BRAND.primary} />
              </View>
              <View style={styles.selectionInfo}>
                <Text style={[styles.selectionLabel, { color: theme.colors.textSecondary }]}>Selected Time</Text>
                <Text style={[styles.selectionDate, { color: theme.colors.textPrimary }]}>
                  {getDayLabel(selectedDate, new Date())}
                </Text>
              </View>
            </View>
            <View style={[styles.selectionDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.selectionFooter}>
              <View style={styles.selectionTimeBox}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={BRAND.primary} />
                <Text style={[styles.selectionTime, { color: theme.colors.textPrimary }]}>
                  {formatTimeDisplay(selectedDate)}
                </Text>
              </View>
              <View style={[styles.selectionBadge, { backgroundColor: BRAND.primary }]}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
              </View>
            </View>
          </LinearGradient>

          {/* Quick Select Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={BRAND.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginLeft: 6 }]}>Quick Select</Text>
            </View>

            {groupedQuickTimes.map(({ group, slots }) => (
              <View key={group} style={styles.groupSection}>
                <Text style={[styles.groupLabel, { color: theme.colors.textPrimary }]}>{group}</Text>
                <View style={styles.gridContainer}>
                  {slots.map((time, idx) => {
                    const selected = isSelected(time.date);
                    return (
                      <TouchableOpacity
                        key={`${group}-${idx}`}
                        style={[
                          styles.gridTimeButton,
                          {
                            backgroundColor: selected ? BRAND.primary : theme.colors.inputBackground,
                            borderColor: selected ? BRAND.primary : theme.colors.border,
                            borderWidth: 2,
                          },
                        ]}
                        onPress={() => setSelectedDate(time.date)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={time.icon as any}
                          size={24}
                          color={selected ? '#fff' : BRAND.primary}
                          style={styles.gridIcon}
                        />
                        <Text
                          style={[
                            styles.gridTimeLabel,
                            {
                              color: selected ? '#fff' : theme.colors.textPrimary,
                            },
                          ]}
                        >
                          {time.label}
                        </Text>
                        <Text
                          style={[
                            styles.gridTimeSublabel,
                            {
                              color: selected ? 'rgba(255,255,255,0.85)' : theme.colors.textSecondary,
                            },
                          ]}
                        >
                          {time.sublabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Custom Pickers */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="tune" size={18} color={BRAND.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginLeft: 6 }]}>Custom Time</Text>
            </View>
            
            <View style={styles.pickerButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  { 
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.pickerIconBg, { backgroundColor: BRAND.primary + '15' }]}>
                  <MaterialCommunityIcons name="calendar" size={22} color={BRAND.primary} />
                </View>
                <View style={styles.pickerInfo}>
                  <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>Date</Text>
                  <Text style={[styles.pickerValue, { color: theme.colors.textPrimary }]}>
                    {getDayLabel(selectedDate, new Date())}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.textSecondary}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.pickerIconBg, { backgroundColor: BRAND.primary + '15' }]}>
                  <MaterialCommunityIcons name="clock-outline" size={22} color={BRAND.primary} />
                </View>
                <View style={styles.pickerInfo}>
                  <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>Time</Text>
                  <Text style={[styles.pickerValue, { color: theme.colors.textPrimary }]}>
                    {formatTimeDisplay(selectedDate)}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.textSecondary}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: BRAND.primary + '08', borderColor: BRAND.primary + '30' }]}>
            <View style={[styles.infoBadge, { backgroundColor: BRAND.primary + '20' }]}>
              <MaterialCommunityIcons name="lightbulb-outline" size={16} color={BRAND.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>Schedule Ahead</Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                Book rides up to 7 days in advance. Drivers get your exact pickup time.
              </Text>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={minDate}
            maximumDate={maxDate}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            is24Hour={true}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function getDayLabel(date: Date, reference: Date): string {
  const today = new Date(reference);
  const tomorrow = new Date(reference);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function formatTimeDisplay(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatPickupTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerButton: {
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  doneHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  doneHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  selectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: BRAND.primary + '30',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  selectionDate: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectionDivider: {
    height: 1,
    marginVertical: 12,
  },
  selectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionTime: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  selectionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 28,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridTimeButton: {
    width: (width - 52) / 3,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIcon: {
    marginBottom: 6,
  },
  gridTimeLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  gridTimeSublabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  pickerButtonsRow: {
    gap: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickerInfo: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pickerValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});

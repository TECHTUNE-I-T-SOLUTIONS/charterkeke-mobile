import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';
import { isValidPhone } from '@/utils/validation';
import { apiService } from '@/services/api';
import { EmergencyContactsSkeleton } from '@/components/EmergencyContactsSkeleton';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const screenLaunchedOnce = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!screenLaunchedOnce.current) {
        screenLaunchedOnce.current = true;
        fetchEmergencyContacts();
      }
    }, [])
  );

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true);
      console.log('📤 [EMERGENCY-CONTACTS] Fetching contacts from API...');
      
      const userDetailsRes = await apiService.get('/user/details');
      console.log('✅ [EMERGENCY-CONTACTS] User details fetched:', userDetailsRes);
      
      const user = userDetailsRes.user;
      // In production, emergency contacts would be stored in a dedicated endpoint
      // For now, we'll use the emergency_contact and emergency_phone from user details
      if (user.emergency_contact || user.emergency_phone) {
        setEmergencyContacts([
          {
            id: '1',
            name: user.emergency_contact || 'Emergency Contact',
            phone: user.emergency_phone || '',
            relationship: 'Family',
          },
        ]);
      }
    } catch (error) {
      console.error('❌ [EMERGENCY-CONTACTS] Error fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEmergencyContactsToAPI = async (contacts: EmergencyContact[]) => {
    try {
      const primaryContact = contacts.find(c => c.id === '1');
      if (primaryContact) {
        console.log('📤 [EMERGENCY-CONTACTS] Saving contacts to API...');
        await apiService.put('/user/details', {
          emergency_contact: primaryContact.name,
          emergency_phone: primaryContact.phone,
        });
        console.log('✅ [EMERGENCY-CONTACTS] Contacts saved');
      }
    } catch (error) {
      console.error('❌ [EMERGENCY-CONTACTS] Error saving contacts:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!isValidPhone(formData.phone)) newErrors.phone = 'Invalid phone number';
    if (!formData.relationship.trim()) newErrors.relationship = 'Relationship is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddContact = () => {
    if (!validateForm()) return;

    let updatedContacts;
    if (editingId) {
      updatedContacts = emergencyContacts.map((contact) =>
        contact.id === editingId ? { ...contact, ...formData } : contact
      );
    } else {
      updatedContacts = [
        ...emergencyContacts,
        {
          id: Date.now().toString(),
          ...formData,
        },
      ];
    }

    setEmergencyContacts(updatedContacts);
    saveEmergencyContactsToAPI(updatedContacts);

    setFormData({ name: '', phone: '', relationship: '' });
    setShowAddModal(false);
    setEditingId(null);
    setErrors({});
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    });
    setEditingId(contact.id);
    setShowAddModal(true);
  };

  const handleDeleteContact = (id: string) => {
    Alert.alert('Delete Contact', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: () => {
          const updatedContacts = emergencyContacts.filter((contact) => contact.id !== id);
          setEmergencyContacts(updatedContacts);
          saveEmergencyContactsToAPI(updatedContacts);
        },
        style: 'destructive',
      },
    ]);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', relationship: '' });
    setErrors({});
  };

  const relationshipOptions = ['Mother', 'Father', 'Brother', 'Sister', 'Spouse', 'Friend', 'Other'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Emergency Contacts</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <EmergencyContactsSkeleton />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {emergencyContacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="phone-alert" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No emergency contacts added
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Add a contact by tapping the plus icon above
            </Text>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {emergencyContacts.map((contact) => (
              <View
                key={contact.id}
                style={[
                  styles.contactCard,
                  { borderColor: colors.border, backgroundColor: colors.card || colors.background }
                ]}
              >
                <View style={styles.contactInfo}>
                  <MaterialCommunityIcons name="phone" size={24} color={colors.primary} />
                  <View style={styles.contactDetails}>
                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                    <Text style={[styles.contactRelationship, { color: colors.textSecondary }]}>
                      {contact.relationship}
                    </Text>
                    <Text style={[styles.contactPhone, { color: colors.primary }]}>{contact.phone}</Text>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleEditContact(contact)}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteContact(contact.id)}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons name="delete" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <SafeAreaView
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background }
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingId ? 'Edit Contact' : 'Add Contact'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.modalContent}>
                {/* Name */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? colors.card : '#F5F5F5',
                        color: colors.text,
                        borderColor: errors.name ? colors.destructive : colors.border,
                      }
                    ]}
                    placeholder="Full name"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.name}
                    onChangeText={(value) => {
                      setFormData(prev => ({ ...prev, name: value }));
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                  />
                  {errors.name && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.name}</Text>}
                </View>

                {/* Phone */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? colors.card : '#F5F5F5',
                        color: colors.text,
                        borderColor: errors.phone ? colors.destructive : colors.border,
                      }
                    ]}
                    placeholder="Phone number"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.phone}
                    onChangeText={(value) => {
                      setFormData(prev => ({ ...prev, phone: value }));
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    keyboardType="phone-pad"
                  />
                  {errors.phone && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.phone}</Text>}
                </View>

                {/* Relationship */}
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Relationship *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.relationshipOptions}
                  >
                    {relationshipOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          setFormData(prev => ({ ...prev, relationship: option }));
                          if (errors.relationship) setErrors(prev => ({ ...prev, relationship: '' }));
                        }}
                        style={[
                          styles.relationshipButton,
                          {
                            backgroundColor:
                              formData.relationship === option ? colors.primary : colors.card || colors.background,
                            borderColor: colors.border,
                          }
                        ]}
                      >
                        <Text
                          style={[
                            styles.relationshipButtonText,
                            {
                              color:
                                formData.relationship === option ? 'white' : colors.text,
                            }
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {errors.relationship && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.relationship}</Text>
                  )}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleAddContact}
                  disabled={loading}
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingId ? 'Update Contact' : 'Add Contact'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 8,
  },
  contactsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactRelationship: {
    fontSize: 11,
    marginTop: 2,
  },
  contactPhone: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },
  relationshipOptions: {
    marginTop: 8,
  },
  relationshipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  relationshipButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  SafeAreaView as RNSafeAreaView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { COLORS } from '@/utils/colors';
import { isValidPhone } from '@/utils/validation';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const colors = isDark ? COLORS.dark : COLORS.light;

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Adeyemi Tayo',
      phone: '+2348012345670',
      relationship: 'Mother',
    },
    {
      id: '2',
      name: 'Okafor Daniel',
      phone: '+2348012345671',
      relationship: 'Brother',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (editingId) {
      setEmergencyContacts(
        emergencyContacts.map((contact) =>
          contact.id === editingId
            ? { ...contact, ...formData }
            : contact
        )
      );
      setEditingId(null);
    } else {
      setEmergencyContacts([
        ...emergencyContacts,
        {
          id: Date.now().toString(),
          ...formData,
        },
      ]);
    }

    setFormData({ name: '', phone: '', relationship: '' });
    setShowAddModal(false);
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
    setEmergencyContacts(
      emergencyContacts.filter((contact) => contact.id !== id)
    );
  };

  const handleCallContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', relationship: '' });
    setErrors({});
  };

  const relationshipOptions = ['Mother', 'Father', 'Brother', 'Sister', 'Spouse', 'Friend', 'Other'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 28, color: colors.primary }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
            Emergency Contacts
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Info Card */}
        <Card isDark={isDark}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
            Add emergency contacts who will be notified in case of an emergency. These are people who can be contacted if you're involved in a ride-related accident or emergency situation.
          </Text>
        </Card>

        {/* Contacts List */}
        {emergencyContacts.length > 0 ? (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {emergencyContacts.map((contact, index) => (
              <Card key={contact.id} isDark={isDark}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: colors.text,
                        marginBottom: 2,
                      }}
                    >
                      {contact.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textSecondary,
                        marginBottom: 4,
                      }}
                    >
                      {contact.relationship}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCallContact(contact.phone)}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.primary,
                          fontWeight: '600',
                        }}
                      >
                        📞 {contact.phone}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleEditContact(contact)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: colors.primary + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteContact(contact.id)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: colors.error + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card isDark={isDark}>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                No emergency contacts
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                Add a contact to get started
              </Text>
            </View>
          </Card>
        )}

        {/* Add Button */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Button
            title={emergencyContacts.length === 0 ? 'Add Emergency Contact' : '+ Add Another Contact'}
            onPress={() => setShowAddModal(true)}
            isDark={isDark}
          />
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={{
            flex: 1,
            backgroundColor: '#00000060',
            justifyContent: 'flex-end',
          }}
        >
          <RNSafeAreaView
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 20,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />

            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 16,
              }}
            >
              {editingId ? 'Edit Contact' : 'Add Emergency Contact'}
            </Text>

            {/* Name Field */}
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 6,
                  fontWeight: '500',
                }}
              >
                Full Name
              </Text>
              <TextInput
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: errors.name ? colors.error : colors.border,
                  borderRadius: 8,
                  fontSize: 14,
                  color: colors.text,
                  backgroundColor: colors.background,
                }}
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
              {errors.name && (
                <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Phone Field */}
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 6,
                  fontWeight: '500',
                }}
              >
                Phone Number
              </Text>
              <TextInput
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: errors.phone ? colors.error : colors.border,
                  borderRadius: 8,
                  fontSize: 14,
                  color: colors.text,
                  backgroundColor: colors.background,
                }}
                placeholder="+234 901 234 5678"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
              />
              {errors.phone && (
                <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                  {errors.phone}
                </Text>
              )}
            </View>

            {/* Relationship Field */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  marginBottom: 6,
                  fontWeight: '500',
                }}
              >
                Relationship
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
              >
                <View style={{ flexDirection: 'row', gap: 8, paddingRight: 20 }}>
                  {relationshipOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() =>
                        setFormData({ ...formData, relationship: option })
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor:
                          formData.relationship === option
                            ? colors.primary
                            : colors.border,
                        backgroundColor:
                          formData.relationship === option
                            ? colors.primary + '15'
                            : colors.background,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color:
                            formData.relationship === option
                              ? colors.primary
                              : colors.textSecondary,
                        }}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors.relationship && (
                <Text style={{ fontSize: 11, color: colors.error, marginTop: 4 }}>
                  {errors.relationship}
                </Text>
              )}
            </View>

            {/* Buttons */}
            <View style={{ gap: 8 }}>
              <Button
                title={editingId ? 'Update Contact' : 'Add Contact'}
                onPress={handleAddContact}
                isDark={isDark}
              />
              <TouchableOpacity
                onPress={handleCloseModal}
                style={{
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: '600',
                    color: colors.text,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </RNSafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

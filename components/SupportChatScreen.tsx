import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  Image,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/utils/constants';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: TicketStatus;
  resolution_note?: string | null;
  resolution_requested_at?: string | null;
  resolution_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
};

type SupportMessage = {
  id: string;
  message: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  sender_type?: 'user' | 'assistant' | 'support' | 'admin' | 'system';
  sender_label?: string | null;
  department_key?: string | null;
  metadata?: Record<string, any> | null;
  users?: {
    id: string;
    role: string;
    first_name?: string;
    last_name?: string;
    department?: string;
  };
  sender_id?: string;
  local_status?: 'sending' | 'sent' | 'failed';
  client_id?: string;
  local_attachment?: any | null;
};

interface SupportChatScreenProps {
  category: 'rider' | 'driver';
}

export default function SupportChatScreen({ category }: SupportChatScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ ticketId?: string }>();
  const { theme, mode } = useTheme();
  const { user } = useAuth();
  const { showError, showSuccess, showWarning } = useAlert();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [isCreatingNewTicket, setIsCreatingNewTicket] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [supportTyping, setSupportTyping] = useState(false);
  const [attachment, setAttachment] = useState<any | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name?: string | null } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageListRef = useRef<FlatList<SupportMessage> | null>(null);
  const inFlightMessageRef = useRef<Set<string>>(new Set());
  const sentMessageGuardRef = useRef<Map<string, number>>(new Map());
  const ticketDrawerVisible = false;
  const setTicketDrawerVisible = (..._args: any[]) => undefined;

  const isDark = mode === 'dark';
  const myId = (user as any)?.id;

  const isWaitingForConfirmation =
    activeTicket?.status === 'resolved' && !activeTicket?.resolution_confirmed_at;

  const requestedTicketId = typeof params.ticketId === 'string' ? params.ticketId : undefined;

  const getMessageKey = (item: SupportMessage) =>
    `${item.sender_id || item.users?.id || item.sender_type || ''}:${(item.message || '').trim()}:${item.attachment_url || item.attachment_name || ''}`;

  const buildSendSignature = (message: string, selectedAttachment?: any | null) =>
    `${(message || '').trim().toLowerCase()}::${selectedAttachment?.fileName || ''}::${selectedAttachment?.mimeType || ''}::${selectedAttachment?.uri || ''}`;

  const mergeMessages = (serverMessages: SupportMessage[]) => {
    setMessages((current) => {
      const serverKeys = new Set(serverMessages.map(getMessageKey));
      const pending = current.filter((item) => {
        if (!item.local_status || item.local_status === 'sent') return false;
        return !serverKeys.has(getMessageKey(item));
      });
      return [...serverMessages.map((item) => ({ ...item, local_status: 'sent' as const })), ...pending].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  };

  const loadTickets = async (preferredTicketId?: string) => {
    const response = await apiService.get<{ tickets: SupportTicket[] }>(
      '/support/tickets?includeClosed=true&limit=20'
    );
    const ticketList = response?.tickets || [];
    setTickets(ticketList);

    if (isCreatingNewTicket) {
      return;
    }

    const nextTicket =
      (preferredTicketId ? ticketList.find((t) => t.id === preferredTicketId) : null) ||
      (activeTicket ? ticketList.find((t) => t.id === activeTicket.id) : null) ||
      ticketList[0] ||
      null;

    if (nextTicket) {
      setActiveTicket(nextTicket);
    } else if (activeTicket) {
      setActiveTicket(null);
    }
  };

  const loadThread = async (ticketId: string, silent = false) => {
    if (!ticketId) return;
    if (!silent) setLoading(true);

    try {
      const response = await apiService.get<{ ticket: SupportTicket; messages: SupportMessage[] }>(
        `/support/tickets/${ticketId}`
      );
      setActiveTicket(response.ticket);
      setIsCreatingNewTicket(false);
      mergeMessages(response.messages || []);
      if ((response.messages || []).some((item) => item.sender_id !== myId && item.users?.id !== myId)) {
        setSupportTyping(false);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const bootstrap = async () => {
    try {
      setLoading(true);
      await loadTickets(requestedTicketId);
    } catch (error) {
      console.error('[SUPPORT] bootstrap error', error);
      showError('Support unavailable', 'Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => setKeyboardHeight(event.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        messageListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length, loading, supportTyping, activeTicket?.id]);

  useEffect(() => {
    if (requestedTicketId) {
      loadThread(requestedTicketId);
    }
  }, [requestedTicketId]);

  useEffect(() => {
    if (!activeTicket?.id || isCreatingNewTicket) {
      setMessages([]);
      return;
    }

    loadThread(activeTicket.id);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      loadTickets();
      loadThread(activeTicket.id, true);
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeTicket?.id]);

  const createTicket = async (initialMessage = '') => {
    const payload = {
      subject: category === 'driver' ? 'Driver Support Request' : 'Rider Support Request',
      description: initialMessage || 'New support request',
      category,
      priority: 'normal',
      initialMessage,
    };

    const response = await apiService.post<{ ticket: SupportTicket }>('/support/tickets', payload);
    setActiveTicket(response.ticket);
    setIsCreatingNewTicket(false);
    await loadTickets(response.ticket.id);
    return response.ticket;
  };

  const startNewTicket = async () => {
    if (creatingTicket) return;

    try {
      setCreatingTicket(true);
      setIsCreatingNewTicket(true);
      setActiveTicket(null);
      setMessages([]);
      setText('');
      setAttachment(null);
      const ticket = await createTicket();
      await loadThread(ticket.id, true);
    } catch (error) {
      console.error('[SUPPORT] create ticket error', error);
      showError('Ticket not created', 'Failed to create ticket. Please try again.');
      setIsCreatingNewTicket(false);
    } finally {
      setCreatingTicket(false);
    }
  };

  const getReplyTargetTicket = async () => {
    if (isCreatingNewTicket) {
      return null;
    }

    if (activeTicket) {
      return activeTicket;
    }

    const latestTicket = tickets[0];
    if (latestTicket) {
      setActiveTicket(latestTicket);
      return latestTicket;
    }

    return null;
  };

  const pickAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showWarning('Permission needed', 'Please allow photo access to attach images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setAttachment(result.assets[0]);
    }
  };

  const uploadAttachment = async (ticketId: string, selectedAttachment = attachment) => {
    if (!selectedAttachment) return null;

    const token = await SecureStore.getItemAsync('authToken');
    const formData = new FormData();
    formData.append('ticketId', ticketId);
    formData.append('file', {
      uri: selectedAttachment.uri,
      type: selectedAttachment.mimeType || 'image/jpeg',
      name: selectedAttachment.fileName || `attachment-${Date.now()}.jpg`,
    } as any);

    const res = await fetch(`${API_CONFIG.url}/support/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to upload attachment');
    }

    return data;
  };

  const sendMessage = async (override?: { messageText?: string; attachment?: any | null; localId?: string; retryKey?: string }) => {
    const messageText = (override?.messageText ?? text).trim();
    const selectedAttachment = override?.attachment ?? attachment;
    if (!messageText && !selectedAttachment) return;

    const signature = buildSendSignature(messageText, selectedAttachment);
    const now = Date.now();
    const lastSentAt = sentMessageGuardRef.current.get(signature) || 0;
    if (!override?.localId && inFlightMessageRef.current.has(signature)) return;
    if (!override?.localId && now - lastSentAt < 12000) return;

    const localId = override?.localId || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: SupportMessage = {
      id: localId,
      client_id: localId,
      message: messageText,
      created_at: new Date().toISOString(),
      sender_id: myId,
      sender_type: 'user',
      local_status: 'sending',
      attachment_name: selectedAttachment?.fileName || null,
      local_attachment: selectedAttachment || null,
      users: myId ? { id: myId, role: 'user' } : undefined,
    };

    inFlightMessageRef.current.add(signature);
    setMessages((current) => [...current, optimisticMessage]);
    if (!override) {
      setText('');
      setAttachment(null);
    }
    setSupportTyping(true);

    try {
      setSending(true);
      let ticket = await getReplyTargetTicket();
      if (!ticket) {
        ticket = await createTicket();
      }

      const uploaded = await uploadAttachment(ticket.id, selectedAttachment);

      const response = await apiService.post<{ ticketId?: string; reopened?: boolean; message?: SupportMessage }>(`/support/tickets/${ticket.id}/messages`, {
        message: messageText,
        messageType: uploaded ? 'image' : 'text',
        attachmentUrl: uploaded?.url,
        attachmentName: uploaded?.name,
        attachmentMimeType: uploaded?.mimeType,
        attachmentSize: uploaded?.size,
        clientId: localId,
        attachments: uploaded
          ? [
              {
                url: uploaded.url,
                path: uploaded.path,
                name: uploaded.name,
                mimeType: uploaded.mimeType,
                size: uploaded.size,
              },
            ]
          : [],
      });

      sentMessageGuardRef.current.set(signature, Date.now());
      setMessages((current) => current.map((item) => item.id === localId ? { ...item, local_status: 'sent' } : item));
      setIsCreatingNewTicket(false);
      if (response?.reopened) {
        setActiveTicket((current) => current ? { ...current, status: 'in_progress' } : current);
      }
      await loadTickets();
      await loadThread(response?.ticketId || ticket.id, true);
    } catch (error) {
      console.error('[SUPPORT] send message error', error);
      setSupportTyping(false);
      setMessages((current) => current.map((item) => item.id === localId ? { ...item, local_status: 'failed' } : item));
      const message =
        (error as any)?.response?.data?.error ||
        (error as any)?.details?.error ||
        (error as any)?.message ||
        'Check your internet connection and try again.';
      showError('Message not sent', 'Bad network connection. Please try again.');
      return { ok: false, error: message, localId, signature };
    } finally {
      inFlightMessageRef.current.delete(signature);
      setSending(false);
    }
  };

  const retryMessage = async (item: SupportMessage) => {
    if (!item.message) return;
    const nextAttachment = item.attachment_url
      ? {
          uri: item.local_attachment?.uri || item.attachment_url,
          fileName: item.local_attachment?.fileName || item.attachment_name || 'attachment',
          mimeType: item.local_attachment?.mimeType || item.metadata?.mimeType || 'image/jpeg',
        }
      : null;
    setMessages((current) => current.map((currentItem) => (
      currentItem.id === item.id ? { ...currentItem, local_status: 'sending' } : currentItem
    )));
    await sendMessage({ messageText: item.message, attachment: nextAttachment, localId: item.id });
  };

  const confirmResolved = async () => {
    if (!activeTicket) return;
    try {
      await apiService.patch(`/support/tickets/${activeTicket.id}`, {
        confirmResolved: true,
      });
      setConfirmVisible(false);
      await loadTickets();
      await loadThread(activeTicket.id, true);
      showSuccess('Thank you', 'Ticket has been closed as resolved.');
    } catch (error) {
      showError('Resolution not saved', 'Failed to confirm resolution.');
    }
  };

  const renderMessage = ({ item }: { item: SupportMessage }) => {
    const isMine = item.sender_id === myId || item.users?.id === myId;
    const senderRole = String(item.users?.role || '').toLowerCase();
    const isAssistant =
      item.sender_type === 'assistant' ||
      (!isMine &&
        (item.message.includes('Dapo') ||
          item.message.includes('Daps') ||
          item.message.toLowerCase().includes('journey assistant')));
    const senderName = [item.users?.first_name, item.users?.last_name].filter(Boolean).join(' ').trim();
    const senderDepartment = item.department_key || item.users?.department || (senderRole.includes('admin') ? 'support' : '');
    const deepLink = typeof item.metadata?.deepLink === 'string' ? item.metadata.deepLink : null;
    const senderLabel = isMine
      ? 'You'
      : item.sender_label
        ? item.sender_label
      : isAssistant
        ? 'Dapo - Charter Keke assistant'
        : senderName
          ? `${senderName} - Charter Keke ${senderDepartment || 'support'}`
          : 'Charter Keke support';

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMine ? theme.colors.primary : theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {!isMine ? (
            <Text style={[styles.senderLabel, { color: isAssistant ? theme.colors.primary : '#10B981' }]}>
              {senderLabel}
            </Text>
          ) : null}
          <Text
            style={{
              color: isMine ? (isDark ? '#000' : '#fff') : theme.colors.textPrimary,
              fontSize: 14,
              marginBottom: item.attachment_url ? 8 : 2,
            }}
          >
            {item.message}
          </Text>

          {item.attachment_url ? (
            <TouchableOpacity
              onPress={() => setPreviewImage({ url: item.attachment_url!, name: item.attachment_name })}
              activeOpacity={0.82}
            >
              <Image source={{ uri: item.attachment_url }} style={styles.attachmentPreview} />
              <Text style={{ color: isMine ? '#000' : theme.colors.primary, fontSize: 12 }}>
                {item.attachment_name || 'Attachment'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {deepLink ? (
            <TouchableOpacity
              onPress={() => router.push(deepLink as any)}
              style={[styles.inlineLinkBtn, { borderColor: isMine ? '#00000022' : theme.colors.primary }]}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="open-in-new" size={14} color={isMine ? '#000' : theme.colors.primary} />
              <Text style={{ color: isMine ? '#000' : theme.colors.primary, fontSize: 12, fontWeight: '800' }}>
                Open in app
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text style={{ color: isMine ? '#00000088' : theme.colors.textSecondary, fontSize: 10 }}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
          {isMine ? (
            <View style={styles.deliveryRow}>
              <MaterialCommunityIcons
                name={item.local_status === 'failed' ? 'alert-circle-outline' : item.local_status === 'sending' ? 'clock-outline' : 'check-all'}
                size={13}
                color={item.local_status === 'failed' ? '#EF4444' : isMine ? '#00000099' : theme.colors.textSecondary}
              />
              <Text style={[styles.deliveryText, { color: item.local_status === 'failed' ? '#EF4444' : '#00000099' }]}>
                {item.local_status === 'failed' ? 'Not sent' : item.local_status === 'sending' ? 'Sending' : 'Sent'}
              </Text>
            </View>
          ) : null}
          {isMine && item.local_status === 'failed' ? (
            <TouchableOpacity onPress={() => retryMessage(item)} style={styles.resendBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons name="refresh" size={13} color="#fff" />
              <Text style={styles.resendBtnText}>Resend</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Customer Support</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
            {supportTyping ? 'Dapo is typing...' : activeTicket && !isCreatingNewTicket ? `Ticket: ${activeTicket.subject}` : 'Create a new support request'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setIsCreatingNewTicket(false);
            setActiveTicket((current) => current || tickets[0] || null);
          }}
          style={[styles.newTicketBtn, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="chat-outline" size={16} color="#000" />
          <Text style={styles.newTicketText}>{activeTicket ? 'Support chat' : 'Start chat'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatShell}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.threadPane}>
          {activeTicket && !isCreatingNewTicket ? (
            <View style={styles.statusWrap}>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.inputBackground }]}> 
                <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
                  Status: {activeTicket.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
          ) : null}

          {isWaitingForConfirmation && !isCreatingNewTicket ? (
            <TouchableOpacity
              style={[styles.resolveBox, { borderColor: '#10B981', backgroundColor: '#10B98120' }]}
              onPress={() => setConfirmVisible(true)}
            >
              <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
              <Text style={{ color: theme.colors.textPrimary, flex: 1 }}>
                Support marked this ticket as resolved. Tap to confirm.
              </Text>
            </TouchableOpacity>
          ) : null}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={messageListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListFooterComponent={supportTyping ? (
                <View style={[styles.typingBubble, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Text style={[styles.senderLabel, { color: theme.colors.primary }]}>Dapo</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>typing...</Text>
                </View>
              ) : null}
              ListEmptyComponent={
                <View style={styles.center}> 
                  <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                    {isCreatingNewTicket || !activeTicket
                      ? 'Send a message to create a new ticket.'
                      : 'No messages yet. Start by sending one.'}
                  </Text>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.composerWrap}>
        {attachment ? (
          <View style={[styles.attachmentBar, { borderTopColor: theme.colors.border }]}> 
            <MaterialCommunityIcons name="image" size={18} color={theme.colors.textSecondary} />
            <Text style={{ color: theme.colors.textSecondary, flex: 1 }} numberOfLines={1}>
              {attachment.fileName || 'Selected image'}
            </Text>
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <MaterialCommunityIcons name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={[styles.inputRow, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}> 
          <TouchableOpacity onPress={pickAttachment} style={styles.attachBtn}>
            <MaterialCommunityIcons name="paperclip" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type your message..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, { color: theme.colors.textPrimary, backgroundColor: theme.colors.inputBackground }]}
            multiline
          />
          <TouchableOpacity
            onPress={() => { void sendMessage(); }}
            disabled={sending || (!text.trim() && !attachment)}
            style={[styles.sendBtn, { backgroundColor: theme.colors.primary, opacity: sending || (!text.trim() && !attachment) ? 0.45 : 1 }]}
          >
            <MaterialCommunityIcons name={sending ? 'send-clock' : 'send'} size={18} color="#000" />
          </TouchableOpacity>
        </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Confirm Resolution</Text>
            <Text style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
              Has your issue been resolved by support?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={[styles.modalBtn, { borderColor: theme.colors.border }]}
              >
                <Text style={{ color: theme.colors.textPrimary }}>Not yet</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmResolved} style={[styles.modalBtn, { backgroundColor: '#10B981' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Yes, resolved</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={ticketDrawerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTicketDrawerVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.drawerBackdrop}
            onPress={() => setTicketDrawerVisible(false)}
          />
          <View style={[styles.ticketDrawer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={[styles.drawerTitle, { color: theme.colors.textPrimary }]}>Support Tickets</Text>
                <Text style={[styles.drawerSubtitle, { color: theme.colors.textSecondary }]}>
                  Switch threads or start a new request
                </Text>
              </View>
              <TouchableOpacity onPress={() => setTicketDrawerVisible(false)} style={[styles.drawerClose, { backgroundColor: theme.colors.inputBackground }]}>
                <MaterialCommunityIcons name="close" size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={startNewTicket}
              disabled={creatingTicket}
              style={[
                styles.drawerNewTicket,
                {
                  borderColor: isCreatingNewTicket ? theme.colors.primary : theme.colors.border,
                  backgroundColor: isCreatingNewTicket ? `${theme.colors.primary}22` : theme.colors.inputBackground,
                  opacity: creatingTicket ? 0.72 : 1,
                },
              ]}
            >
              <View style={[styles.drawerTicketIcon, { backgroundColor: `${theme.colors.primary}22` }]}>
                {creatingTicket ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.drawerTicketTitle, { color: theme.colors.textPrimary }]}>
                  {creatingTicket ? 'Creating ticket...' : 'Create new ticket'}
                </Text>
                <Text style={[styles.drawerTicketMeta, { color: theme.colors.textSecondary }]}>
                  {creatingTicket ? 'Please wait' : 'Start a fresh support thread'}
                </Text>
              </View>
            </TouchableOpacity>

            <FlatList
              data={tickets}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.drawerList}
              renderItem={({ item }) => {
                const selected = activeTicket?.id === item.id && !isCreatingNewTicket;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setIsCreatingNewTicket(false);
                      setActiveTicket(item);
                      setTicketDrawerVisible(false);
                    }}
                    style={[
                      styles.drawerTicket,
                      {
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selected ? `${theme.colors.primary}22` : theme.colors.inputBackground,
                      },
                    ]}
                  >
                    <View style={[styles.drawerTicketIcon, { backgroundColor: selected ? theme.colors.primary : `${theme.colors.primary}18` }]}>
                      <MaterialCommunityIcons
                        name={selected ? 'chat-processing' : 'chat-outline'}
                        size={18}
                        color={selected ? '#000' : theme.colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={2} style={[styles.drawerTicketTitle, { color: theme.colors.textPrimary }]}>
                        {item.subject}
                      </Text>
                      <Text numberOfLines={1} style={[styles.drawerTicketMeta, { color: theme.colors.textSecondary }]}>
                        {item.status.replace('_', ' ')} • {new Date(item.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.drawerEmpty}>
                  <MaterialCommunityIcons name="ticket-outline" size={30} color={theme.colors.textSecondary} />
                  <Text style={[styles.sidebarEmpty, { color: theme.colors.textSecondary }]}>No support tickets yet</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal visible={!!previewImage} animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <SafeAreaView style={styles.imagePreviewScreen}>
          <View style={styles.imagePreviewHeader}>
            <TouchableOpacity onPress={() => setPreviewImage(null)} style={styles.imagePreviewClose}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.imagePreviewTitle}>
              {previewImage?.name || 'Support image'}
            </Text>
          </View>
          {previewImage?.url ? (
            <Image source={{ uri: previewImage.url }} style={styles.imagePreviewFull} resizeMode="contain" />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 18, fontWeight: '700' },
  newTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  newTicketText: { color: '#000', fontSize: 12, fontWeight: '800' },
  ticketCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  ticketCountText: { color: '#000', fontSize: 10, fontWeight: '900' },
  chatShell: { flex: 1, minHeight: 0 },
  sidebarEmpty: { fontSize: 11, textAlign: 'center', marginTop: 10 },
  threadPane: { flex: 1, minWidth: 0 },
  messagesContainer: { padding: 12, paddingBottom: 16 },
  statusWrap: { paddingHorizontal: 16, paddingTop: 10 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  resolveBox: {
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  msgRow: { marginBottom: 10, flexDirection: 'row' },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  senderLabel: { fontSize: 10, fontWeight: '900', marginBottom: 5, textTransform: 'uppercase' },
  deliveryRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  deliveryText: { fontSize: 10, fontWeight: '700' },
  typingBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  attachmentPreview: { width: 170, height: 120, borderRadius: 10, marginBottom: 6 },
  resendBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
    borderRadius: 999,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resendBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  inlineLinkBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  inputRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  attachBtn: { padding: 8 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerWrap: { paddingBottom: 0 },
  attachmentBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: { width: '100%', borderRadius: 14, padding: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  drawerBackdrop: {
    flex: 1,
  },
  ticketDrawer: {
    width: '82%',
    maxWidth: 360,
    borderLeftWidth: 1,
    paddingTop: 26,
    paddingHorizontal: 16,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 18,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  drawerTitle: { fontSize: 20, fontWeight: '900' },
  drawerSubtitle: { fontSize: 12, marginTop: 2 },
  drawerClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerNewTicket: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  drawerList: {
    paddingBottom: 24,
    gap: 10,
  },
  drawerTicket: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  drawerTicketIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerTicketTitle: { fontSize: 14, lineHeight: 18, fontWeight: '800' },
  drawerTicketMeta: { fontSize: 11, marginTop: 4, textTransform: 'capitalize' },
  drawerEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
  imagePreviewScreen: { flex: 1, backgroundColor: '#000' },
  imagePreviewHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  imagePreviewClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewTitle: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
  imagePreviewFull: { flex: 1, width: '100%', height: '100%' },
});

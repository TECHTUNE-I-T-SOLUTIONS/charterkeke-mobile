import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import { ChatMessage } from '@/components/ChatMessage';
import { MessageSkeleton } from '@/components/SkeletonLoader';
import { apiService } from '@/services/api';
import { supabaseService } from '@/services/supabase';
import { Chat, Message } from '@/types';
import { COLORS } from '@/utils/colors';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

export default function ChatScreen() {
  const { theme, mode } = useTheme();
  const { user } = useAuth();
  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;
  const router = useRouter();
  const { rideId, chatId } = useLocalSearchParams<{ rideId?: string; chatId?: string }>();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [showLocationDisabledModal, setShowLocationDisabledModal] = useState(false);
  const [otherUserLiveLocation, setOtherUserLiveLocation] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const locationSubscriptionRef = useRef<any>(null);

  const getPersonName = (person?: any, fallback = 'Ride partner') => {
    const fullName = [person?.first_name, person?.last_name].filter(Boolean).join(' ').trim();
    return person?.name || fullName || fallback;
  };

  const currentUserName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'You';
  const currentUserAvatar = user?.avatar;
  const otherPerson = chat?.rider;
  const otherPersonName = getPersonName(otherPerson, 'Rider');
  const otherPersonAvatar = otherPerson?.profile_picture_url;

  useEffect(() => {
    if ((rideId || chatId) && user?.id) {
      initializeChat();
    }
  }, [rideId, chatId, user?.id]);

  useEffect(() => {
    if (chat?.id) {
      subscribeToMessages();
      subscribeToLocationUpdates();
      subscribeToMessageUpdates();
    }

    return () => {
      if (chat?.id) {
        supabaseService.unsubscribe(`chat-${chat.id}`);
        supabaseService.unsubscribe(`location-${chat.id}`);
        supabaseService.unsubscribe(`message-updates-${chat.id}`);
      }
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, [chat?.id]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!rideId && !chatId) {
        console.error('[CHAT] No ride or chat ID provided');
        setError('No chat available');
        Alert.alert('Error', 'No chat available');
        return;
      }

      // Get current user ID from auth context
      const userId = user?.id;
      console.log('[CHAT] Current user from auth:', userId);
      if (!userId) {
        console.error('[CHAT] User ID not available');
        setError('User information not available');
        Alert.alert('Error', 'User information not available');
        return;
      }
      setCurrentUserId(userId);

      // Get or create chat
      console.log('[CHAT] Fetching chat:', { rideId, chatId });
      let response = chatId ? await apiService.getChatById(chatId) : await apiService.getChat(rideId as string);
      console.log('[CHAT] Get chat response:', response);

      let chatData = response?.chat || response?.data?.chat;
      
      if (!chatData?.id && rideId) {
        console.log('[CHAT] Chat not found, creating new one');
        try {
          const createResponse = await apiService.createChat(rideId);
          console.log('[CHAT] Create chat response:', createResponse);
          chatData = createResponse?.chat || createResponse?.data?.chat;
          
          if (!chatData?.id) {
            console.error('[CHAT] Failed to create chat:', createResponse);
            
            // Check for specific error messages
            const errorMsg = createResponse?.error || createResponse?.data?.error;
            if (errorMsg?.includes('Driver not found')) {
              setError('Driver is not available yet. Please try again when driver accepts the ride.');
              Alert.alert('Chat Unavailable', 'Driver has not accepted the ride yet. Please try again shortly.');
            } else if (errorMsg?.includes('not found in system')) {
              setError('One of the participants is not available. Please refresh and try again.');
              Alert.alert('Chat Error', errorMsg || 'Failed to create chat. Please try again.');
            } else {
              setError('Failed to create chat');
              Alert.alert('Error', 'Failed to create chat. Please try again.');
            }
            return;
          }
        } catch (createError: any) {
          console.error('[CHAT] Failed to create chat:', {
            message: createError?.message,
            status: createError?.response?.status,
            data: createError?.response?.data,
          });
          
          const errorMsg = createError?.response?.data?.error;
          if (errorMsg?.includes('Driver not found') || errorMsg?.includes('driver or rider not found')) {
            setError('Driver is not available yet.');
            Alert.alert('Chat Unavailable', 'Driver has not accepted the ride. Please try again when they do.');
          } else {
            setError(errorMsg || 'Failed to create chat');
            Alert.alert('Error', errorMsg || 'Failed to create chat. Please try again.');
          }
          return;
        }
      }
      
      if (!chatData?.id) {
        setError('Chat not found');
        Alert.alert('Chat Unavailable', 'This chat could not be found. Please open it from the messages screen.');
        return;
      }

      console.log('[CHAT] Chat initialized successfully:', { id: chatData.id, rideId: chatData.ride_id });
      setChat(chatData);

      // Load messages after chat is set
      if (chatData?.id) {
        await loadMessages(chatData.id);
      }
    } catch (error: any) {
      console.error('[CHAT] Failed to initialize chat:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      setError(error?.message || 'Failed to load chat');
      Alert.alert('Error', error?.response?.data?.error || 'Failed to load chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!chatId) {
      console.error('[CHAT] No chatId provided');
      setError('Invalid chat ID');
      return;
    }

    try {
      setLoadingMessages(true);
      setError(null);
      console.log('[CHAT] Loading messages for chatId:', chatId);
      
      const response = await apiService.getMessages(chatId, 50, 0);
      console.log('[CHAT] Messages loaded:', response);
      console.log('[CHAT] Message details:', response.messages?.map((m: any) => ({
        id: m.id,
        sender_id: m.sender_id,
        content: m.content,
        read_by_rider: m.read_by_rider,
        read_by_driver: m.read_by_driver,
        sent_at: m.sent_at,
        currentUserId,
      })));
      
      setMessages(response.messages || []);
    } catch (error: any) {
      console.error('[CHAT] Failed to load messages:', error);
      console.error('[CHAT] Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setError('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const subscribeToMessages = () => {
    if (!chat?.id) {
      console.log('[CHAT] Chat ID not available for subscription');
      return;
    }

    console.log('[CHAT] Subscribing to messages for chat:', chat.id);
    
    supabaseService.subscribeToChat(chat.id, (newMessage: Message) => {
      console.log('[CHAT] New message received:', newMessage);
      
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          console.log('[CHAT] Message already exists, skipping duplicate');
          return prev;
        }
        
        console.log('[CHAT] Adding new message to state');
        return [...prev, newMessage];
      });
    });
  };

  const subscribeToLocationUpdates = () => {
    if (!chat?.id) return;

    supabaseService.subscribeToLocationUpdates(chat.id, (locationData) => {
      // Store other user's live location
      if (locationData.userId !== currentUserId) {
        setOtherUserLiveLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp,
          userId: locationData.userId,
          isLive: true,
        });
      }

      // Handle incoming location updates
      const locationMessage: Message = {
        id: `location-${Date.now()}`,
        chat_id: chat.id,
        sender_id: locationData.userId,
        message_type: 'location',
        location_data: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp,
        },
        sent_at: new Date().toISOString(),
      };

      setMessages(prev => {
        // Avoid duplicates based on timestamp proximity
        const existing = prev.find(msg =>
          msg.message_type === 'location' &&
          Math.abs(new Date(msg.sent_at).getTime() - locationData.timestamp) < 5000
        );
        if (existing) return prev;

        return [...prev, locationMessage];
      });
    });
  };

  const subscribeToMessageUpdates = () => {
    if (!chat?.id) return;

    supabaseService.subscribeToMessageUpdates(chat.id, (updatedMessage: Message) => {
      console.log('[CHAT] Message read status updated:', updatedMessage);
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === updatedMessage.id
            ? { ...msg, read_by_driver: updatedMessage.read_by_driver, read_by_rider: updatedMessage.read_by_rider }
            : msg
        )
      );
    });
  };

  const sendMessage = async () => {
    const messageToSend = newMessage.trim();
    
    // Early validation
    if (!messageToSend) {
      console.warn('[CHAT] Empty message, not sending');
      return;
    }

    if (!chat?.id) {
      console.error('[CHAT] No chat ID, cannot send message');
      Alert.alert('Error', 'Chat not available');
      return;
    }

    if (sending) {
      console.warn('[CHAT] Already sending a message, ignoring duplicate request');
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      console.log('[CHAT] Sending message:', { chatId: chat.id, content: messageToSend, timestamp: new Date().toISOString() });
      
      const response = await apiService.sendMessage(chat.id, messageToSend);
      console.log('[CHAT] Message sent successfully:', response);
      
      if (response?.message) {
        console.log('[CHAT] Adding message to local state:', response.message.id);
        setMessages(prev => [...prev, response.message]);
        setNewMessage(''); // Clear input after successful send
        
        // Scroll to bottom after a short delay to allow for render
        setTimeout(() => {
          console.log('[CHAT] Scrolling to bottom');
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.warn('[CHAT] No message in response:', response);
        Alert.alert('Warning', 'Message may not have been sent properly');
      }
    } catch (error: any) {
      console.error('[CHAT] Failed to send message:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code
      });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send message';
      setError(errorMessage);
      Alert.alert('Error Sending Message', errorMessage);
    } finally {
      setSending(false);
    }
  };

  const shareLocation = async () => {
    if (!chat?.id || sharingLocation) return;

    try {
      setSharingLocation(true);

      // First check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setShowLocationDisabledModal(true);
        setSharingLocation(false);
        return;
      }

      // Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setShowLocationPermissionModal(true);
        setSharingLocation(false);
        return;
      }

      // Try to get the location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Send location via API
      await apiService.sendMessage(
        chat.id,
        'Shared current location',
        'location',
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        }
      );

      // Also broadcast via realtime for live updates
      await supabaseService.shareLocation(chat.id, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        userId: currentUserId,
      });

    } catch (error: any) {
      console.error('Failed to share location:', error);
      
      // Check if error is due to location services being disabled
      if (error?.code === 'LOCATION_UNAVAILABLE' || 
          error?.message?.includes('unsatisfied device settings')) {
        setShowLocationDisabledModal(true);
      } else {
        // Generic error
        Alert.alert('Error', 'Failed to get your location. Please try again.');
      }
    } finally {
      setSharingLocation(false);
    }
  };

  const handleGrantLocationPermission = async () => {
    setShowLocationPermissionModal(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Permission granted, try sharing location again
        await shareLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const handleOpenLocationSettings = () => {
    setShowLocationDisabledModal(false);
    if (Platform.OS === 'ios') {
      // iOS: Open Privacy > Location settings
      Linking.openURL('prefs:root=Privacy&path=LOCATION').catch(() => {
        // Fallback to Settings app
        Linking.openURL('app-settings:').catch(() => {
          Alert.alert('Error', 'Could not open Settings. Please enable location services manually.');
        });
      });
    } else {
      // Android: Open Settings app - Location services
      // Try multiple approaches since Android has variations
      Linking.openURL('content://com.android.settings/system')
        .catch(() => Linking.openURL('android.settings.LOCATION_SOURCE_SETTINGS'))
        .catch(() => {
          // Fallback: Open main Settings app
          Linking.openSettings().catch(() => {
            Alert.alert('Error', 'Could not open Settings. Please enable location services manually in your device settings.');
          });
        });
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <ChatMessage
      message={item}
      isOwnMessage={item.sender_id === currentUserId}
      isRider={false}
      chatId={chat?.id}
      currentUserId={currentUserId}
      senderName={item.sender_id === currentUserId ? currentUserName : otherPersonName}
      senderAvatar={item.sender_id === currentUserId ? currentUserAvatar : otherPersonAvatar}
      onLocationShare={(locationData) => {
        // Live location update - broadcast to rider
        supabaseService.shareLocation(chat?.id || '', {
          ...locationData,
          userId: currentUserId,
        });
        // Also update other user's live location if this is the current user's location
        setOtherUserLiveLocation({
          ...locationData,
          userId: currentUserId,
          isLive: true,
        });
      }}
    />
  );

  const renderMessageSkeleton = () => (
    <View style={styles.messageRow}>
      <MessageSkeleton />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Loading...</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !loadingMessages) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              if (chat?.id) loadMessages(chat.id);
            }}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.retryButtonText, { color: colors.primaryForeground }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Chat not available for this ride
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerProfile}>
          <View style={[styles.headerAvatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {otherPersonAvatar ? (
              <Image source={{ uri: otherPersonAvatar }} style={styles.headerAvatarImage} />
            ) : (
              <Text style={[styles.headerAvatarInitial, { color: colors.primary }]}>
                {otherPersonName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {otherPersonName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              Rider
            </Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={loadingMessages ? Array(3).fill({}) : messages}
          keyExtractor={(item, index) => item.id || `skeleton-${index}`}
          renderItem={(props) => loadingMessages ? renderMessageSkeleton() : renderMessage(props)}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          ListEmptyComponent={
            !loadingMessages ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No messages yet
                </Text>
                <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
                  Start the conversation!
                </Text>
              </View>
            ) : null
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={shareLocation}
          disabled={sharingLocation}
          style={[styles.locationButton, { backgroundColor: colors.surface }]}
        >
          {sharingLocation ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.textTertiary}
          style={[styles.textInput, {
            backgroundColor: colors.input,
            borderColor: colors.inputBorder,
            color: colors.text
          }]}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
          style={[
            styles.sendButton,
            {
              backgroundColor: newMessage.trim() && !sending ? colors.primary : colors.muted,
            }
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={newMessage.trim() && !sending ? colors.primaryForeground : colors.mutedForeground}
            />
          )}
        </TouchableOpacity>
      </View>
        </KeyboardAvoidingView>

        {/* Location Permission Modal */}
        {showLocationPermissionModal && (
          <View style={[styles.modalOverlay]}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons
                name="map-marker-alert"
                size={48}
                color={colors.primary}
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Location Permission Required
              </Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                We need access to your location to share it with your ride partner. Please grant the permission to continue.
              </Text>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  onPress={() => setShowLocationPermissionModal(false)}
                  style={[styles.modalButton, { borderColor: colors.primary }]}
                >
                  <Text style={[styles.modalButtonText, { color: colors.primary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGrantLocationPermission}
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>
                    Grant Permission
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Location Disabled Modal */}
        {showLocationDisabledModal && (
          <View style={[styles.modalOverlay]}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={48}
                color={colors.warning}
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Location Services Disabled
              </Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Location services are currently disabled on your device. Please enable them in your device settings to share your location.
              </Text>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  onPress={() => setShowLocationDisabledModal(false)}
                  style={[styles.modalButton, { borderColor: colors.warning }]}
                >
                  <Text style={[styles.modalButtonText, { color: colors.warning }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOpenLocationSettings}
                  style={[styles.modalButton, { backgroundColor: colors.warning }]}
                >
                  <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>
                    Open Settings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
  },
  backButton: {
    padding: scale(8),
  },
  headerTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scale(8),
  },
  headerAvatar: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: scale(10),
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerAvatarInitial: {
    fontSize: moderateScale(16),
    fontWeight: '900',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginTop: verticalScale(1),
  },
  headerSpacer: {
    width: scale(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  errorText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  retryButton: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: verticalScale(16),
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(12),
  },
  messageRowReverse: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(12),
  },
  currentUserMessage: {
    backgroundColor: '#007AFF',
  },
  otherUserMessage: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: moderateScale(14),
    color: '#000',
  },
  currentUserText: {
    color: '#FFF',
  },
  messageTime: {
    fontSize: moderateScale(12),
    color: '#999',
    marginTop: verticalScale(4),
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  locationPreview: {
    paddingVertical: verticalScale(8),
  },
  locationText: {
    fontSize: moderateScale(14),
    color: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  emptyText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  emptySubText: {
    fontSize: moderateScale(14),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderTopWidth: 1,
  },
  locationButton: {
    width: scale(40),
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    maxHeight: verticalScale(100),
    fontSize: moderateScale(14),
  },
  sendButton: {
    width: scale(40),
    height: verticalScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: moderateScale(12),
    padding: scale(24),
    marginHorizontal: scale(32),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(21),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: scale(12),
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'transparent',
  },
  modalButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});

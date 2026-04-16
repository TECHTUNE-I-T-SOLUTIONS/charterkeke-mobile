import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Chat } from '@/types';
import { COLORS } from '@/utils/colors';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { apiService } from '@/services/api';

interface ChatListItemProps {
  chat: Chat & { lastMessage?: any; unreadCount?: number };
  onPress: () => void;
  currentUserId: string | undefined;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress, currentUserId }) => {
  const { theme, mode } = useTheme();
  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get participant data - show the OTHER person in the chat
  const getParticipantData = () => {
    try {
      // Determine which participant is NOT the current user
      let participant = null;

      // If current user is the rider, show driver
      if (currentUserId === chat.rider_id) {
        participant = chat.driver;
      }
      // If current user is the driver, show rider
      else if (currentUserId === chat.driver_id) {
        participant = chat.rider;
      }
      // Fallback: show whichever one exists
      else {
        participant = chat.driver || chat.rider;
      }
      
      console.log('[Messages] Participant data:', {
        currentUserId,
        rider_id: chat.rider_id,
        driver_id: chat.driver_id,
        driver: chat.driver,
        rider: chat.rider,
        participant,
      });

      if (!participant || typeof participant !== 'object') {
        return {
          name: 'Participant',
          initials: 'P',
          profilePictureUrl: null,
        };
      }

      const nameParts = participant?.name?.split(' ') || [];
      const firstName = String(nameParts[0] || 'P');
      const lastName = String(nameParts[1] || '');
      const fullName = participant?.name || 'Participant';
      const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'P';
      
      // Try multiple field names for profile picture URL
      const profilePictureUrl = 
        (participant as any)?.profile_picture_url || 
        (participant as any)?.profilePictureUrl || 
        (participant as any)?.profile_image ||
        (participant as any)?.avatar || 
        null;

      return {
        name: fullName,
        initials: initials || 'P',
        profilePictureUrl: profilePictureUrl ? String(profilePictureUrl) : null,
      };
    } catch (error) {
      console.error('[Messages] Error in getParticipantData:', error);
      return {
        name: 'Participant',
        initials: 'P',
        profilePictureUrl: null,
      };
    }
  };

  const participantData = getParticipantData();

  const getLastMessagePreview = () => {
    const lastMsg = chat.lastMessage || chat['last_message'];
    if (!lastMsg) return '';
    if (lastMsg.message_type === 'location') {
      return '📍 Location shared';
    }
    const content = lastMsg.content || '';
    return typeof content === 'string' ? content : '';
  };

  const renderAvatar = () => {
    try {
      if (participantData.profilePictureUrl) {
        return (
          <Image
            source={{ uri: participantData.profilePictureUrl }}
            style={[styles.chatAvatarImage]}
            onError={() => {
              console.log('[Messages] Avatar image failed to load');
            }}
          />
        );
      }

      return (
        <View style={[styles.chatAvatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {participantData.initials}
          </Text>
        </View>
      );
    } catch (error) {
      console.error('[Messages] Error rendering avatar:', error);
      return (
        <View style={[styles.chatAvatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            P
          </Text>
        </View>
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chatItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {renderAvatar()}

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatTitle, { color: colors.text }]} numberOfLines={1}>
            {String(participantData.name || 'Chat')}
          </Text>
          <Text style={[styles.chatTime, { color: colors.textTertiary }]}>
            {chat.updated_at ? formatTime(chat.updated_at) : formatTime(chat.created_at)}
          </Text>
        </View>

        {chat.lastMessage || chat['last_message'] ? (
          <Text style={[styles.chatMessage, { color: colors.textSecondary }]} numberOfLines={1}>
            {getLastMessagePreview()}
          </Text>
        ) : (
          <Text style={[styles.chatMessage, { color: colors.textTertiary }]}>
            No messages yet
          </Text>
        )}
      </View>

      {(() => {
        const unreadCount = chat.unreadCount || chat['unread_count'] || 0;
        return unreadCount > 0 ? (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.unreadText, { color: colors.primaryForeground }]}>
              {unreadCount > 99 ? '99+' : String(unreadCount)}
            </Text>
          </View>
        ) : null;
      })()}
    </TouchableOpacity>
  );
};

export default function MessagesScreen() {
  const { theme, mode } = useTheme();
  const { user } = useAuth();
  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;
  const router = useRouter();

  const [chats, setChats] = useState<(Chat & { lastMessage?: any; unreadCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await apiService.getUserChats();
      let chatsData = response.chats || [];

      // Fetch missing driver data using driver_id from chat
      chatsData = await Promise.all(
        chatsData.map(async (chat: any) => {
          // If driver is null but we have driver_id, fetch driver details
          if (!chat.driver && chat.driver_id) {
            try {
              console.log(`[Messages] Fetching driver details for ${chat.driver_id}`);
              
              const driverResponse = await apiService.getChatDriverProfile(chat.driver_id);
              console.log(`[Messages] Driver response:`, driverResponse);
              
              // Extract driver data
              const driver = driverResponse?.data || driverResponse?.driver || driverResponse;
              console.log(`[Messages] Extracted driver:`, driver);

              if (driver && typeof driver === 'object') {
                console.log(`[Messages] Got driver:`, driver);
                return {
                  ...chat,
                  driver,
                };
              } else {
                console.warn(`[Messages] No valid driver found in response`);
              }
            } catch (error) {
              console.warn(`[Messages] Failed to fetch driver ${chat.driver_id}:`, error);
            }
          }
          return chat;
        })
      );

      // Filter out chats without messages
      const chatsWithMessages = chatsData.filter((chat: any) => {
        // Check if last_message exists and has content
        // It could be an array (from Supabase) or an object
        let hasLastMessage = false;
        
        if (Array.isArray(chat.last_message)) {
          hasLastMessage = chat.last_message.length > 0;
        } else if (chat.last_message && typeof chat.last_message === 'object') {
          hasLastMessage = Object.keys(chat.last_message).length > 0;
        }
        
        console.log(`[Messages] Chat ${chat.id}: hasMessage=${hasLastMessage}, last_message=${JSON.stringify(chat.last_message)}`);
        return hasLastMessage;
      });

      console.log(`[Messages] Filtered chats: ${chatsWithMessages.length}/${chatsData.length} have messages`);
      setChats(chatsWithMessages);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const handleChatPress = (chat: Chat) => {
    router.push(`/rider/chat?rideId=${chat.ride_id}`);
  };

  const renderChat = ({ item }: { item: Chat & { lastMessage?: any; unreadCount?: number } }) => (
    <ChatListItem 
      chat={item} 
      onPress={() => handleChatPress(item)} 
      currentUserId={user?.id}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="message-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Your ride conversations will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={chats.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: moderateScale(18),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: scale(40),
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
  },
  chatAvatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  chatAvatarImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: moderateScale(25),
    marginRight: scale(12),
  },
  avatarText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  chatTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    fontSize: moderateScale(12),
  },
  chatMessage: {
    fontSize: moderateScale(14),
  },
  unreadBadge: {
    minWidth: scale(20),
    height: scale(20),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(6),
  },
  unreadText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
  },
});
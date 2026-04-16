import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Chat } from '@/types';
import { Theme, THEME_SIZES } from '@/utils/themes';
import { COLORS } from '@/utils/colors';

interface ChatItemProps {
  chat: Chat & { driver?: any; rider?: any; lastMessage?: any; unreadCount?: number };
  onPress: () => void;
  theme: Theme;
  colors: typeof COLORS.light;
  currentUserId?: string;
}

export function ChatItem({ chat, onPress, theme, colors, currentUserId }: ChatItemProps) {
  const [imageLoadError, setImageLoadError] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getLastMessagePreview = () => {
    const lastMsg = chat.lastMessage || chat['last_message'];
    if (!lastMsg) return 'No messages yet';

    if (lastMsg.message_type === 'location') {
      return '📍 Location shared';
    }

    const content = lastMsg.content && lastMsg.content.length > 50
      ? `${lastMsg.content.substring(0, 50)}...`
      : (lastMsg.content || '');
    return typeof content === 'string' ? content : 'Message';
  };

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
        participant = chat.rider || chat.driver;
      }
      
      console.log('[ChatItem] Participant data:', {
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

      const firstName = String(participant?.first_name || participant?.name?.split(' ')[0] || 'P');
      const lastName = String(participant?.last_name || participant?.name?.split(' ')[1] || '');
      const fullName = `${firstName} ${lastName}`.trim() || 'Participant';
      const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'P';
      
      // Try multiple field names for profile picture URL
      const profilePictureUrl = 
        participant?.profile_picture_url || 
        participant?.profilePictureUrl || 
        participant?.profile_image ||
        participant?.avatar || 
        null;

      return {
        name: fullName,
        initials: initials || 'P',
        profilePictureUrl: profilePictureUrl ? String(profilePictureUrl) : null,
      };
    } catch (error) {
      console.error('[ChatItem] Error in getParticipantData:', error);
      return {
        name: 'Participant',
        initials: 'P',
        profilePictureUrl: null,
      };
    }
  };

  const participantData = getParticipantData();

  const renderAvatar = () => {
    try {
      if (participantData.profilePictureUrl && !imageLoadError) {
        return (
          <Image
            source={{ uri: participantData.profilePictureUrl }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              marginRight: THEME_SIZES.sm,
            }}
            onError={() => {
              console.log('[ChatItem] Avatar image failed to load');
              setImageLoadError(true);
            }}
          />
        );
      }

      return (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: THEME_SIZES.sm,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.surface,
            }}
          >
            {participantData.initials}
          </Text>
        </View>
      );
    } catch (error) {
      console.error('[ChatItem] Error rendering avatar:', error);
      return (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: THEME_SIZES.sm,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.surface,
            }}
          >
            P
          </Text>
        </View>
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: THEME_SIZES.md,
        marginBottom: THEME_SIZES.sm,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {renderAvatar()}
          
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: THEME_SIZES.xs }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {String(participantData.name || 'Chat')}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: THEME_SIZES.xs,
              }}
              numberOfLines={2}
            >
              {getLastMessagePreview()}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              {(chat.lastMessage || chat['last_message']) ? formatTime((chat.lastMessage?.sent_at || chat['last_message']?.sent_at) || '') : 'No messages'}
            </Text>
          </View>
        </View>

        {(() => {
          const unreadCount = chat.unreadCount || chat['unread_count'] || 0;
          return unreadCount > 0 ? (
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                minWidth: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: THEME_SIZES.xs,
                marginLeft: THEME_SIZES.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.surface,
                }}
              >
                {unreadCount > 99 ? '99+' : String(unreadCount)}
              </Text>
            </View>
          ) : null;
        })()}
      </View>
    </TouchableOpacity>
  );
}
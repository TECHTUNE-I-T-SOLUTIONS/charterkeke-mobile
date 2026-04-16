import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { Chat } from '@/types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/utils/colors';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { ChatItem } from '@/components/ChatItem';

export default function DriverMessagesScreen() {
  const { theme, mode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      const response = await apiService.getUserChats();
      let chatsData = response.chats || [];

      // Fetch missing rider data using rider_id from chat
      chatsData = await Promise.all(
        chatsData.map(async (chat: any) => {
          // If rider is null but we have rider_id, fetch rider details
          if (!chat.rider && chat.rider_id) {
            try {
              console.log(`[DriverMessages] Fetching rider details for ${chat.rider_id}`);
              
              const riderResponse = await apiService.getChatRiderProfile(chat.rider_id);
              console.log(`[DriverMessages] Rider response:`, riderResponse);
              
              // Extract rider data
              const rider = riderResponse?.data || riderResponse?.rider || riderResponse;
              console.log(`[DriverMessages] Extracted rider:`, rider);

              if (rider && typeof rider === 'object') {
                console.log(`[DriverMessages] Got rider:`, rider);
                return {
                  ...chat,
                  rider,
                };
              } else {
                console.warn(`[DriverMessages] No valid rider found in response`);
              }
            } catch (error) {
              console.warn(`[DriverMessages] Failed to fetch rider ${chat.rider_id}:`, error);
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
        
        console.log(`[DriverMessages] Chat ${chat.id}: hasMessage=${hasLastMessage}, last_message=${JSON.stringify(chat.last_message)}`);
        return hasLastMessage;
      });

      console.log(`[DriverMessages] Filtered chats: ${chatsWithMessages.length}/${chatsData.length} have messages`);
      setChats(chatsWithMessages);
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadChats();
  }, [loadChats]);

  const handleChatPress = useCallback((chat: Chat) => {
    router.push({
      pathname: '/driver/chat',
      params: { chatId: chat.id, rideId: chat.ride_id }
    });
  }, [router]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem
            chat={item}
            onPress={() => handleChatPress(item)}
            theme={theme}
            colors={colors}
            currentUserId={user?.id}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="message-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Your conversations with riders will appear here
            </Text>
          </View>
        }
        contentContainerStyle={chats.length === 0 ? styles.emptyListContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: verticalScale(10),
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: scale(20),
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  emptyDescription: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: verticalScale(20),
  },
});
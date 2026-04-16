import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

interface ReviewItem {
  id: string;
  ride_id: string;
  rated_user_id: string;
  rating: number;
  review_text: string;
  categories: { tags: string[] };
  created_at: string;
  driver_name?: string;
  driver_image?: string;
}

export default function MyReviewsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const renderedOnce = useRef(false);

  const colors = theme?.colors || {
    primary: '#FFA500',
    text: '#000',
    textSecondary: '#666',
    background: '#fff',
    card: '#f5f5f5',
    border: '#ddd',
  };

  const isDark = theme?.mode === 'dark';

  useFocusEffect(
    React.useCallback(() => {
      if (!renderedOnce.current) {
        renderedOnce.current = true;
        loadMyReviews();
      }
    }, [])
  );

  const loadMyReviews = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Fetch reviews submitted by current user (where reviewer_id = user.id)
      const response = await apiService.get(`/ride-reviews?reviewer_id=${user.id}`);
      
      if (response && typeof response === 'object' && 'reviews' in response && Array.isArray(response.reviews)) {
        setReviews(response.reviews);
      } else if (Array.isArray(response)) {
        setReviews(response);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('[MyReviews] Error loading reviews:', err);
      Alert.alert('Error', 'Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={{ flexDirection: 'row', gap: scale(4) }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={moderateScale(16)}
            color={star <= rating ? '#FFB800' : colors.textSecondary}
          />
        ))}
      </View>
    );
  };

  const getSentimentEmoji = (rating: number) => {
    switch (rating) {
      case 1:
        return '😢';
      case 2:
        return '😕';
      case 3:
        return '😐';
      case 4:
        return '😊';
      case 5:
        return '😍';
      default:
        return '😐';
    }
  };

  const renderReviewCard = (item: ReviewItem) => (
    <View
      key={item.id}
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: scale(16),
        marginBottom: verticalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Header with Driver Info and Rating */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(12) }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: moderateScale(14), fontWeight: '600', color: colors.text, marginBottom: verticalScale(4) }}>
            Ride on {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
            {renderStars(item.rating)}
            <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary }}>
              {getSentimentEmoji(item.rating)} {['Poor', 'Fair', 'Okay', 'Good', 'Excellent'][item.rating - 1]}
            </Text>
          </View>
        </View>
      </View>

      {/* Tags/Categories */}
      {item.categories?.tags && item.categories.tags.length > 0 && (
        <View style={{ marginBottom: verticalScale(12) }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: scale(6) }}>
            {item.categories.tags.map((tag, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: colors.primary + '20',
                  paddingHorizontal: scale(10),
                  paddingVertical: verticalScale(4),
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: moderateScale(11),
                    color: colors.primary,
                    fontWeight: '500',
                    textTransform: 'capitalize',
                  }}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Review Text */}
      {item.review_text && (
        <View style={{ marginBottom: verticalScale(12) }}>
          <Text
            style={{
              fontSize: moderateScale(13),
              color: colors.text,
              lineHeight: moderateScale(18),
              fontStyle: 'italic',
            }}
            numberOfLines={3}
          >
            "{item.review_text}"
          </Text>
        </View>
      )}

      {/* Ride ID */}
      <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary }}>
        Ride ID: {item.ride_id.substring(0, 8)}...
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: scale(20),
          paddingVertical: verticalScale(16),
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: moderateScale(18),
            fontWeight: 'bold',
            color: colors.text,
            flex: 1,
            marginLeft: scale(16),
          }}
        >
          My Reviews
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : reviews.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: scale(20),
          }}
        >
          <MaterialCommunityIcons name="star-outline" size={60} color={colors.textSecondary} />
          <Text
            style={{
              fontSize: moderateScale(18),
              fontWeight: '600',
              color: colors.text,
              marginTop: verticalScale(16),
            }}
          >
            No Reviews Yet
          </Text>
          <Text
            style={{
              fontSize: moderateScale(14),
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: verticalScale(8),
            }}
          >
            You haven't submitted any ride reviews yet. Complete a ride and rate your driver to get started.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: scale(20),
            paddingVertical: verticalScale(16),
          }}
        >
          {/* Summary Stats */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              backgroundColor: colors.card,
              borderRadius: 12,
              paddingVertical: verticalScale(16),
              marginBottom: verticalScale(20),
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: moderateScale(20), fontWeight: 'bold', color: colors.primary }}>
                {reviews.length}
              </Text>
              <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary, marginTop: verticalScale(4) }}>
                Total Reviews
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: moderateScale(20), fontWeight: 'bold', color: colors.primary }}>
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
              </Text>
              <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary, marginTop: verticalScale(4) }}>
                Average Rating
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: moderateScale(20), fontWeight: 'bold', color: colors.primary }}>
                {reviews.filter((r) => r.rating === 5).length}
              </Text>
              <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary, marginTop: verticalScale(4) }}>
                5-Star
              </Text>
            </View>
          </View>

          {/* Reviews List */}
          <Text
            style={{
              fontSize: moderateScale(14),
              fontWeight: '600',
              color: colors.text,
              marginBottom: verticalScale(12),
            }}
          >
            Your Reviews
          </Text>
          {reviews.map((item) => renderReviewCard(item))}

          {/* Spacer */}
          <View style={{ height: verticalScale(20) }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

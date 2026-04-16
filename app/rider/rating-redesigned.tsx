import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface RideData {
  id: string;
  fare_amount: number;
  status: string;
  drivers?: {
    id: string;
    user_id: string;
    vehicle_type?: string;
    plate_number?: string;
    average_rating?: number;
    users?: {
      first_name: string;
      last_name: string;
      profile_picture_url?: string;
    };
  };
}

export default function RatingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId || '';

  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rideData, setRideData] = useState<RideData | null>(null);

  // Theme colors - Orange (#FFA500), White (#FFFFFF), Black (#000000)
  const isLight = theme?.mode === 'light';
  const colors = {
    primary: '#FFA500',
    background: isLight ? '#FFFFFF' : '#000000',
    card: isLight ? '#F5F5F5' : '#1A1A1A',
    text: isLight ? '#000000' : '#FFFFFF',
    textSecondary: isLight ? '#666666' : '#CCCCCC',
    border: isLight ? '#E0E0E0' : '#333333',
  };

  const availableTags = [
    { id: 'clean', label: '🧹 Clean' },
    { id: 'safe', label: '🛡️ Safe' },
    { id: 'friendly', label: '😊 Friendly' },
    { id: 'professional', label: '👔 Professional' },
    { id: 'quiet', label: '🤐 Quiet' },
    { id: 'music', label: '🎵 Good Music' },
  ];

  // Fetch ride data on mount
  useEffect(() => {
    const fetchRideData = async () => {
      try {
        setLoading(true);
        console.log('[RatingScreen] Fetching ride data for:', rideId);

        const ride = await apiService.getRideDetails(rideId);
        if (!ride) {
          Alert.alert('Error', 'Could not load ride details');
          router.back();
          return;
        }

        console.log('[RatingScreen] Ride data:', JSON.stringify(ride, null, 2));
        setRideData(ride);
      } catch (error) {
        console.error('[RatingScreen] Error fetching ride data:', error);
        Alert.alert('Error', 'Failed to load ride details. Please try again.', [
          { text: 'Go Back', onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchRideData();
    } else {
      Alert.alert('Error', 'Invalid ride ID');
      router.back();
    }
  }, [rideId]);

  const handleToggleTag = (tagId: string) => {
    if (tags.includes(tagId)) {
      setTags(tags.filter((t) => t !== tagId));
    } else {
      setTags([...tags, tagId]);
    }
  };

  const handleSubmitRating = async () => {
    if (!rideData || !user) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    try {
      setSubmitting(true);

      const driverId = rideData.drivers?.user_id || rideData.drivers?.id;
      const reviewData = {
        ride_id: rideId,
        reviewer_id: user.id,
        rated_user_id: driverId || '',
        rating,
        review_text: review.trim(),
        categories: { tags },
      };

      console.log('[RatingScreen] Submitting review:', reviewData);

      if (!reviewData.rated_user_id) {
        Alert.alert('Error', 'Driver information is incomplete. Unable to submit review.');
        return;
      }

      const result = await apiService.submitRideReview(reviewData as any);

      if (result.success) {
        Alert.alert('Success', 'Thank you for your review!', [
          {
            text: 'OK',
            onPress: () => router.replace('/rider/home'),
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('[RatingScreen] Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const driverName = rideData?.drivers?.users
    ? `${rideData.drivers.users.first_name} ${rideData.drivers.users.last_name}`
    : 'Driver';

  const driverAvatar = rideData?.drivers?.users?.profile_picture_url;
  const vehicleInfo = `${rideData?.drivers?.vehicle_type || 'Keke'} ${rideData?.drivers?.plate_number || 'N/A'}`;
  const driverRating = rideData?.drivers?.average_rating ?? 0;

  const renderStars = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: scale(12), marginVertical: verticalScale(24) }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
          <Text style={{ fontSize: moderateScale(48) }}>{star <= rating ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: verticalScale(16), color: colors.text, fontSize: moderateScale(16) }}>
            Loading ride details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!rideData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(20) }}>
          <MaterialCommunityIcons name="alert-circle" size={moderateScale(64)} color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: moderateScale(16), textAlign: 'center', marginTop: verticalScale(16) }}>
            Could not load ride details
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: verticalScale(24),
              paddingVertical: verticalScale(12),
              paddingHorizontal: scale(24),
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: moderateScale(14) }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(24) }}
        style={{ flex: 1 }}
      >
        {/* Header with Back Button */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingHorizontal: scale(20),
          paddingVertical: verticalScale(16),
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="arrow-left" size={moderateScale(24)} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: moderateScale(18), fontWeight: '700', color: colors.text }}>Rate Your Ride</Text>
          <View style={{ width: moderateScale(24) }} />
        </View>

        {/* Driver Card */}
        <View style={{ paddingHorizontal: scale(20), paddingVertical: verticalScale(24) }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: scale(16),
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={{
                  uri: driverAvatar || `https://avatar.vercel.sh/${driverName}?size=200`,
                }}
                style={{
                  width: scale(70),
                  height: scale(70),
                  borderRadius: scale(35),
                  marginRight: scale(16),
                  backgroundColor: colors.primary,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: moderateScale(16), fontWeight: '700', color: colors.text, marginBottom: verticalScale(4) }}>
                  {driverName}
                </Text>
                <Text style={{ fontSize: moderateScale(13), color: colors.textSecondary, marginBottom: verticalScale(4) }}>
                  {vehicleInfo}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="star" size={moderateScale(14)} color={colors.primary} />
                  <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary, marginLeft: scale(4) }}>
                    {driverRating.toFixed(1)}/5.0
                  </Text>
                </View>
              </View>
            </View>

            {/* Fare Info */}
            <View style={{
              marginTop: verticalScale(16),
              paddingTop: verticalScale(12),
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary }}>Total Fare</Text>
              <Text style={{ fontSize: moderateScale(16), fontWeight: '700', color: colors.primary }}>
                ₦{(rideData.fare_amount || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: verticalScale(24) }}>
          <Text style={{ fontSize: moderateScale(14), fontWeight: '600', color: colors.text, marginBottom: verticalScale(8), textAlign: 'center' }}>
            How was your experience?
          </Text>
          {renderStars()}
          <Text style={{ fontSize: moderateScale(16), fontWeight: '600', color: colors.primary, textAlign: 'center' }}>
            {['😢 Poor', '😕 Fair', '😐 Okay', '😊 Good', '😍 Excellent'][rating - 1]}
          </Text>
        </View>

        {/* Tags Section */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: verticalScale(24) }}>
          <Text style={{ fontSize: moderateScale(14), fontWeight: '600', color: colors.text, marginBottom: verticalScale(12) }}>
            What did you like?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) }}>
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                onPress={() => handleToggleTag(tag.id)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: scale(12),
                  paddingVertical: verticalScale(8),
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: tags.includes(tag.id) ? colors.primary : colors.border,
                  backgroundColor: tags.includes(tag.id) ? colors.primary + '20' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: moderateScale(13),
                    color: tags.includes(tag.id) ? colors.primary : colors.textSecondary,
                    fontWeight: tags.includes(tag.id) ? '600' : '500',
                  }}
                >
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment Section */}
        <View style={{ paddingHorizontal: scale(20), marginBottom: verticalScale(24) }}>
          <Text style={{ fontSize: moderateScale(14), fontWeight: '600', color: colors.text, marginBottom: verticalScale(12) }}>
            Add a comment (Optional)
          </Text>
          <TextInput
            placeholder="Share your experience..."
            placeholderTextColor={colors.textSecondary}
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!submitting}
            style={{
              paddingHorizontal: scale(12),
              paddingVertical: verticalScale(12),
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.card,
              fontSize: moderateScale(14),
              fontFamily: 'System',
            }}
          />
        </View>

        {/* Buttons */}
        <View style={{ paddingHorizontal: scale(20), gap: verticalScale(12) }}>
          <TouchableOpacity
            onPress={handleSubmitRating}
            disabled={submitting}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: verticalScale(14),
              borderRadius: 8,
              alignItems: 'center',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: moderateScale(16) }}>
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/rider/home')}
            disabled={submitting}
            activeOpacity={0.8}
            style={{
              paddingVertical: verticalScale(12),
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: colors.border,
              alignItems: 'center',
              opacity: submitting ? 0.5 : 1,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: moderateScale(14) }}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

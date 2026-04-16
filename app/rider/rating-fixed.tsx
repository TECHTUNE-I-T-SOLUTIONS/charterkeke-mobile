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
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { apiService } from '@/services/api';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface RideData {
  id: string;
  driver_id: string;
  rider_id: string;
  fare_amount: number;
  status: string;
}

interface DriverData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  vehicle_type: string;
  plate_number: string;
  average_rating: number;
}

export default function RatingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();

  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId || '';

  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [driverData, setDriverData] = useState<DriverData | null>(null);

  // Get theme colors
  const isDark = theme?.mode === 'dark';
  const colors = theme?.colors || {
    primary: '#FFA500',
    text: '#000',
    textSecondary: '#666',
    background: '#fff',
    card: '#f5f5f5',
    border: '#ddd',
    inputBackground: '#f0f0f0',
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      flexGrow: 1,
      paddingHorizontal: scale(20),
      paddingVertical: verticalScale(20),
    },
    header: {
      marginBottom: verticalScale(24),
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: moderateScale(24),
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: verticalScale(8),
    },
    headerSubtitle: {
      fontSize: moderateScale(14),
      color: colors.textSecondary,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: scale(16),
      marginBottom: verticalScale(24),
      borderWidth: 1,
      borderColor: colors.border,
    },
    driverRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: verticalScale(16),
    },
    driverImage: {
      width: scale(60),
      height: scale(60),
      borderRadius: scale(30),
      marginRight: scale(12),
      backgroundColor: colors.inputBackground,
    },
    driverInfo: {
      flex: 1,
    },
    driverName: {
      fontSize: moderateScale(16),
      fontWeight: '600',
      color: colors.text,
      marginBottom: verticalScale(4),
    },
    driverVehicle: {
      fontSize: moderateScale(13),
      color: colors.textSecondary,
      marginBottom: verticalScale(4),
    },
    driverRating: {
      fontSize: moderateScale(12),
      color: colors.textSecondary,
    },
    divider: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: verticalScale(12),
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    fareLabel: {
      fontSize: moderateScale(12),
      color: colors.textSecondary,
    },
    fareAmount: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: colors.text,
    },
    sectionTitle: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: colors.text,
      marginBottom: verticalScale(12),
      textAlign: 'center',
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: scale(12),
      marginBottom: verticalScale(16),
      alignItems: 'center',
    },
    starButton: {
      padding: scale(8),
    },
    emoticon: {
      fontSize: moderateScale(14),
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    sectionLabel: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: colors.text,
      marginBottom: verticalScale(12),
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scale(8),
      marginBottom: verticalScale(24),
    },
    tagButton: {
      borderRadius: 20,
      paddingVertical: verticalScale(8),
      paddingHorizontal: scale(12),
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
    },
    tagButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    tagText: {
      fontSize: moderateScale(12),
      color: colors.text,
    },
    tagTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    reviewInput: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(12),
      fontSize: moderateScale(14),
      color: colors.text,
      minHeight: verticalScale(100),
      marginBottom: verticalScale(24),
      textAlignVertical: 'top',
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
      paddingHorizontal: scale(20),
    },
    errorText: {
      color: colors.text,
      fontSize: moderateScale(16),
      textAlign: 'center',
      marginBottom: verticalScale(20),
    },
    backButton: {
      paddingVertical: verticalScale(12),
      paddingHorizontal: scale(24),
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    backButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: moderateScale(14),
    },
  });

  const availableTags = [
    { id: 'clean', label: '🧹 Clean' },
    { id: 'safe', label: '🛡️ Safe' },
    { id: 'friendly', label: '😊 Friendly' },
    { id: 'professional', label: '👔 Professional' },
    { id: 'quiet', label: '🤐 Quiet' },
    { id: 'music', label: '🎵 Good Music' },
  ];

  // Fetch ride and driver data on mount
  useEffect(() => {
    const fetchRideAndDriver = async () => {
      try {
        setLoading(true);

        console.log('[RatingScreen] Fetching ride data for:', rideId);

        // Fetch ride data using the API
        const ride = await apiService.getRideDetails(rideId);
        if (!ride) {
          Alert.alert('Error', 'Could not load ride details');
          router.back();
          return;
        }

        setRideData(ride);

        // Fetch driver data - This is the key fix: Don't use /api/driver/details
        // Instead, get driver info from the ride data or use public driver profile endpoint
        try {
          const driver = await apiService.get(`/drivers/${ride.driver_id}`) as any;
          if (driver) {
            setDriverData({
              id: ride.driver_id,
              user_id: driver.user_id || driver.id,
              first_name: driver.first_name || 'Driver',
              last_name: driver.last_name || '',
              profile_picture_url: driver.profile_picture_url,
              vehicle_type: driver.vehicle_type || 'Keke',
              plate_number: driver.plate_number || 'N/A',
              average_rating: driver.average_rating || 0,
            });
          }
        } catch (driverError) {
          console.error('[RatingScreen] Error fetching driver details:', driverError);
          // Fallback: Create minimal driver data
          setDriverData({
            id: ride.driver_id,
            user_id: ride.driver_id,
            first_name: 'Driver',
            last_name: '',
            profile_picture_url: undefined,
            vehicle_type: 'Keke',
            plate_number: 'N/A',
            average_rating: 0,
          });
        }

        console.log('[RatingScreen] Loaded ride and driver data');
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
      fetchRideAndDriver();
    } else {
      Alert.alert('Error', 'Invalid ride ID');
      router.back();
    }
  }, [rideId]);

  const handleToggleTag = (tagId: string) => {
    if (tags.includes(tagId)) {
      setTags(tags.filter((t) => t !== tagId));
    } else if (tags.length < 3) {
      // Allow max 3 tags
      setTags([...tags, tagId]);
    } else {
      Alert.alert('Limit', 'You can select up to 3 tags');
    }
  };

  const handleSubmitRating = async () => {
    if (!rideData || !driverData || !user) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare review data
      const reviewData = {
        ride_id: rideId,
        reviewer_id: user.id,
        rated_user_id: driverData.user_id,
        rating,
        review_text: review.trim(),
        categories: {
          tags,
        },
      };

      console.log('[RatingScreen] Submitting review:', reviewData);

      // Submit review via API
      const result = await apiService.submitRideReview(reviewData);

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

  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} style={styles.starButton} onPress={() => setRating(star)}>
          <Text
            style={{
              fontSize: moderateScale(40),
              opacity: star <= rating ? 1 : 0.3,
            }}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const emoticonMap = ['😢 Poor', '😕 Fair', '😐 Okay', '😊 Good', '😍 Excellent'];

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: verticalScale(16), color: colors.text, fontSize: moderateScale(14) }}>
            Loading ride details...
          </Text>
        </View>
      ) : !driverData || !rideData ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Could not load ride or driver details</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>How was your ride?</Text>
            <Text style={styles.headerSubtitle}>Your feedback helps us improve</Text>
          </View>

          {/* Ride Summary Card */}
          <View style={styles.card}>
            <View style={styles.driverRow}>
              <Image
                source={{
                  uri: driverData.profile_picture_url || `https://avatar.vercel.sh/${driverData.first_name}?size=200`,
                }}
                style={styles.driverImage}
              />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>
                  {driverData.first_name} {driverData.last_name}
                </Text>
                <Text style={styles.driverVehicle}>
                  {driverData.vehicle_type} {driverData.plate_number}
                </Text>
                <Text style={styles.driverRating}>⭐ {(driverData.average_rating || 0).toFixed(1)}/5</Text>
              </View>
            </View>
            <View style={styles.divider}>
              <Text style={styles.fareLabel}>Total Fare</Text>
              <Text style={styles.fareAmount}>₦{(rideData.fare_amount || 0).toLocaleString()}</Text>
            </View>
          </View>

          {/* Star Rating */}
          <View style={{ marginBottom: verticalScale(32) }}>
            <Text style={styles.sectionTitle}>Rate your experience</Text>
            {renderStars()}
            <Text style={styles.emoticon}>{emoticonMap[rating - 1]}</Text>
          </View>

          {/* Quality Tags */}
          <View style={{ marginBottom: verticalScale(24) }}>
            <Text style={styles.sectionLabel}>What did you like? (Optional)</Text>
            <View style={styles.tagsContainer}>
              {availableTags.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.tagButton, tags.includes(tag.id) && styles.tagButtonActive]}
                  onPress={() => handleToggleTag(tag.id)}
                >
                  <Text style={[styles.tagText, tags.includes(tag.id) && styles.tagTextActive]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Review Text Input */}
          <View>
            <Text style={styles.sectionLabel}>Your Review (Optional)</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              placeholderTextColor={colors.textSecondary}
              value={review}
              onChangeText={setReview}
              multiline
              maxLength={500}
            />
            <Text style={{ fontSize: moderateScale(12), color: colors.textSecondary, marginBottom: verticalScale(24) }}>
              {review.length}/500
            </Text>
          </View>

          {/* Submit Button */}
          <Button
            title={submitting ? 'Submitting...' : 'Submit Review'}
            onPress={handleSubmitRating}
            disabled={submitting}
            loading={submitting}
            style={{ marginBottom: verticalScale(20) }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

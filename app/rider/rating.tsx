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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface RideData {
  id: string;
  driver_id?: string;
  rider_id: string;
  fare_amount: number;
  status: string;
  pickup_zone?: string;
  destination_zone?: string;
  distance_km?: number;
  duration_minutes?: number;
  pickup_time?: string;
  dropoff_time?: string;
}

interface DriverProfile {
  id: string;
  user_id: string;
  vehicle_type?: string;
  plate_number?: string;
  average_rating?: number;
  vehicle_picture_url?: string;
  users?: {
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
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
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);

  // Theme colors - Orange (#FFA500), White (#FFFFFF), Black (#000000)
  const isLight = theme?.mode === 'light';
  const colors = {
    primary: '#FFA500',
    background: isLight ? '#FFFFFF' : '#000000',
    card: isLight ? '#F5F5F5' : '#1A1A1A',
    text: isLight ? '#000000' : '#FFFFFF',
    textSecondary: isLight ? '#666666' : '#999999',
    textTertiary: isLight ? '#999999' : '#666666',
    border: isLight ? '#E0E0E0' : '#2A2A2A',
  };

  const feedbackTags = [
    { id: 'clean', label: 'CLEAN' },
    { id: 'safe', label: 'SAFE' },
    { id: 'friendly', label: 'FRIENDLY' },
    { id: 'professional', label: 'PROFESSIONAL' },
    { id: 'quick', label: 'QUICK' },
    { id: 'polite', label: 'POLITE' },
  ];

  // Fetch ride data and driver profile on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('[RatingScreen] Fetching ride data for:', rideId);

        // Fetch ride details
        const rideResponse = await apiService.getRideDetails(rideId);
        if (!rideResponse) {
          Alert.alert('Error', 'Could not load ride details');
          router.back();
          return;
        }

        console.log('[RatingScreen] Full rideResponse:', JSON.stringify(rideResponse, null, 2));

        // Extract the ride from the wrapper - API returns { ride: {...} }
        const ride = rideResponse.ride || rideResponse;
        if (!ride || !ride.id) {
          Alert.alert('Error', 'Could not load ride details');
          router.back();
          return;
        }

        console.log('[RatingScreen] Extracted ride data:', JSON.stringify(ride, null, 2));
        setRideData(ride);

        // Extract driver ID from ride data
        const driverId = ride.driver_id;
        console.log('[RatingScreen] Extracted driver ID:', driverId);

        if (driverId) {
          try {
            console.log('[RatingScreen] Fetching driver profile for:', driverId);
            // Call the new dedicated driver endpoint
            const driverData = await apiService.get(`/drivers/${driverId}`) as DriverProfile;
            console.log('[RatingScreen] Driver profile fetched successfully:', JSON.stringify(driverData, null, 2));
            setDriverProfile(driverData);
          } catch (driverError) {
            console.warn('[RatingScreen] Could not fetch driver profile:', driverError);
            // Set empty driver profile so we can show default values
            setDriverProfile({ id: driverId, user_id: driverId });
          }
        } else {
          console.warn('[RatingScreen] No driver ID found in ride data');
          setDriverProfile(null);
        }
      } catch (error) {
        console.error('[RatingScreen] Error fetching data:', error);
        Alert.alert('Error', 'Failed to load ride details. Please try again.', [
          { text: 'Go Back', onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchData();
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
    if (!rideData || !user || !driverProfile) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    try {
      setSubmitting(true);

      // IMPORTANT: Use driverProfile.user_id (the actual user ID from users table)
      // NOT rideData.driver_id (which is the driver record ID from drivers table)
      const ratedUserId = driverProfile.user_id;
      
      if (!ratedUserId) {
        Alert.alert('Error', 'Driver information incomplete');
        return;
      }

      const reviewData = {
        ride_id: rideId,
        reviewer_id: user.id,
        rated_user_id: ratedUserId,
        rating,
        review_text: review.trim(),
        categories: { tags },
      };

      console.log('[RatingScreen] Submitting review:', JSON.stringify(reviewData, null, 2));

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

  const driver = driverProfile;
  const driverName = driver?.users
    ? `${driver.users.first_name} ${driver.users.last_name}`.trim()
    : 'Driver';

  const driverImage = driver?.vehicle_picture_url || driver?.users?.profile_picture_url;
  const vehicleType = driver?.vehicle_type || 'Vehicle';
  const plateNumber = driver?.plate_number || 'N/A';
  const driverRating = driver?.average_rating ?? 4.5;

  // Ride details from the ride data
  const pickupZone = rideData?.pickup_zone || 'Unknown';
  const destinationZone = rideData?.destination_zone || 'Unknown';
  const distance = rideData?.distance_km || 0;
  const duration = rideData?.duration_minutes || 0;
  const pickupTime = rideData?.pickup_time ? new Date(rideData.pickup_time) : null;
  const dropoffTime = rideData?.dropoff_time ? new Date(rideData.dropoff_time) : null;

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const ratingDescriptions = [
    'Poor',
    'Fair',
    'Good',
    'Very Good',
    'Excellent',
  ];

  const renderStarRating = () => (
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: 'center', 
      gap: scale(16), 
      marginVertical: verticalScale(20),
      paddingVertical: verticalScale(20),
      backgroundColor: colors.card,
      borderRadius: 12,
    }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity 
          key={star} 
          onPress={() => setRating(star)} 
          activeOpacity={0.6}
          style={{ alignItems: 'center' }}
        >
          <MaterialCommunityIcons
            name={star <= rating ? 'star' : 'star-outline'}
            size={moderateScale(36)}
            color={star <= rating ? colors.primary : colors.textTertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: verticalScale(16), color: colors.text, fontSize: moderateScale(14) }}>
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
          <Text style={{ 
            color: colors.text, 
            fontSize: moderateScale(16), 
            textAlign: 'center', 
            marginTop: verticalScale(16),
            fontWeight: '600',
          }}>
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
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: moderateScale(14) }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Fixed Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons 
            name="chevron-left" 
            size={moderateScale(28)} 
            color={colors.primary} 
          />
        </TouchableOpacity>
        <Text style={{ 
          fontSize: moderateScale(18), 
          fontWeight: '700', 
          color: colors.text,
          letterSpacing: 0.5,
        }}>
          RATE RIDE
        </Text>
        <View style={{ width: moderateScale(28) }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: verticalScale(24) }}
        scrollEnabled={true}
      >
        {/* Driver Information Card */}
        <View style={{ paddingHorizontal: scale(20), paddingVertical: verticalScale(16) }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: scale(16),
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: moderateScale(12),
              color: colors.textSecondary,
              marginBottom: verticalScale(12),
              letterSpacing: 0.3,
              fontWeight: '500',
            }}>
              DRIVER INFORMATION
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Image
                source={{
                  uri: driverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=FFA500&color=FFFFFF`,
                }}
                style={{
                  width: scale(60),
                  height: scale(60),
                  borderRadius: scale(30),
                  marginRight: scale(14),
                  backgroundColor: colors.primary,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: moderateScale(16),
                  fontWeight: '700',
                  color: colors.text,
                  marginBottom: verticalScale(4),
                }}>
                  {driverName}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(6) }}>
                  <MaterialCommunityIcons
                    name="car"
                    size={moderateScale(14)}
                    color={colors.textSecondary}
                  />
                  <Text style={{
                    fontSize: moderateScale(13),
                    color: colors.textSecondary,
                    marginLeft: scale(6),
                  }}>
                    {vehicleType}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(6) }}>
                  <MaterialCommunityIcons
                    name="card-text-outline"
                    size={moderateScale(14)}
                    color={colors.textSecondary}
                  />
                  <Text style={{
                    fontSize: moderateScale(13),
                    color: colors.textSecondary,
                    marginLeft: scale(6),
                  }}>
                    {plateNumber}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="star"
                    size={moderateScale(14)}
                    color={colors.primary}
                  />
                  <Text style={{
                    fontSize: moderateScale(13),
                    color: colors.text,
                    marginLeft: scale(4),
                    fontWeight: '600',
                  }}>
                    {driverRating.toFixed(1)} Rating
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Ride Details Card */}
        <View style={{ paddingHorizontal: scale(20), paddingVertical: verticalScale(8) }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: scale(16),
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{
              fontSize: moderateScale(12),
              color: colors.textSecondary,
              marginBottom: verticalScale(12),
              letterSpacing: 0.3,
              fontWeight: '500',
            }}>
              RIDE DETAILS
            </Text>

            {/* Route */}
            <View style={{ marginBottom: verticalScale(16) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(8) }}>
                <View style={{
                  width: scale(8),
                  height: scale(8),
                  borderRadius: scale(4),
                  backgroundColor: colors.primary,
                  marginRight: scale(10),
                }} />
                <Text style={{
                  fontSize: moderateScale(14),
                  color: colors.text,
                  flex: 1,
                }}>
                  {pickupZone}
                </Text>
              </View>

              <View style={{
                height: verticalScale(20),
                width: 1,
                backgroundColor: colors.border,
                marginLeft: scale(3),
                marginBottom: verticalScale(8),
              }} />

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: scale(8),
                  height: scale(8),
                  borderRadius: scale(4),
                  backgroundColor: colors.primary,
                  marginRight: scale(10),
                }} />
                <Text style={{
                  fontSize: moderateScale(14),
                  color: colors.text,
                  flex: 1,
                }}>
                  {destinationZone}
                </Text>
              </View>
            </View>

            {/* Ride Stats */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: verticalScale(12),
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={moderateScale(20)}
                  color={colors.primary}
                />
                <Text style={{
                  fontSize: moderateScale(12),
                  color: colors.textSecondary,
                  marginTop: verticalScale(4),
                }}>
                  Distance
                </Text>
                <Text style={{
                  fontSize: moderateScale(14),
                  fontWeight: '600',
                  color: colors.text,
                  marginTop: verticalScale(2),
                }}>
                  {distance.toFixed(1)} km
                </Text>
              </View>

              <View style={{ alignItems: 'center', flex: 1 }}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={moderateScale(20)}
                  color={colors.primary}
                />
                <Text style={{
                  fontSize: moderateScale(12),
                  color: colors.textSecondary,
                  marginTop: verticalScale(4),
                }}>
                  Duration
                </Text>
                <Text style={{
                  fontSize: moderateScale(14),
                  fontWeight: '600',
                  color: colors.text,
                  marginTop: verticalScale(2),
                }}>
                  {formatDuration(duration)}
                </Text>
              </View>

              <View style={{ alignItems: 'center', flex: 1 }}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={moderateScale(20)}
                  color={colors.primary}
                />
                <Text style={{
                  fontSize: moderateScale(12),
                  color: colors.textSecondary,
                  marginTop: verticalScale(4),
                }}>
                  Time
                </Text>
                <Text style={{
                  fontSize: moderateScale(12),
                  fontWeight: '600',
                  color: colors.text,
                  marginTop: verticalScale(2),
                  textAlign: 'center',
                }}>
                  {formatTime(pickupTime)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fare Summary */}
        <View style={{ paddingHorizontal: scale(20), paddingVertical: verticalScale(8) }}>
          <View style={{
            backgroundColor: colors.primary + '15',
            borderRadius: 12,
            padding: scale(16),
            borderWidth: 1,
            borderColor: colors.primary + '30',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{
                  fontSize: moderateScale(12),
                  color: colors.primary,
                  letterSpacing: 0.3,
                  fontWeight: '500',
                }}>
                  TOTAL FARE
                </Text>
                <Text style={{
                  fontSize: moderateScale(20),
                  fontWeight: '700',
                  color: colors.primary,
                  marginTop: verticalScale(2),
                }}>
                  ₦{(rideData?.fare_amount || 0).toLocaleString()}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="cash"
                size={moderateScale(32)}
                color={colors.primary}
              />
            </View>
          </View>
        </View>

        {/* Rating Question */}
        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(16) }}>
          <Text style={{
            fontSize: moderateScale(14),
            color: colors.textSecondary,
            marginBottom: verticalScale(12),
            letterSpacing: 0.3,
            fontWeight: '500',
          }}>
            HOW WAS YOUR EXPERIENCE?
          </Text>
        </View>

        {/* Star Rating */}
        {renderStarRating()}

        {/* Rating Feedback */}
        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(8) }}>
          <Text style={{
            fontSize: moderateScale(16),
            fontWeight: '700',
            color: colors.primary,
            textAlign: 'center',
            letterSpacing: 0.5,
          }}>
            {ratingDescriptions[rating - 1]}
          </Text>
        </View>

        {/* Feedback Tags */}
        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(20) }}>
          <Text style={{
            fontSize: moderateScale(14),
            color: colors.textSecondary,
            marginBottom: verticalScale(12),
            letterSpacing: 0.3,
            fontWeight: '500',
          }}>
            WHAT DID YOU LIKE?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: scale(8) }}>
            {feedbackTags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                onPress={() => handleToggleTag(tag.id)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: scale(12),
                  paddingVertical: verticalScale(8),
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: tags.includes(tag.id) ? colors.primary : colors.border,
                  backgroundColor: tags.includes(tag.id) ? colors.primary + '15' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: moderateScale(12),
                    color: tags.includes(tag.id) ? colors.primary : colors.textSecondary,
                    fontWeight: tags.includes(tag.id) ? '700' : '500',
                    letterSpacing: 0.3,
                  }}
                >
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment Section */}
        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(20) }}>
          <Text style={{
            fontSize: moderateScale(14),
            color: colors.textSecondary,
            marginBottom: verticalScale(12),
            letterSpacing: 0.3,
            fontWeight: '500',
          }}>
            ADDITIONAL COMMENTS (OPTIONAL)
          </Text>
          <TextInput
            placeholder="Share any additional feedback..."
            placeholderTextColor={colors.textTertiary}
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

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: scale(20), marginTop: verticalScale(24), gap: verticalScale(12) }}>
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
            <Text style={{
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: moderateScale(15),
              letterSpacing: 0.5,
            }}>
              {submitting ? 'SUBMITTING...' : 'SUBMIT RATING'}
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
            <Text style={{
              color: colors.textSecondary,
              fontWeight: '600',
              fontSize: moderateScale(14),
              letterSpacing: 0.3,
            }}>
              SKIP FOR NOW
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

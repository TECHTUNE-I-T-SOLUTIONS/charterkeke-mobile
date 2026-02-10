import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRide } from '@/context/RideContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { COLORS } from '@/utils/colors';

export default function RatingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { submitRating, isLoading } = useRide();
  const [isDark, setIsDark] = useState(false);

  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId || '';

  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const colors = isDark ? COLORS.dark : COLORS.light;

  const availableTags = [
    { id: 'clean', label: '🧹 Clean' },
    { id: 'safe', label: '🛡️ Safe' },
    { id: 'friendly', label: '😊 Friendly' },
    { id: 'professional', label: '👔 Professional' },
    { id: 'quiet', label: '🤐 Quiet' },
    { id: 'music', label: '🎵 Good Music' },
  ];

  // Mock driver data
  const driver = {
    name: 'Chidi Okonkwo',
    profileImage: 'https://avatar.vercel.sh/chidi?size=200',
    vehicle: 'Green Keke ABC-123-XY',
    fare: 2500,
  };

  const handleToggleTag = (tagId: string) => {
    if (tags.includes(tagId)) {
      setTags(tags.filter((t) => t !== tagId));
    } else {
      setTags([...tags, tagId]);
    }
  };

  const handleSubmitRating = async () => {
    try {
      const result = await submitRating({
        rideId,
        rating,
        review: review.trim(),
        tags,
      });

      if (result.success) {
        router.replace('/rider/home');
      }
    } catch (error) {
      console.error('Rating submission error:', error);
    }
  };

  const renderStars = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Text
            style={{
              fontSize: 40,
              opacity: star <= rating ? 1 : 0.3,
            }}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
            How was your ride?
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Your feedback helps us improve
          </Text>
        </View>

        {/* Ride Summary Card */}
        <Card isDark={isDark}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: driver.profileImage }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                {driver.name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                {driver.vehicle}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Total Fare</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
              ₦{driver.fare}
            </Text>
          </View>
        </Card>

        {/* Star Rating */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 16, textAlign: 'center' }}>
            Rate your experience
          </Text>
          {renderStars()}
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
            {['😢 Poor', '😕 Fair', '😐 Okay', '😊 Good', '😍 Excellent'][rating - 1]}
          </Text>
        </View>

        {/* Quality Tags */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            What did you like?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {availableTags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                onPress={() => handleToggleTag(tag.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: tags.includes(tag.id)
                    ? colors.primary
                    : colors.border,
                  backgroundColor: tags.includes(tag.id)
                    ? colors.primary + '15'
                    : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: tags.includes(tag.id)
                      ? colors.primary
                      : colors.text,
                    fontWeight: tags.includes(tag.id) ? '600' : '500',
                  }}
                >
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Review Text */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
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
            style={{
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.background,
              fontSize: 14,
            }}
          />
        </View>

        {/* Buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title={isLoading ? 'Submitting...' : 'Submit Rating'}
            onPress={handleSubmitRating}
            isDark={isDark}
            size="large"
            disabled={isLoading}
          />
          <TouchableOpacity
            onPress={() => router.replace('/rider/home')}
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
                color: colors.textSecondary,
              }}
            >
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

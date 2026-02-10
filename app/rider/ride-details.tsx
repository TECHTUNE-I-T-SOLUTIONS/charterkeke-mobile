import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { COLORS } from '@/utils/colors';

export default function RideDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isDark, setIsDark] = useState(false);

  const colors = isDark ? COLORS.dark : COLORS.light;
  const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId || '';

  // Mock ride details
  const rideDetails = {
    id: rideId,
    date: '2024-01-15',
    time: '14:30',
    status: 'completed',
    pickup: 'Ikoyi, Lagos',
    dropoff: 'VI, Lagos',
    distance: '12.5 km',
    duration: '25 min',
    fare: 2500,
    driver: {
      name: 'Chidi Okonkwo',
      rating: 4.8,
      phone: '+2348012345678',
      image: 'https://avatar.vercel.sh/chidi?size=200',
      vehicle: 'Green Keke ABC-123-XY',
    },
    userRating: 5,
    userReview: 'Great ride, very professional driver!',
    paymentMethod: 'Wallet',
    breakdown: {
      baseFare: 500,
      perKmRate: 150,
      surgeMultiplier: 1,
      discount: 0,
      tax: 150,
    },
  };

  const handleCallDriver = () => {
    Linking.openURL(`tel:${rideDetails.driver.phone}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 28, color: colors.primary }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
            Ride Details
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Ride Status Badge */}
        <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 16 }}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: colors.success + '15',
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.success,
                textTransform: 'capitalize',
              }}
            >
              ✓ {rideDetails.status}
            </Text>
          </View>
        </View>

        {/* Route Card */}
        <Card isDark={isDark}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              From
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
              📍 {rideDetails.pickup}
            </Text>
          </View>

          <View
            style={{
              height: 30,
              marginHorizontal: 0,
              marginVertical: 12,
              borderLeftWidth: 2,
              borderLeftColor: colors.primary,
              paddingLeft: 8,
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>~{rideDetails.distance}</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>~{rideDetails.duration}</Text>
          </View>

          <View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              To
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
              🎯 {rideDetails.dropoff}
            </Text>
          </View>
        </Card>

        {/* Driver Info */}
        <Card isDark={isDark}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: rideDetails.driver.image }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                {rideDetails.driver.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: colors.warning, marginRight: 4 }}>★</Text>
                <Text style={{ fontSize: 12, color: colors.text }}>
                  {rideDetails.driver.rating} Rating
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleCallDriver}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>📞</Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.background,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
              Vehicle
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
              {rideDetails.driver.vehicle}
            </Text>
          </View>
        </Card>

        {/* Fare Breakdown */}
        <Card isDark={isDark}>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>
            Fare Breakdown
          </Text>

          {[
            { label: 'Base Fare', value: rideDetails.breakdown.baseFare },
            {
              label: `Per km (${rideDetails.distance})`,
              value:
                (parseFloat(rideDetails.distance) * rideDetails.breakdown.perKmRate).toFixed(0),
            },
            { label: 'Tax', value: rideDetails.breakdown.tax },
          ].map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: index < 2 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text }}>
                ₦{item.value}
              </Text>
            </View>
          ))}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTopWidth: 2,
              borderTopColor: colors.border,
              marginTop: 12,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>
              Total Fare
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary }}>
              ₦{rideDetails.fare}
            </Text>
          </View>
        </Card>

        {/* Payment Info */}
        <Card isDark={isDark}>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
            Payment Method
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
            💳 {rideDetails.paymentMethod}
          </Text>
        </Card>

        {/* Rider Rating */}
        {rideDetails.userRating > 0 && (
          <Card isDark={isDark}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
              Your Rating
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {[...Array(5)].map((_, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: 20,
                    marginRight: 4,
                    color: i < rideDetails.userRating ? colors.warning : colors.border,
                  }}
                >
                  ★
                </Text>
              ))}
            </View>
            {rideDetails.userReview && (
              <Text style={{ fontSize: 12, color: colors.text, fontStyle: 'italic' }}>
                "{rideDetails.userReview}"
              </Text>
            )}
          </Card>
        )}

        {/* Trip Info */}
        <Card isDark={isDark}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Ride Date</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
              {rideDetails.date} {rideDetails.time}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Ride ID</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text, fontFamily: 'monospace' }}>
              {rideDetails.id}
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Button
            title="Contact Driver"
            onPress={handleCallDriver}
            isDark={isDark}
          />
          <TouchableOpacity
            onPress={() => router.back()}
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
                color: colors.text,
              }}
            >
              Back to History
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

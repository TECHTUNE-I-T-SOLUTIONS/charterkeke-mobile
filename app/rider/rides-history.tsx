import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import RiderBottomNavigation from '@/components/RiderBottomNavigation';
import { COLORS } from '@/utils/colors';
import { apiService } from '@/services/api';

interface Ride {
  id: string;
  pickup_zone: string;
  destination_zone: string;
  fare_amount: number;
  status: string;
  created_at: string;
  completed_at?: string;
  rating?: number;
  drivers?: {
    users: {
      first_name: string;
      last_name: string;
    };
  };
  distance_km?: number;
  duration_minutes?: number;
}

export default function RidesHistoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const isDark = theme?.mode === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  useEffect(() => {
    // Wait for auth to load first
    if (!authLoading && user) {
      fetchRideHistory();
    } else if (!authLoading && !user) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
    }
  }, [authLoading, user]);

  const fetchRideHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Fetching ride history for user:', user?.id);
      
      const data = await apiService.getRiderRides(1, 50);
      console.log('✅ Ride history fetched:', data);
      setRides(data.rides || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch ride history';
      console.error('❌ Failed to fetch ride history:', errorMessage, error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideHistory();
    setRefreshing(false);
  };

  // Filter rides
  const filteredRides = useMemo(() => {
    if (filterStatus === 'all') return rides;
    return rides.filter((ride) => ride.status === filterStatus);
  }, [rides, filterStatus]);

  // Memoized header gradient
  const headerGradient = useMemo(
    () => [
      isDark ? '#FFFFFF' : '#000000',
      isDark ? '#F0F0F0' : '#333333',
    ],
    [isDark]
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return colors.primary;
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>Authenticating...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <MaterialCommunityIcons name="lock" size={48} color={colors.textSecondary} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 }}>
            Not Authenticated
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Please log in to view your ride history.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            style={{
              marginTop: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '600' }}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading rides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 }}>
            Error Loading Rides
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchRideHistory}
            style={{
              marginTop: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={28}
                color={isDark ? '#000000' : '#FFFFFF'}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: isDark ? '#000000' : '#FFFFFF',
                marginLeft: 12,
                flex: 1,
              }}
            >
              Ride History
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? '#666666' : '#CCCCCC',
              fontWeight: '500',
            }}
          >
            {filteredRides.length} rides
          </Text>
        </LinearGradient>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 }}>
          {['all', 'completed', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilterStatus(status)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  filterStatus === status ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor:
                  filterStatus === status ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  color:
                    filterStatus === status
                      ? isDark
                        ? '#000000'
                        : '#FFFFFF'
                      : colors.text,
                }}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rides List */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {filteredRides.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 48,
              }}
            >
              <MaterialCommunityIcons
                name="car-off"
                size={48}
                color={colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.text,
                  marginTop: 16,
                }}
              >
                No rides yet
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: 8,
                }}
              >
                Your ride history will appear here
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredRides.map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  onPress={() => router.push(`/rider/ride-details?id=${ride.id}`)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: colors.text,
                          marginBottom: 4,
                        }}
                      >
                        {ride.drivers?.users?.first_name}{' '}
                        {ride.drivers?.users?.last_name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textSecondary,
                        }}
                      >
                        {formatDate(ride.created_at)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '700',
                          color: colors.primary,
                          marginBottom: 4,
                        }}
                      >
                        ₦{ride.fare_amount?.toLocaleString() || '0'}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                          backgroundColor: getStatusColor(ride.status) + '20',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: getStatusColor(ride.status),
                            textTransform: 'capitalize',
                          }}
                        >
                          {ride.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Route */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.text,
                        marginLeft: 8,
                        flex: 1,
                      }}
                    >
                      {ride.pickup_zone}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingLeft: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 2,
                        height: 12,
                        backgroundColor: colors.primary,
                        marginLeft: 6,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.text,
                        flex: 1,
                      }}
                    >
                      {ride.destination_zone}
                    </Text>
                  </View>

                  {/* Distance & Duration */}
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 16,
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    {ride.distance_km && (
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textSecondary,
                            marginBottom: 4,
                          }}
                        >
                          Distance
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: colors.text,
                          }}
                        >
                          {ride.distance_km.toFixed(1)} km
                        </Text>
                      </View>
                    )}
                    {ride.duration_minutes && (
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textSecondary,
                            marginBottom: 4,
                          }}
                        >
                          Duration
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: colors.text,
                          }}
                        >
                          {ride.duration_minutes} min
                        </Text>
                      </View>
                    )}
                    {ride.rating && (
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.textSecondary,
                            marginBottom: 4,
                          }}
                        >
                          Rating
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <MaterialCommunityIcons
                            name="star"
                            size={13}
                            color={colors.primary}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: colors.text,
                              marginLeft: 4,
                            }}
                          >
                            {ride.rating}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <RiderBottomNavigation />
    </SafeAreaView>
  );
}
//       driver: 'Emeka Obi',
//       rating: 0,
//       status: 'completed',
//     },
//   ];

//   const filteredRides = mockRides.filter((ride) => {
//     if (filterStatus === 'all') return true;
//     return ride.status === filterStatus;
//       rating: 0,
//       status: 'completed',
//     },
//     {
//       id: '4',
//       date: '2024-01-12',
//       time: '11:20',
//       pickup: 'Ikeja, Lagos',
//       dropoff: 'Ikoyi, Lagos',
//       distance: '8.5 km',
//       duration: '18 min',
//       fare: 1800,
//       driver: null,
//       rating: 0,
//       status: 'cancelled',
//     },
//   ];

//   const filteredRides = mockRides.filter((ride) => {
//     if (filterStatus === 'all') return true;
//     return ride.status === filterStatus;
//   });

//   const renderRideCard = ({ item }: { item: (typeof mockRides)[0] }) => (
//     <Card isDark={isDark}>
//       <TouchableOpacity
//         onPress={() =>
//           router.push({
//             pathname: '/rider/ride-details',
//             params: { rideId: item.id },
//           })
//         }
//       >
//         {/* Date & Time */}
//         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
//           <Text style={{ fontSize: 12, color: colors.textSecondary }}>
//             {item.date} • {item.time}
//           </Text>
//           <View
//             style={{
//               paddingHorizontal: 8,
//               paddingVertical: 4,
//               borderRadius: 4,
//               backgroundColor:
//                 item.status === 'completed'
//                   ? colors.success + '15'
//                   : colors.destructive + '15',
//             }}
//           >
//             <Text
//               style={{
//                 fontSize: 11,
//                 fontWeight: '600',
//                 color:
//                   item.status === 'completed'
//                     ? colors.success
//                     : colors.destructive,
//                 textTransform: 'capitalize',
//               }}
//             >
//               {item.status}
//             </Text>
//           </View>
//         </View>

//         {/* Route */}
//         <View style={{ marginBottom: 12 }}>
//           <Text style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
//             📍 {item.pickup}
//           </Text>
//           <Text style={{ fontSize: 13, color: colors.text }}>
//             🎯 {item.dropoff}
//           </Text>
//         </View>

//         {/* Trip Details */}
//         <View
//           style={{
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             paddingTop: 12,
//             borderTopWidth: 1,
//             borderTopColor: colors.border,
//             marginBottom: 12,
//           }}
//         >
//           <View>
//             <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
//               Distance
//             </Text>
//             <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
//               {item.distance}
//             </Text>
//           </View>
//           <View>
//             <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
//               Duration
//             </Text>
//             <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
//               {item.duration}
//             </Text>
//           </View>
//           <View>
//             <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>
//               Fare
//             </Text>
//             <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
//               ₦{item.fare}
//             </Text>
//           </View>
//         </View>

//         {/* Driver & Rating */}
//         {item.driver && (
//           <View
//             style={{
//               flexDirection: 'row',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               paddingTop: 12,
//               borderTopWidth: 1,
//               borderTopColor: colors.border,
//             }}
//           >
//             <Text style={{ fontSize: 12, color: colors.text }}>
//               Driver: {item.driver}
//             </Text>
//             {item.rating > 0 && (
//               <View style={{ flexDirection: 'row' }}>
//                 {[...Array(5)].map((_, i) => (
//                   <Text
//                     key={i}
//                     style={{
//                       fontSize: 12,
//                       color: i < item.rating ? colors.warning : colors.border,
//                     }}
//                   >
//                     ★
//                   </Text>
//                 ))}
//               </View>
//             )}
//           </View>
//         )}
//       </TouchableOpacity>
//     </Card>
//   );

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
//       {/* Header */}
//       <View
//         style={{
//           paddingHorizontal: 20,
//           paddingVertical: 16,
//           borderBottomWidth: 1,
//           borderBottomColor: colors.border,
//         }}
//       >
//         <TouchableOpacity onPress={() => router.back()}>
//           <Text style={{ fontSize: 28, color: colors.primary }}>←</Text>
//         </TouchableOpacity>
//         <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text, marginTop: 12 }}>
//           Ride History
//         </Text>
//       </View>

//       {/* Filter Tabs */}
//       <View
//         style={{
//           paddingHorizontal: 20,
//           paddingVertical: 12,
//           flexDirection: 'row',
//           gap: 8,
//           borderBottomWidth: 1,
//           borderBottomColor: colors.border,
//         }}
//       >
//         {[
//           { id: 'all', label: 'All' },
//           { id: 'completed', label: 'Completed' },
//           { id: 'cancelled', label: 'Cancelled' },
//         ].map((tab) => (
//           <TouchableOpacity
//             key={tab.id}
//             onPress={() => setFilterStatus(tab.id)}
//             style={{
//               paddingVertical: 8,
//               paddingHorizontal: 12,
//               borderRadius: 6,
//               backgroundColor:
//                 filterStatus === tab.id ? colors.primary + '15' : 'transparent',
//               borderWidth: 1,
//               borderColor:
//                 filterStatus === tab.id ? colors.primary : 'transparent',
//             }}
//           >
//             <Text
//               style={{
//                 fontSize: 13,
//                 fontWeight: '600',
//                 color: filterStatus === tab.id ? colors.primary : colors.textSecondary,
//               }}
//             >
//               {tab.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Rides List */}
//       {filteredRides.length > 0 ? (
//         <FlatList
//           data={filteredRides}
//           renderItem={renderRideCard}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={{ padding: 16 }}
//         />
//       ) : (
//         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
//           <Text style={{ fontSize: 40, marginBottom: 12 }}>🚗</Text>
//           <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
//             No rides yet
//           </Text>
//           <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
//             Your ride history will appear here
//           </Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

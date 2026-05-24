import React from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MapboxMap, MapboxMarker } from '@/components/MapboxMap';
import { useTheme } from '@/context/ThemeContext';
import { COLORS } from '@/utils/colors';

type Coordinate = [number, number];

interface RideMapFullscreenModalProps {
  visible: boolean;
  title: string;
  routeCoordinates?: Coordinate[];
  focusCoordinates?: Coordinate[];
  pickup?: Coordinate | null;
  dropoff?: Coordinate | null;
  riderLocation?: Coordinate | null;
  driverLocation?: Coordinate | null;
  riderHeading?: number;
  driverHeading?: number;
  speedText?: string;
  onClose: () => void;
}

export const RideMapFullscreenModal: React.FC<RideMapFullscreenModalProps> = ({
  visible,
  title,
  routeCoordinates,
  focusCoordinates,
  pickup,
  dropoff,
  riderLocation,
  driverLocation,
  riderHeading,
  driverHeading,
  speedText,
  onClose,
}) => {
  const { mode } = useTheme();
  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.mapWrap}>
          <MapboxMap
            style={styles.map}
            mapStyle="navigation-day"
            showCompass
            showScaleBar
            showUserLocation
            fitCoordinates={focusCoordinates || routeCoordinates}
            routeCoordinates={routeCoordinates}
            zoom={13}
            autoCenter={false}
          >
            {pickup && <MapboxMarker id="pickup" coordinate={pickup} title="Pickup" color="#FF9203" />}
            {dropoff && <MapboxMarker id="dropoff" coordinate={dropoff} title="Dropoff" color="#000000" />}
            {riderLocation && <MapboxMarker id="rider" coordinate={riderLocation} title="Rider" color="#2563EB" />}
            {driverLocation && <MapboxMarker id="driver" coordinate={driverLocation} title="Tricycle" color="#10B981" />}
          </MapboxMap>
        </View>
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Double tap the map again or use close to return.</Text>
          {speedText ? <Text style={{ color: colors.text, fontWeight: '700', marginTop: 4 }}>{speedText}</Text> : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 12 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  footer: { padding: 16, borderTopWidth: 1 },
});

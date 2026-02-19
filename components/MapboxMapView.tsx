import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { useTheme } from '@/context/ThemeContext';
import { BRAND } from '@/utils/colors';

// Set Mapbox access token
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN || '');

interface MapboxMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  onRegionChange?: (region: any) => void;
  children?: React.ReactNode;
  style?: any;
}

export const MapboxMap = React.forwardRef<MapboxGL.MapView, MapboxMapProps>(
  (
    {
      latitude = 6.5244,
      longitude = 3.3792,
      zoom = 14,
      pitch = 0,
      bearing = 0,
      onRegionChange,
      children,
      style,
    },
    ref
  ) => {
    const { theme } = useTheme();
    const isLight = theme.mode === 'light';

    return (
      <View style={[styles.container, style]}>
        <MapboxGL.MapView
          ref={ref}
          style={styles.map}
          styleURL={isLight ? MapboxGL.StyleURL.Light : MapboxGL.StyleURL.Dark}
          zoomLevel={zoom}
          pitch={pitch}
          bearing={bearing}
          onDidFinishLoadingMap={() => {}}
        >
          <MapboxGL.Camera
            zoomLevel={zoom}
            pitch={pitch}
            bearing={bearing}
            centerCoordinate={[longitude, latitude]}
            animationMode="flyTo"
            animationDuration={1000}
          />
          
          {/* Current user location marker */}
          <MapboxGL.PointAnnotation
            id="user-location"
            coordinate={[longitude, latitude]}
            title="Your Location"
            onSelected={() => {}}
          >
            <View style={[styles.userMarker, { backgroundColor: BRAND.primary }]} />
          </MapboxGL.PointAnnotation>

          {/* Custom children (additional markers) */}
          {children}
        </MapboxGL.MapView>
      </View>
    );
  }
);

MapboxMap.displayName = 'MapboxMap';

interface MarkerProps {
  id: string;
  coordinate: [number, number];
  title: string;
  color?: string;
  onPress?: () => void;
}

export const MapboxMarker: React.FC<MarkerProps> = ({
  id,
  coordinate,
  title,
  color = '#3B82F6',
  onPress,
}) => {
  return (
    <MapboxGL.PointAnnotation
      id={id}
      coordinate={coordinate}
      title={title}
      onSelected={() => onPress?.()}
    >
      <View style={[styles.marker, { backgroundColor: color }]} />
    </MapboxGL.PointAnnotation>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#fff',
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

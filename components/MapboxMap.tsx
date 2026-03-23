import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
let Mapbox: any = null;
try {
  // Try to require native Mapbox module. In Expo Go this will fail — provide a safe fallback.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Mapbox = require('@rnmapbox/maps');
} catch (err) {
  console.warn('⚠️ [MapboxMap] Native @rnmapbox/maps not available, falling back to placeholder map.');
  Mapbox = null;
}
import { useTheme } from '@/context/ThemeContext';

// Set Mapbox access token when module is available
if (Mapbox && typeof Mapbox.setAccessToken === 'function') {
  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN || '');
}

interface MapboxMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  cameraCenterCoordinate?: [number, number];
  cameraZoom?: number;
  cameraAnimationDuration?: number;
  onRegionChange?: (region: any) => void;
  onPressCoordinate?: (coordinate: { latitude: number; longitude: number }) => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  children?: React.ReactNode;
  style?: any;
}

export const MapboxMap = React.forwardRef<any, MapboxMapProps>(
  (
    {
      latitude = 6.5244,
      longitude = 3.3792,
      zoom = 14,
      pitch = 0,
      bearing = 0,
      cameraCenterCoordinate,
      cameraZoom,
      cameraAnimationDuration = 700,
      onRegionChange,
      onPressCoordinate,
      onTouchStart,
      onTouchEnd,
      children,
      style,
    },
    ref
  ) => {
    const { theme } = useTheme();
    const isLight = theme.mode === 'light';
    const cameraRef = useRef<Mapbox.Camera>(null);

    useEffect(() => {
      if (!cameraCenterCoordinate || !cameraRef.current) return;

      cameraRef.current.setCamera({
        centerCoordinate: cameraCenterCoordinate,
        zoomLevel: cameraZoom ?? zoom,
        animationMode: 'flyTo',
        animationDuration: cameraAnimationDuration,
      });
    }, [cameraCenterCoordinate, cameraZoom, zoom, cameraAnimationDuration]);

    const handleMapPress = (event: any) => {
      const coordinates = event?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;

      onPressCoordinate?.({
        longitude: Number(coordinates[0]),
        latitude: Number(coordinates[1]),
      });
    };

    if (!Mapbox) {
      // Fallback view for environments without native Mapbox (Expo Go)
      return (
        <View style={[styles.container, style, { justifyContent: 'center', alignItems: 'center' }]}> 
          {/* Minimal placeholder so route renders without crashing */}
          <View style={{ padding: 12 }}>
            <Text style={{ color: isLight ? '#111' : '#fff' }}>Map unavailable in this build.</Text>
          </View>
          {children}
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <Mapbox.MapView
          ref={ref}
          style={styles.map}
          styleURL={isLight ? Mapbox.StyleURL.Light : Mapbox.StyleURL.Dark}
          zoomEnabled={true}
          scrollEnabled={true}
          rotateEnabled={true}
          pitchEnabled={true}
          onPress={handleMapPress}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Mapbox.Camera
            ref={cameraRef}
            defaultSettings={{
              zoomLevel: zoom,
              centerCoordinate: [longitude, latitude],
              pitch,
              heading: bearing,
            }}
          />
          {children}
        </Mapbox.MapView>
      </View>
    );
  }
);

MapboxMap.displayName = 'MapboxMap';

interface MarkerProps {
  id: string;
  coordinate: [number, number];
  title: string;
  description?: string;
  color?: string;
  onPress?: () => void;
}

export const MapboxMarker: React.FC<MarkerProps> = ({
  id,
  coordinate,
  title,
  description,
  color = '#3B82F6',
  onPress,
}) => {
  // If native Mapbox isn't available (Expo Go), avoid accessing Mapbox.PointAnnotation
  if (!Mapbox) {
    return (
      <View style={{ padding: 6, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#888' }}>{title}</Text>
      </View>
    );
  }

  return (
    <Mapbox.PointAnnotation
      id={id}
      coordinate={coordinate}
      title={title}
      onSelected={() => onPress?.()}
    >
      <View style={[styles.marker, { backgroundColor: color }]} />
    </Mapbox.PointAnnotation>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
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

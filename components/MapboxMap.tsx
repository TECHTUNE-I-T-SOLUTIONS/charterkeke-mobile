import React from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { useTheme } from '@/context/ThemeContext';
import { BRAND } from '@/utils/colors';

// Set Mapbox access token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN || '');

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

export const MapboxMap = React.forwardRef<Mapbox.MapView, MapboxMapProps>(
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
        <Mapbox.MapView
          ref={ref}
          style={styles.map}
          styleURL={isLight ? Mapbox.StyleURL.Light : Mapbox.StyleURL.Dark}
        >
          <Mapbox.Camera
            zoomLevel={zoom}
            centerCoordinate={[longitude, latitude]}
            animationMode="flyTo"
            animationDuration={1000}
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

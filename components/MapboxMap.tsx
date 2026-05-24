import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';

let isExpoGo = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expoConstantsModule = require('expo-constants');
  const Constants = expoConstantsModule?.default || expoConstantsModule;
  const appOwnership = Constants?.appOwnership;
  const executionEnvironment = Constants?.executionEnvironment;
  isExpoGo = appOwnership === 'expo' || executionEnvironment === 'storeClient';
} catch {
  isExpoGo = false;
}

let Mapbox: any = null;
try {
  if (!isExpoGo) {
    // Try to require native Mapbox module. In Expo Go fallback should be forced.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Mapbox = require('@rnmapbox/maps');
  }
} catch {
  console.warn('⚠️ [MapboxMap] Native @rnmapbox/maps not available, falling back to placeholder map.');
  Mapbox = null;
}

let ReactNativeMaps: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ReactNativeMaps = require('react-native-maps');
} catch {
  ReactNativeMaps = null;
}

import { useTheme } from '@/context/ThemeContext';

const canUseNativeMapbox = Boolean(Mapbox) && !isExpoGo;
const canUseFallbackMap = Boolean(ReactNativeMaps?.default);

type Coordinate = [number, number];
type MapStyleVariant = 'auto' | 'standard' | 'standard-satellite' | 'navigation-day' | 'navigation-night' | 'light' | 'dark' | 'outdoors';
type RouteFeature = {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: {
    type: 'LineString';
    coordinates: Coordinate[];
  };
};

const DEFAULT_CENTER: Coordinate = [3.3792, 6.5244];

const isValidCoordinate = (coordinate: unknown): coordinate is Coordinate =>
  Array.isArray(coordinate) &&
  coordinate.length === 2 &&
  Number.isFinite(Number(coordinate[0])) &&
  Number.isFinite(Number(coordinate[1]));

const normalizeCoordinates = (coordinates?: Coordinate[]) =>
  (coordinates || [])
    .filter(isValidCoordinate)
    .map((coordinate) => [Number(coordinate[0]), Number(coordinate[1])] as Coordinate);

const zoomToLatitudeDelta = (zoomLevel: number) => {
  const safeZoom = Number.isFinite(zoomLevel) ? zoomLevel : 14;
  return Math.max(0.002, 360 / Math.pow(2, safeZoom));
};

const toLatLng = (coordinate: Coordinate) => ({
  latitude: coordinate[1],
  longitude: coordinate[0],
});

const deriveCameraTarget = (coordinates: Coordinate[]) => {
  if (!coordinates.length) {
    return null;
  }

  if (coordinates.length === 1) {
    return { center: coordinates[0], zoom: 15 };
  }

  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);

  const center: Coordinate = [
    (minLongitude + maxLongitude) / 2,
    (minLatitude + maxLatitude) / 2,
  ];

  const span = Math.max(maxLongitude - minLongitude, maxLatitude - minLatitude);
  const zoom =
    span < 0.002 ? 16 :
    span < 0.01 ? 15 :
    span < 0.05 ? 13 :
    span < 0.15 ? 11 :
    span < 0.5 ? 9 :
    7;

  return { center, zoom };
};

const resolveStyleURL = (themeMode: 'light' | 'dark', mapStyle: MapStyleVariant) => {
  switch (mapStyle) {
    case 'standard':
      return 'mapbox://styles/mapbox/standard';
    case 'standard-satellite':
      return 'mapbox://styles/mapbox/standard-satellite';
    case 'navigation-day':
      return 'mapbox://styles/mapbox/navigation-day-v1';
    case 'navigation-night':
      return 'mapbox://styles/mapbox/navigation-night-v1';
    case 'light':
      return Mapbox?.StyleURL?.Light || 'mapbox://styles/mapbox/light-v11';
    case 'dark':
      return Mapbox?.StyleURL?.Dark || 'mapbox://styles/mapbox/dark-v11';
    case 'outdoors':
      return 'mapbox://styles/mapbox/outdoors-v12';
    case 'auto':
    default:
      return themeMode === 'light'
        ? Mapbox?.StyleURL?.Light || 'mapbox://styles/mapbox/light-v11'
        : Mapbox?.StyleURL?.Dark || 'mapbox://styles/mapbox/dark-v11';
  }
};

// Set Mapbox access token when module is available
if (canUseNativeMapbox && typeof Mapbox.setAccessToken === 'function') {
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
  fitCoordinates?: [number, number][];
  routeCoordinates?: [number, number][];
  mapStyle?: MapStyleVariant;
  showUserLocation?: boolean;
  showCompass?: boolean;
  showScaleBar?: boolean;
  showAttribution?: boolean;
  showLogo?: boolean;
  routeColor?: string;
  routeWidth?: number;
  autoCenter?: boolean;
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
      fitCoordinates,
      routeCoordinates,
      mapStyle = 'auto',
      showUserLocation = false,
      showCompass = true,
      showScaleBar = false,
      showAttribution = true,
      showLogo = true,
      routeColor = '#2563EB',
      routeWidth = 4,
      autoCenter = true,
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
    const cameraRef = useRef<any>(null);
    const focusCoordinates = useMemo(
      () => normalizeCoordinates(fitCoordinates?.length ? fitCoordinates : routeCoordinates),
      [fitCoordinates, routeCoordinates]
    );

    const derivedCameraTarget = useMemo(
      () => deriveCameraTarget(focusCoordinates),
      [focusCoordinates]
    );

    const fallbackCenterFromProps: Coordinate = [Number(longitude), Number(latitude)];
    const resolvedCameraCenter =
      derivedCameraTarget?.center ||
      (isValidCoordinate(cameraCenterCoordinate) ? cameraCenterCoordinate : null) ||
      (isValidCoordinate(fallbackCenterFromProps) ? fallbackCenterFromProps : null) ||
      DEFAULT_CENTER;
    const resolvedCameraZoom = derivedCameraTarget?.zoom ?? cameraZoom ?? zoom;
    const fallbackRegion = useMemo(() => {
      const latitudeDelta = zoomToLatitudeDelta(resolvedCameraZoom);
      return {
        latitude: resolvedCameraCenter[1],
        longitude: resolvedCameraCenter[0],
        latitudeDelta,
        longitudeDelta: latitudeDelta,
      };
    }, [resolvedCameraCenter, resolvedCameraZoom]);
    const fallbackRouteCoordinates = useMemo(
      () => normalizeCoordinates(routeCoordinates).map(toLatLng),
      [routeCoordinates]
    );

    useEffect(() => {
      if (!autoCenter) return;
      if (!cameraRef.current) return;

      cameraRef.current.setCamera({
        centerCoordinate: resolvedCameraCenter,
        zoomLevel: resolvedCameraZoom,
        pitch,
        heading: bearing,
        animationMode: 'flyTo',
        animationDuration: cameraAnimationDuration,
      });
    }, [resolvedCameraCenter, resolvedCameraZoom, pitch, bearing, cameraAnimationDuration, autoCenter]);

    const routeFeature = useMemo(() => {
      if (!routeCoordinates || routeCoordinates.length < 2) return null;
      const validRoute = normalizeCoordinates(routeCoordinates);
      if (validRoute.length < 2) return null;

      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: validRoute,
        },
      } as RouteFeature;
    }, [routeCoordinates]);

    const handleMapPress = (event: any) => {
      const coordinates = event?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;

      onPressCoordinate?.({
        longitude: Number(coordinates[0]),
        latitude: Number(coordinates[1]),
      });
    };

    if (!canUseNativeMapbox && canUseFallbackMap) {
      const FallbackMapView = ReactNativeMaps.default;
      const FallbackPolyline = ReactNativeMaps.Polyline;

      return (
        <View style={[styles.container, style]}>
          <FallbackMapView
            ref={ref}
            style={styles.map}
            initialRegion={fallbackRegion}
            showsUserLocation={showUserLocation}
            showsCompass={showCompass}
            showsScale={showScaleBar}
            showsPointsOfInterest={true}
            showsBuildings={true}
            onRegionChangeComplete={(region: any) => onRegionChange?.(region)}
            onPress={(event: any) => {
              const coordinate = event?.nativeEvent?.coordinate;
              if (!coordinate) return;
              onPressCoordinate?.({
                latitude: Number(coordinate.latitude),
                longitude: Number(coordinate.longitude),
              });
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {fallbackRouteCoordinates.length >= 2 && FallbackPolyline ? (
              <FallbackPolyline
                coordinates={fallbackRouteCoordinates}
                strokeColor={routeColor}
                strokeWidth={routeWidth}
              />
            ) : null}
            {children}
          </FallbackMapView>
        </View>
      );
    }

    if (!canUseNativeMapbox) {
      return (
        <View style={[styles.container, style, { justifyContent: 'center', alignItems: 'center' }]}> 
          <View style={{ padding: 12 }}>
            <Text style={{ color: isLight ? '#111' : '#fff' }}>
              {isExpoGo ? 'Map unavailable. Install react-native-maps for Expo Go fallback.' : 'Map unavailable in this build.'}
            </Text>
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
          styleURL={resolveStyleURL(isLight ? 'light' : 'dark', mapStyle)}
          zoomEnabled={true}
          scrollEnabled={true}
          rotateEnabled={true}
          pitchEnabled={true}
          compassEnabled={showCompass}
          scaleBarEnabled={showScaleBar}
          attributionEnabled={showAttribution}
          logoEnabled={showLogo}
          onPress={handleMapPress}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Mapbox.Camera
            ref={cameraRef}
            defaultSettings={{
              zoomLevel: resolvedCameraZoom,
              centerCoordinate: resolvedCameraCenter,
              pitch,
              heading: bearing,
            }}
          />
          {showUserLocation && (
            <Mapbox.UserLocation
              visible
              animated
              showsUserHeadingIndicator
              androidRenderMode="gps"
            />
          )}
          {routeFeature && (
            <Mapbox.ShapeSource id="route-source" shape={routeFeature}>
              <Mapbox.LineLayer
                id="route-line"
                style={{
                  lineColor: routeColor,
                  lineWidth: routeWidth,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </Mapbox.ShapeSource>
          )}
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
  if (!canUseNativeMapbox && canUseFallbackMap) {
    const FallbackMarker = ReactNativeMaps.Marker;
    if (FallbackMarker) {
      return (
        <FallbackMarker
          identifier={id}
          coordinate={{
            latitude: Number(coordinate[1]),
            longitude: Number(coordinate[0]),
          }}
          title={title}
          description={description}
          pinColor={color}
          onPress={onPress}
        />
      );
    }
  }

  if (!canUseNativeMapbox) {
    return null;
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

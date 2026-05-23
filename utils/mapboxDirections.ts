export type Coordinate = [number, number];

export interface MapboxRouteResult {
  coordinates: Coordinate[];
  distanceKm: number;
  durationMin: number;
  distanceMeters: number;
  durationSeconds: number;
}

interface FetchRouteOptions {
  profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
}

export async function fetchMapboxRoute(
  origin: Coordinate,
  destination: Coordinate,
  options: FetchRouteOptions = {}
): Promise<MapboxRouteResult | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  if (!token) {
    return null;
  }

  const profile = options.profile || 'driving-traffic';
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&steps=false&alternatives=false&access_token=${encodeURIComponent(token)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox directions request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const route = payload?.routes?.[0];
  if (!route?.geometry?.coordinates?.length) {
    return null;
  }

  return {
    coordinates: route.geometry.coordinates.map((coordinate: number[]) => [Number(coordinate[0]), Number(coordinate[1])] as Coordinate),
    distanceKm: Number(route.distance || 0) / 1000,
    durationMin: Number(route.duration || 0) / 60,
    distanceMeters: Number(route.distance || 0),
    durationSeconds: Number(route.duration || 0),
  };
}

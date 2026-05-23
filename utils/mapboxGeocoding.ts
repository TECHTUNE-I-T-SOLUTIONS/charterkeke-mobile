export type Coordinate = [number, number];

export interface MapboxGeocodeResult {
  coordinate: Coordinate;
  placeName: string;
}

export async function geocodeMapboxLocation(query: string): Promise<MapboxGeocodeResult | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  if (!token || !query.trim()) {
    return null;
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=1&types=place,address,poi,locality,neighborhood&access_token=${encodeURIComponent(token)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox geocoding request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const feature = payload?.features?.[0];
  const center = feature?.center;

  if (!Array.isArray(center) || center.length < 2) {
    return null;
  }

  return {
    coordinate: [Number(center[0]), Number(center[1])],
    placeName: feature.place_name || query,
  };
}

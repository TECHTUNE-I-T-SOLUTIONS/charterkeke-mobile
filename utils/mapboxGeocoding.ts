export type Coordinate = [number, number];

export interface MapboxGeocodeResult {
  coordinate: Coordinate;
  placeName: string;
}

const LAGOS_CENTER: Coordinate = [3.3792, 6.5244];

const toResult = (placeName: string, center: Coordinate): MapboxGeocodeResult => ({
  coordinate: center,
  placeName,
});

export async function searchGooglePlaces(query: string): Promise<MapboxGeocodeResult[]> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || !query.trim()) return [];

  const url = `https://places.googleapis.com/v1/places:searchText`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'en',
      regionCode: 'ng',
      pageSize: 8,
      locationBias: {
        circle: {
          center: { latitude: LAGOS_CENTER[1], longitude: LAGOS_CENTER[0] },
          radius: 30000,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places search failed with status ${response.status}`);
  }

  const payload = await response.json();
  return (payload?.places || [])
    .map((place: any) => {
      const lat = place?.location?.latitude;
      const lng = place?.location?.longitude;
      const displayName = place?.displayName?.text || place?.formattedAddress || query;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return toResult(displayName, [Number(lng), Number(lat)]);
    })
    .filter(Boolean);
}

export async function searchMapboxSearchBoxForward(query: string): Promise<MapboxGeocodeResult[]> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  if (!token || !query.trim()) return [];

  const url = `https://api.mapbox.com/search/searchbox/v1/forward?q=${encodeURIComponent(query)}&access_token=${encodeURIComponent(token)}&language=en`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox Search Box request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return (payload?.features || [])
    .map((feature: any) => {
      const coords = feature?.geometry?.coordinates;
      const name = feature?.properties?.name || feature?.properties?.full_address || feature?.place_name || query;
      if (!Array.isArray(coords) || coords.length < 2) return null;
      return toResult(name, [Number(coords[0]), Number(coords[1])]);
    })
    .filter(Boolean);
}

export async function searchMapboxSearchBoxSuggest(query: string): Promise<MapboxGeocodeResult[]> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  if (!token || !query.trim()) return [];

  const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${encodeURIComponent(token)}&language=en&limit=8&country=NG&proximity=3.3792,6.5244`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox Search Box suggest failed with status ${response.status}`);
  }

  const payload = await response.json();
  return (payload?.suggestions || payload?.features || [])
    .map((item: any) => {
      const name = item?.name || item?.place_name || item?.full_address || item?.address || query;
      const coords = item?.geometry?.coordinates || item?.coordinates || item?.feature?.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2 && Number.isFinite(Number(coords[0])) && Number.isFinite(Number(coords[1]))) {
        return toResult(name, [Number(coords[0]), Number(coords[1])]);
      }
      return null;
    })
    .filter(Boolean);
}

export async function geocodeMapboxLocation(query: string): Promise<MapboxGeocodeResult | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  if (!token || !query.trim()) {
    return null;
  }

  const proximity = encodeURIComponent('3.3792,6.5244');
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=5&types=place,address,poi,locality,neighborhood&proximity=${proximity}&country=ng&autocomplete=true&access_token=${encodeURIComponent(token)}`;

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

export async function geocodeMapboxLocations(query: string): Promise<MapboxGeocodeResult[]> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN;
  if (!token || !query.trim()) {
    return [];
  }

  const proximity = encodeURIComponent('3.3792,6.5244');
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=6&types=place,address,poi,locality,neighborhood&proximity=${proximity}&country=ng&autocomplete=true&access_token=${encodeURIComponent(token)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox geocoding request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return (payload?.features || [])
    .map((feature: any) => {
      const center = feature?.center;
      if (!Array.isArray(center) || center.length < 2) return null;
      return {
        coordinate: [Number(center[0]), Number(center[1])] as Coordinate,
        placeName: feature.place_name || query,
      };
    })
    .filter(Boolean);
}

export async function searchBestLocations(query: string): Promise<MapboxGeocodeResult[]> {
  // Use only Mapbox geocoding (no Google Places)
  const merged: MapboxGeocodeResult[] = [];

  // Primary: Mapbox Geocoding API
  try {
    const mapboxResults = await geocodeMapboxLocations(query);
    merged.push(...mapboxResults);
  } catch {
    // Continue to fallbacks
  }

  // Fallback 1: Mapbox Search Box Suggest
  if (merged.length === 0) {
    try {
      const searchBoxResults = await searchMapboxSearchBoxSuggest(query);
      merged.push(...searchBoxResults);
    } catch {
      // Continue to next fallback
    }
  }

  // Fallback 2: Mapbox Search Box Forward
  if (merged.length === 0) {
    try {
      const searchBoxResults = await searchMapboxSearchBoxForward(query);
      merged.push(...searchBoxResults);
    } catch {
      // No results available
    }
  }

  // Also try Search Box Suggest as supplemental for better results
  try {
    const searchBoxResults = await searchMapboxSearchBoxSuggest(query);
    merged.push(...searchBoxResults);
  } catch {
    // Ignore supplemental errors
  }

  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = `${item.placeName.toLowerCase()}-${item.coordinate[0].toFixed(5)}-${item.coordinate[1].toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

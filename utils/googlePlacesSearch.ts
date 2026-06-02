import { supabaseService } from '@/services/supabase';
import { API_CONFIG } from '@/utils/constants';

export type LocationSearchSource = 'cache' | 'google' | 'local' | 'recent';

export interface LocationSearchResult {
  address: string;
  lat: number | null;
  lng: number | null;
  placeId?: string;
  name?: string;
  source?: LocationSearchSource;
  isRecent?: boolean;
}

const normalizeKeywords = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const wildcard = (query: string) => `%${normalizeKeywords(query)}%`;

const toCacheResult = (row: any): LocationSearchResult | null => {
  const lat = Number(row?.latitude);
  const lng = Number(row?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    address: row.formatted_address || row.name,
    lat,
    lng,
    placeId: row.place_id,
    name: row.name,
    source: 'cache',
  };
};

export async function searchCachedLocations(query: string): Promise<LocationSearchResult[]> {
  const cleaned = normalizeKeywords(query);
  if (cleaned.length < 2) return [];

  const supabase = supabaseService.getClient();
  const { data, error } = await supabase
    .from('search_locations')
    .select('place_id,name,formatted_address,latitude,longitude,usage_count,last_used_at')
    .or(`search_keywords.ilike.${wildcard(cleaned)},name.ilike.${wildcard(cleaned)},formatted_address.ilike.${wildcard(cleaned)}`)
    .order('usage_count', { ascending: false })
    .order('last_used_at', { ascending: false })
    .limit(8);

  if (error) {
    console.log('Supabase location cache search failed:', error.message);
    return [];
  }

  return (data || []).map(toCacheResult).filter(Boolean) as LocationSearchResult[];
}

export async function searchGoogleAutocomplete(
  query: string,
  sessionToken: string
): Promise<LocationSearchResult[]> {
  const cleaned = query.trim();
  if (cleaned.length < 2) return [];

  const response = await fetch(`${API_CONFIG.url}/places/autocomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: cleaned,
      sessionToken,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.details || payload?.error || `Google Places autocomplete failed with status ${response.status}`);
  }

  const payload = await response.json();
  return (payload?.suggestions || [])
    .map((suggestion: any) => {
      const prediction = suggestion?.placePrediction;
      const text = prediction?.text?.text;
      const lat = Number(prediction?.location?.latitude);
      const lng = Number(prediction?.location?.longitude);
      if (!prediction?.placeId || !text) return null;

      return {
        address: text,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        placeId: prediction.placeId,
        name: prediction?.structuredFormat?.mainText?.text || text,
        source: payload?.source === 'textSearchFallback' ? 'cache' : 'google',
      };
    })
    .filter(Boolean);
}

export async function getGooglePlaceDetails(
  placeId: string,
  sessionToken: string
): Promise<LocationSearchResult | null> {
  if (!placeId) return null;

  const response = await fetch(`${API_CONFIG.url}/places/details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ placeId, sessionToken }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.details || payload?.error || `Google Place Details failed with status ${response.status}`);
  }

  const payload = await response.json();
  const place = payload?.place;
  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    address: place.formattedAddress || place?.displayName?.text || 'Selected location',
    lat,
    lng,
    placeId: place.id || placeId,
    name: place?.displayName?.text || place.formattedAddress,
    source: 'google',
  };
}

export async function reverseGeocodeWithGooglePlaces(
  latitude: number,
  longitude: number
): Promise<LocationSearchResult | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const response = await fetch(`${API_CONFIG.url}/places/reverse-geocode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.details || payload?.error || `Google reverse geocoding failed with status ${response.status}`);
  }

  const payload = await response.json();
  const lat = Number(payload?.lat ?? latitude);
  const lng = Number(payload?.lng ?? longitude);

  return {
    address: payload?.address || 'Current location',
    lat: Number.isFinite(lat) ? lat : latitude,
    lng: Number.isFinite(lng) ? lng : longitude,
    placeId: payload?.placeId,
    name: payload?.name || payload?.address,
    source: 'google',
  };
}

export async function saveSearchLocationsToCache(results: LocationSearchResult[]): Promise<void> {
  const rows = results
    .filter((item) => item.placeId && Number.isFinite(item.lat) && Number.isFinite(item.lng))
    .map((item) => {
      const name = item.name || item.address;
      const formattedAddress = item.address;
      return {
        place_id: item.placeId,
        name,
        formatted_address: formattedAddress,
        latitude: item.lat,
        longitude: item.lng,
        search_keywords: normalizeKeywords(`${name} ${formattedAddress} Lagos Nigeria`),
        last_used_at: new Date().toISOString(),
      };
    });

  if (rows.length === 0) return;

  const { error } = await supabaseService
    .getClient()
    .from('search_locations')
    .upsert(rows, { onConflict: 'place_id' });

  if (error) {
    console.log('Saving search locations cache failed:', error.message);
  }
}

export async function markSearchLocationUsed(result: LocationSearchResult): Promise<void> {
  if (!result.placeId) return;

  const { error } = await supabaseService.getClient().rpc('increment_search_location_usage', {
    target_place_id: result.placeId,
  });

  if (error) {
    console.log('Updating search location usage failed:', error.message);
  }
}

export async function searchLagosPlaces(
  query: string,
  sessionToken: string
): Promise<LocationSearchResult[]> {
  const cached = await searchCachedLocations(query);
  if (cached.length > 0) return cached;

  return searchGoogleAutocomplete(query, sessionToken);
}

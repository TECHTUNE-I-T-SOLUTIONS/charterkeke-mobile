export type WeatherImpact = {
  status: 'clear' | 'cloudy' | 'rain' | 'storm' | 'unknown';
  label: string;
  detail: string;
  multiplier: number;
  surchargeRate: number;
  precipitationMm: number;
  icon: string;
};

const FALLBACK_WEATHER: WeatherImpact = {
  status: 'unknown',
  label: 'Weather unavailable',
  detail: 'We could not read live weather for this route.',
  multiplier: 1,
  surchargeRate: 0,
  precipitationMm: 0,
  icon: 'help-circle-outline',
};

const weatherCodeToImpact = (weatherCode?: number, precipitation?: number): WeatherImpact => {
  const rain = (precipitation || 0) > 0.1 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(Number(weatherCode));
  const storm = [95, 96, 99].includes(Number(weatherCode));
  const cloudy = [1, 2, 3, 45, 48].includes(Number(weatherCode));

  if (storm) {
    return {
      status: 'storm',
      label: 'Storm conditions',
      detail: 'Heavy rain or storm activity may slow the trip and increase demand.',
      multiplier: 1.22,
      surchargeRate: 0.22,
      precipitationMm: precipitation || 0,
      icon: 'weather-lightning-rainy',
    };
  }

  if (rain) {
    return {
      status: 'rain',
      label: 'Rainy conditions',
      detail: 'Rain is active on this route, so we apply a small weather surcharge.',
      multiplier: 1.12,
      surchargeRate: 0.12,
      precipitationMm: precipitation || 0,
      icon: 'weather-rainy',
    };
  }

  if (cloudy) {
    return {
      status: 'cloudy',
      label: 'Cloudy weather',
      detail: 'Conditions look manageable, with no weather surcharge applied.',
      multiplier: 1,
      surchargeRate: 0,
      precipitationMm: precipitation || 0,
      icon: 'weather-cloudy',
    };
  }

  return {
    status: 'clear',
    label: 'Clear weather',
    detail: 'No weather surcharge applied for this trip.',
    multiplier: 1,
    surchargeRate: 0,
    precipitationMm: precipitation || 0,
    icon: 'weather-sunny',
  };
};

export async function getWeatherImpact(latitude?: number, longitude?: number): Promise<WeatherImpact> {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return FALLBACK_WEATHER;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(latitude))}&longitude=${encodeURIComponent(String(longitude))}&current=weather_code,precipitation,temperature_2m,wind_speed_10m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) return FALLBACK_WEATHER;
    const data = await response.json();
    const current = data?.current || {};
    return weatherCodeToImpact(current.weather_code, Number(current.precipitation || 0));
  } catch {
    return FALLBACK_WEATHER;
  }
}

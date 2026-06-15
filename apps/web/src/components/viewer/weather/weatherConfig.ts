import type { WeatherDef, WeatherMode } from './types';

export const ITO_LAT = 17.0732;
export const ITO_LON = -96.7266;

export const WEATHER_DEFS: Record<WeatherMode, WeatherDef> = {
  clear: {
    label: 'Soleado',
    shortLabel: 'Sol',
    icon: '☀️',
    scene: {
      sky: '#e6f3ff',
      fog: '#e6f3ff',
      fogNear: 360,
      fogFar: 700,
      ambient: 1.4,
      hemisphere: 0.75,
      directional: 2.1,
      gridPrimary: '#b8cce0',
      gridSecondary: '#d0e3f0',
    },
    rain: null,
    hasStormFlash: false,
  },
  cloudy: {
    label: 'Nublado',
    shortLabel: 'Nubes',
    icon: '☁️',
    scene: {
      sky: '#d4dfe9',
      fog: '#c8d4e0',
      fogNear: 220,
      fogFar: 480,
      ambient: 0.95,
      hemisphere: 0.52,
      directional: 1.1,
      gridPrimary: '#a8b8c8',
      gridSecondary: '#bfccd8',
    },
    rain: null,
    hasStormFlash: false,
  },
  rain: {
    label: 'Lluvia',
    shortLabel: 'Lluvia',
    icon: '🌧️',
    scene: {
      sky: '#b8c8d8',
      fog: '#a0b0c4',
      fogNear: 160,
      fogFar: 360,
      ambient: 0.72,
      hemisphere: 0.38,
      directional: 0.72,
      gridPrimary: '#8fa4b8',
      gridSecondary: '#a8bac8',
    },
    rain: {
      count: 1400,
      countMobile: 480,
      range: 560,
      height: 160,
      speedBase: 96,
      speedVariance: 0.5,
      driftBase: 15,
      streakBase: 15,
      streakVariance: 0.6,
      slant: 3.5,
      color: '#fed7aa',
      opacity: 0.62,
    },
    hasStormFlash: false,
  },
  storm: {
    label: 'Tormenta',
    shortLabel: 'Tormenta',
    icon: '⛈️',
    scene: {
      sky: '#4a5568',
      fog: '#3d4a5c',
      fogNear: 100,
      fogFar: 280,
      ambient: 0.38,
      hemisphere: 0.28,
      directional: 0.32,
      gridPrimary: '#64748b',
      gridSecondary: '#8898a8',
    },
    rain: {
      count: 1400,
      countMobile: 480,
      range: 560,
      height: 160,
      speedBase: 145,
      speedVariance: 0.6,
      driftBase: 34,
      streakBase: 22,
      streakVariance: 0.7,
      slant: 8.5,
      color: '#fdba74',
      opacity: 0.82,
    },
    hasStormFlash: true,
  },
  fog: {
    label: 'Niebla',
    shortLabel: 'Niebla',
    icon: '🌫️',
    scene: {
      sky: '#d8e2ec',
      fog: '#b8c8d8',
      fogNear: 35,
      fogFar: 160,
      ambient: 0.88,
      hemisphere: 0.48,
      directional: 0.65,
      gridPrimary: '#a8b8c8',
      gridSecondary: '#bfccd8',
    },
    rain: null,
    hasStormFlash: false,
  },
};

export function buildWeatherUrl(lat: number, lon: number): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=weather_code,cloud_cover,precipitation,rain&timezone=auto`;
}

export type ApiCurrent = {
  weather_code?: number;
  cloud_cover?: number;
  /** Total precipitation (rain + drizzle + snow) accumulated in the current 15-min interval, in mm. */
  precipitation?: number;
  /** Rain-only component of precipitation, in mm. */
  rain?: number;
};

export function weatherCodeToMode(current: ApiCurrent | undefined): WeatherMode {
  const code = current?.weather_code ?? 0;
  const cloudCover = current?.cloud_cover ?? 0;
  const precipitation = current?.precipitation ?? 0;

  // Thunderstorm: 95, 96, 99
  if (code >= 95) return 'storm';

  // Fog: 45, 48
  if (code === 45 || code === 48) return 'fog';

  // Snow (no snow mode — treat as fog visually): 71-77, 85-86
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'fog';

  // Actual rain and showers: 61-67, 80-82
  // These codes mean rainfall is significant enough to be visible.
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';

  // Drizzle codes (51-57) are atmospheric condensation that may not be visible.
  // Only show rain if precipitation in the current slot is meaningful (≥ 0.3 mm / 15 min).
  if (code >= 51 && code <= 57 && precipitation >= 0.3) return 'rain';

  // Overcast or high cloud cover → cloudy
  if (code === 2 || code === 3 || cloudCover >= 80) return 'cloudy';

  return 'clear';
}

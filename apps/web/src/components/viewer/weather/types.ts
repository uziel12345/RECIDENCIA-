export type WeatherMode = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';

export type WeatherControl = 'auto' | WeatherMode;

export type SceneConfig = {
  sky: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  ambient: number;
  hemisphere: number;
  directional: number;
  gridPrimary: string;
  gridSecondary: string;
};

export type RainConfig = {
  count: number;
  countMobile: number;
  range: number;
  height: number;
  speedBase: number;
  speedVariance: number;
  driftBase: number;
  streakBase: number;
  streakVariance: number;
  slant: number;
  color: string;
  opacity: number;
};

export type WeatherDef = {
  label: string;
  shortLabel: string;
  icon: string;
  scene: SceneConfig;
  rain: RainConfig | null;
  hasStormFlash: boolean;
};

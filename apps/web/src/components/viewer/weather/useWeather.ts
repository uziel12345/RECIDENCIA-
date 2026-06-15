import { useEffect, useState } from 'react';
import { buildWeatherUrl, weatherCodeToMode, type ApiCurrent } from './weatherConfig';
import type { WeatherControl, WeatherMode } from './types';

const REFRESH_MS = 10 * 60_000;

type ApiResponse = { current?: ApiCurrent };

export type UseWeatherReturn = {
  mode: WeatherMode;
  control: WeatherControl;
  setControl: (v: WeatherControl) => void;
};

export function useWeather(lat: number, lon: number): UseWeatherReturn {
  const [autoMode, setAutoMode] = useState<WeatherMode>('cloudy');
  const [control, setControl] = useState<WeatherControl>('auto');

  const mode: WeatherMode = control === 'auto' ? autoMode : control;

  useEffect(() => {
    const ac = new AbortController();
    const url = buildWeatherUrl(lat, lon);

    async function sync() {
      try {
        const res = await fetch(url, { signal: ac.signal, cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as ApiResponse;
        setAutoMode(weatherCodeToMode(data.current));
      } catch {
        // network error or aborted — keep current auto mode
      }
    }

    void sync();
    const timer = window.setInterval(sync, REFRESH_MS);

    return () => {
      ac.abort();
      window.clearInterval(timer);
    };
  }, [lat, lon]);

  return { mode, control, setControl };
}

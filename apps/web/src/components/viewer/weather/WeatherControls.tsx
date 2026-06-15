import { WEATHER_DEFS } from './weatherConfig';
import type { WeatherControl, WeatherMode } from './types';

const MODES: WeatherMode[] = ['clear', 'cloudy', 'rain', 'storm', 'fog'];

type Props = {
  mode: WeatherMode;
  control: WeatherControl;
  onControlChange: (v: WeatherControl) => void;
};

export function WeatherControls({ mode, control, onControlChange }: Props) {
  return (
    <div className="ito-weather-control" role="group" aria-label="Simulación de clima">
      <button
        type="button"
        title="Clima actual de tu ubicación"
        className={`ito-weather-control__btn${control === 'auto' ? ' ito-weather-control__btn--active' : ''}`}
        onClick={() => onControlChange('auto')}
      >
        <span className="ito-weather-control__icon">A</span>
        <span className="ito-weather-control__label">Auto</span>
      </button>

      {MODES.map((m) => {
        const def = WEATHER_DEFS[m];
        const isActive = control !== 'auto' && mode === m;
        return (
          <button
            key={m}
            type="button"
            title={def.label}
            className={`ito-weather-control__btn${isActive ? ' ito-weather-control__btn--active' : ''}`}
            onClick={() => onControlChange(m)}
          >
            <span className="ito-weather-control__icon">{def.icon}</span>
            <span className="ito-weather-control__label">{def.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  type BufferGeometry,
  type LineBasicMaterial,
  type LineSegments,
  type PointLight,
} from 'three';
import { WEATHER_DEFS } from './weatherConfig';
import { buildRainBuffers, resetDrop } from './particles';
import type { RainConfig } from './types';
import type { WeatherMode } from './types';

// ─── Rain particles (3D Canvas) ──────────────────────────────────────────────

type RainParticlesProps = { cfg: RainConfig; isMobile: boolean };

function RainParticles({ cfg, isMobile }: RainParticlesProps) {
  const count = isMobile ? cfg.countMobile : cfg.count;
  const rainRef = useRef<LineSegments<BufferGeometry, LineBasicMaterial>>(null);

  // Stored in refs so useFrame can mutate them without triggering re-renders
  const speedsRef = useRef<Float32Array>(new Float32Array(0));
  const streaksRef = useRef<Float32Array>(new Float32Array(0));

  const buffers = useMemo(() => buildRainBuffers({
    count,
    range: cfg.range,
    height: cfg.height,
    speedBase: cfg.speedBase,
    speedVariance: cfg.speedVariance,
    streakBase: cfg.streakBase,
    streakVariance: cfg.streakVariance,
    slant: cfg.slant,
  }), [count, cfg.range, cfg.height, cfg.speedBase, cfg.speedVariance, cfg.streakBase, cfg.streakVariance, cfg.slant]);

  // Sync animation refs after render — safe to mutate refs in effects
  useEffect(() => {
    speedsRef.current = buffers.speeds;
    streaksRef.current = buffers.streaks;
  }, [buffers]);

  useFrame((_, delta) => {
    const rain = rainRef.current;
    const speeds = speedsRef.current;
    if (!rain || !speeds.length) return;

    const attr = rain.geometry.attributes.position;
    const vals = attr.array as Float32Array;
    const drift = cfg.driftBase;

    for (let i = 0; i < count; i++) {
      const b = i * 6;
      const spd = speeds[i] * delta;

      // Top and bottom of each streak fall together
      vals[b]     += drift * delta;
      vals[b + 1] -= spd;
      vals[b + 2] -= drift * 0.25 * delta;
      vals[b + 3] += drift * delta;
      vals[b + 4] -= spd;
      vals[b + 5] -= drift * 0.25 * delta;

      // Recycle when the top of the streak hits ground
      if (vals[b + 1] < 2) {
        resetDrop(vals, speeds, streaksRef.current, i, cfg);
      }
    }

    attr.needsUpdate = true;
  });

  return (
    <lineSegments ref={rainRef} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buffers.positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color={cfg.color}
        transparent
        opacity={cfg.opacity}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </lineSegments>
  );
}

// ─── Storm flash (non-uniform double/triple pulse) ────────────────────────────

type FlashState = {
  nextAt: number;   // elapsed time at which the flash sequence starts
  double: boolean;  // whether to fire a second pulse
  triple: boolean;  // whether to add a third weaker pulse
};

function makeFlashState(after: number): FlashState {
  return {
    nextAt: after + 2.5 + Math.random() * 5.0,
    double: Math.random() > 0.35,
    triple: Math.random() > 0.65,
  };
}

function StormFlash() {
  const lightRef = useRef<PointLight>(null);
  const elapsed = useRef(0);
  const flash = useRef<FlashState>(makeFlashState(1.5));

  useFrame((_, delta) => {
    const light = lightRef.current;
    if (!light) return;

    elapsed.current += delta;
    const t = elapsed.current;
    const f = flash.current;

    if (t < f.nextAt) {
      light.intensity = 0;
      return;
    }

    // Phase relative to flash start
    const phase = t - f.nextAt;

    if (phase < 0.09) {
      light.intensity = 20;
    } else if (phase < 0.17) {
      light.intensity = 0;
    } else if (phase < 0.25 && f.double) {
      light.intensity = 12;
    } else if (phase < 0.35) {
      light.intensity = 0;
    } else if (phase < 0.42 && f.triple) {
      light.intensity = 5;
    } else {
      light.intensity = 0;
      // Schedule next flash only once the tail is fully over
      if (phase > 0.55) {
        flash.current = makeFlashState(t);
      }
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 170, 40]}
      color="#e0eeff"
      distance={600}
      intensity={0}
    />
  );
}

// ─── WeatherLayer: 3D canvas elements ────────────────────────────────────────

/**
 * Drop this inside a <Canvas> (or a <Suspense> group) to render
 * weather-related 3D elements: rain streaks and storm flash light.
 */
export function WeatherLayer({
  mode,
  isMobile = false,
}: {
  mode: WeatherMode;
  isMobile?: boolean;
}) {
  const def = WEATHER_DEFS[mode];
  return (
    <>
      {def.rain && <RainParticles cfg={def.rain} isMobile={isMobile} />}
      {def.hasStormFlash && <StormFlash />}
    </>
  );
}

// ─── WeatherOverlay: HTML atmosphere over the canvas ─────────────────────────

/**
 * Drop this alongside (outside) the <Canvas> to render
 * CSS-animated atmospheric overlays: sun halo, cloud layers, mist, etc.
 */
export function WeatherOverlay({ mode }: { mode: WeatherMode }) {
  return (
    <div
      className={`ito-weather-atmosphere ito-weather-atmosphere--${mode}`}
      aria-hidden="true"
    >
      <div className="ito-weather-atmosphere__sun" />
      <div className="ito-weather-atmosphere__clouds" />
      <div className="ito-weather-atmosphere__rain" />
      <div className="ito-weather-atmosphere__mist" />
      <div className="ito-weather-atmosphere__flash" />
    </div>
  );
}

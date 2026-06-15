// Deterministic pseudo-random from seed — no Math.random() at init time
// so positions are stable across re-renders with the same seed.
function seeded(n: number): number {
  const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

export type RainBuffers = {
  /** Interleaved [topX,topY,topZ, botX,botY,botZ] × count */
  positions: Float32Array;
  /** Per-drop actual speed (units/s) */
  speeds: Float32Array;
  /** Per-drop streak length */
  streaks: Float32Array;
};

export type RainParams = {
  count: number;
  range: number;
  height: number;
  speedBase: number;
  speedVariance: number;
  streakBase: number;
  streakVariance: number;
  slant: number;
  seed?: number;
};

export function buildRainBuffers(p: RainParams): RainBuffers {
  const { count, range, height, speedBase, speedVariance, streakBase, streakVariance, slant, seed = 0 } = p;
  const positions = new Float32Array(count * 6);
  const speeds = new Float32Array(count);
  const streaks = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const s = i * 6 + seed;
    const x = (seeded(s + 1) - 0.5) * range;
    const y = seeded(s + 2) * height + 18;
    const z = (seeded(s + 3) - 0.5) * range;

    // streakVariance=0.6 → streak in [0.7 × base, 1.3 × base]
    const streakMul = 1 - streakVariance / 2 + seeded(s + 4) * streakVariance;
    const streak = streakBase * streakMul;

    const speedMul = 1 - speedVariance / 2 + seeded(s + 5) * speedVariance;

    const b = i * 6;
    positions[b]     = x;
    positions[b + 1] = y;
    positions[b + 2] = z;
    positions[b + 3] = x + slant;
    positions[b + 4] = y - streak;
    positions[b + 5] = z - slant * 0.5;

    speeds[i] = speedBase * speedMul;
    streaks[i] = streak;
  }

  return { positions, speeds, streaks };
}

/** Reset a single drop to a new random position at the top of the field. */
export function resetDrop(
  vals: Float32Array,
  speeds: Float32Array,
  streaks: Float32Array,
  i: number,
  cfg: { range: number; height: number; speedBase: number; speedVariance: number; streakBase: number; streakVariance: number; slant: number },
): void {
  const x = (Math.random() - 0.5) * cfg.range;
  const y = cfg.height + 18;
  const z = (Math.random() - 0.5) * cfg.range;

  const streakMul = 1 - cfg.streakVariance / 2 + Math.random() * cfg.streakVariance;
  const streak = cfg.streakBase * streakMul;
  const speedMul = 1 - cfg.speedVariance / 2 + Math.random() * cfg.speedVariance;

  const b = i * 6;
  vals[b]     = x;
  vals[b + 1] = y;
  vals[b + 2] = z;
  vals[b + 3] = x + cfg.slant;
  vals[b + 4] = y - streak;
  vals[b + 5] = z - cfg.slant * 0.5;

  speeds[i] = cfg.speedBase * speedMul;
  streaks[i] = streak;
}

import { QualityTier } from "@/types/universe";

export interface QualityPreset {
  dpr: [number, number];
  stars: number;
  dust: number;
  continuum: number;
  dissolveParticles: number;
  hawkingSparks: number;
  bloomIntensity: number;
}

/**
 * Scene budgets per tier. Counts are deliberately modest at `low` so the
 * prologue still runs on integrated GPUs and phones; `ultra` trades fill rate
 * for density, never for larger point sizes (which would clip the bloom).
 */
export const QUALITY_PRESETS: Record<QualityTier, QualityPreset> = {
  low: {
    dpr: [0.75, 1],
    stars: 2200,
    dust: 160,
    continuum: 900,
    dissolveParticles: 600,
    hawkingSparks: 7,
    bloomIntensity: 0.8,
  },
  medium: {
    dpr: [1, 1.5],
    stars: 4500,
    dust: 380,
    continuum: 1600,
    dissolveParticles: 1100,
    hawkingSparks: 10,
    bloomIntensity: 0.95,
  },
  high: {
    dpr: [1, 2],
    stars: 8500,
    dust: 750,
    continuum: 2600,
    dissolveParticles: 1600,
    hawkingSparks: 13,
    bloomIntensity: 1.1,
  },
  ultra: {
    dpr: [1, 2],
    stars: 12000,
    dust: 1000,
    continuum: 3600,
    dissolveParticles: 2200,
    hawkingSparks: 16,
    bloomIntensity: 1.2,
  },
};

export const QUALITY_ORDER: QualityTier[] = ["low", "medium", "high", "ultra"];

export function nextQuality(current: QualityTier): QualityTier {
  const index = QUALITY_ORDER.indexOf(current);
  return QUALITY_ORDER[(index + 1) % QUALITY_ORDER.length];
}

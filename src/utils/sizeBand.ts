import { MinMaxRange, SizeBand } from '../types/domain';

/**
 * Derives dog size category based on weight (kg) or height (cm) fallback:
 *
 * Weight Thresholds:
 * - Small:  avg <= 10 kg
 * - Medium: 10 kg < avg <= 25 kg
 * - Large:  25 kg < avg <= 45 kg
 * - Giant:  avg > 45 kg
 *
 * Height Fallback Thresholds (when weight is absent):
 * - Small:  avg <= 35 cm
 * - Medium: 35 cm < avg <= 55 cm
 * - Large:  55 cm < avg <= 70 cm
 * - Giant:  avg > 70 cm
 */
export function calculateAverage(range?: MinMaxRange | null): number | null {
  if (!range) return null;
  const { min, max } = range;
  if (min != null && max != null) return (min + max) / 2;
  if (min != null) return min;
  if (max != null) return max;
  return null;
}

export function deriveSizeBand(weight?: MinMaxRange | null, height?: MinMaxRange | null): SizeBand {
  const avgWeight = calculateAverage(weight);
  if (avgWeight !== null && avgWeight > 0) {
    if (avgWeight <= 10) return 'small';
    if (avgWeight <= 25) return 'medium';
    if (avgWeight <= 45) return 'large';
    return 'giant';
  }

  const avgHeight = calculateAverage(height);
  if (avgHeight !== null && avgHeight > 0) {
    if (avgHeight <= 35) return 'small';
    if (avgHeight <= 55) return 'medium';
    if (avgHeight <= 70) return 'large';
    return 'giant';
  }

  return 'unknown';
}

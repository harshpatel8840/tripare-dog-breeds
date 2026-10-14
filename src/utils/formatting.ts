import { MinMaxRange } from '../types/domain';

export function formatTimeAgo(timestampMs?: number | null): string {
  if (!timestampMs || timestampMs <= 0) {
    return 'Never';
  }

  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - timestampMs) / 1000));

  if (diffSeconds < 60) {
    return 'Just now';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return `${diffDays} days ago`;
}

export function formatRange(
  range?: MinMaxRange | null,
  unit?: string,
  fallback = 'Not provided',
): string {
  if (!range) return fallback;
  const { min, max } = range;
  const suffix = unit ? ` ${unit}` : '';

  if (min != null && max != null) {
    if (min === max) {
      return `${min}${suffix}`;
    }
    return `${min} – ${max}${suffix}`;
  }
  if (min != null) return `From ${min}${suffix}`;
  if (max != null) return `Up to ${max}${suffix}`;
  return fallback;
}

export function formatExerciseMinutes(minutes?: number | null): string {
  if (minutes == null || isNaN(minutes) || minutes <= 0) {
    return 'Not provided';
  }
  return `${minutes} min/day`;
}

export function formatStringList(items?: string[] | null, fallback = 'Not provided'): string {
  if (!items || items.length === 0) return fallback;
  return items.join(', ');
}

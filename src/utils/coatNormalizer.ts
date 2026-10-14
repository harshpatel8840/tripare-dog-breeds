import { CoatLength } from '../types/domain';

/**
 * Normalizes coat attributes from the API.
 * In Dog API, 'wire' is primarily defined under coat.type (e.g. Affenpinscher coat.type = "wire", length = "short"),
 * while the requirement requires supporting 'wire' as a coat length filter category.
 *
 * Matching rule:
 * - If coat.type is 'wire' OR coat.length is 'wire', it satisfies the 'wire' category.
 * - Otherwise matches coat.length ('short', 'medium', 'long').
 */
export function normalizeCoatCategory(
  coatType?: string | null,
  coatLength?: string | null,
): CoatLength | 'other' {
  const normType = coatType?.trim().toLowerCase();
  const normLength = coatLength?.trim().toLowerCase();

  if (normType === 'wire' || normLength === 'wire') {
    return 'wire';
  }

  if (normLength === 'short') return 'short';
  if (normLength === 'medium') return 'medium';
  if (normLength === 'long') return 'long';

  return 'other';
}

export function matchesCoatFilter(
  selectedCoatLengths: CoatLength[],
  coatType?: string | null,
  coatLength?: string | null,
): boolean {
  if (selectedCoatLengths.length === 0) return true;

  const normType = coatType?.trim().toLowerCase();
  const normLength = coatLength?.trim().toLowerCase();

  for (const filter of selectedCoatLengths) {
    if (filter === 'wire') {
      if (normType === 'wire' || normLength === 'wire') return true;
    } else {
      if (normLength === filter) return true;
    }
  }

  return false;
}

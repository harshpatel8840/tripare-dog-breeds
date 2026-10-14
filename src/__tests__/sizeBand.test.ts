import { deriveSizeBand, calculateAverage } from '../utils/sizeBand';

describe('sizeBand utility', () => {
  describe('calculateAverage', () => {
    it('returns null for null or undefined range', () => {
      expect(calculateAverage(null)).toBeNull();
      expect(calculateAverage(undefined)).toBeNull();
    });

    it('returns midpoint when min and max are present', () => {
      expect(calculateAverage({ min: 10, max: 20 })).toBe(15);
      expect(calculateAverage({ min: 4, max: 6 })).toBe(5);
    });

    it('returns min or max when only one is present', () => {
      expect(calculateAverage({ min: 12 })).toBe(12);
      expect(calculateAverage({ max: 18 })).toBe(18);
    });

    it('returns null when both are null/undefined', () => {
      expect(calculateAverage({ min: null, max: null })).toBeNull();
    });
  });

  describe('deriveSizeBand boundaries', () => {
    // Small: <= 10 kg
    it('derives small for weight <= 10 kg', () => {
      expect(deriveSizeBand({ min: 4, max: 6 })).toBe('small');
      expect(deriveSizeBand({ min: 10, max: 10 })).toBe('small');
      expect(deriveSizeBand({ min: 2, max: 8 })).toBe('small');
    });

    // Medium: 10 < weight <= 25 kg
    it('derives medium for weight between 11 and 25 kg', () => {
      expect(deriveSizeBand({ min: 11, max: 15 })).toBe('medium');
      expect(deriveSizeBand({ min: 20, max: 25 })).toBe('medium');
    });

    // Large: 25 < weight <= 45 kg
    it('derives large for weight between 26 and 45 kg', () => {
      expect(deriveSizeBand({ min: 26, max: 34 })).toBe('large');
      expect(deriveSizeBand({ min: 40, max: 45 })).toBe('large');
    });

    // Giant: weight > 45 kg
    it('derives giant for weight > 45 kg', () => {
      expect(deriveSizeBand({ min: 46, max: 60 })).toBe('giant');
      expect(deriveSizeBand({ min: 50, max: 80 })).toBe('giant');
    });

    // Fallback to height when weight is missing
    it('falls back to height if weight is missing', () => {
      expect(deriveSizeBand(null, { min: 20, max: 30 })).toBe('small'); // avg 25 <= 35
      expect(deriveSizeBand(null, { min: 40, max: 50 })).toBe('medium'); // avg 45 <= 55
      expect(deriveSizeBand(null, { min: 60, max: 65 })).toBe('large'); // avg 62.5 <= 70
      expect(deriveSizeBand(null, { min: 75, max: 85 })).toBe('giant'); // avg 80 > 70
    });

    // Unknown when both weight and height are missing
    it('returns unknown when both weight and height are absent', () => {
      expect(deriveSizeBand(null, null)).toBe('unknown');
      expect(deriveSizeBand(undefined, undefined)).toBe('unknown');
      expect(deriveSizeBand({ min: 0, max: 0 }, { min: 0, max: 0 })).toBe('unknown');
    });
  });
});

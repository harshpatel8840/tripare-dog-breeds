import {
  formatTimeAgo,
  formatRange,
  formatExerciseMinutes,
  formatStringList,
} from '../utils/formatting';

describe('formatting utility', () => {
  describe('formatTimeAgo', () => {
    it('returns Never for null or undefined', () => {
      expect(formatTimeAgo(null)).toBe('Never');
      expect(formatTimeAgo(undefined)).toBe('Never');
      expect(formatTimeAgo(0)).toBe('Never');
    });

    it('returns Just now for recent timestamps', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 10000)).toBe('Just now');
    });

    it('returns minutes ago', () => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      expect(formatTimeAgo(fiveMinAgo)).toBe('5 minutes ago');

      const oneMinAgo = Date.now() - 60 * 1000;
      expect(formatTimeAgo(oneMinAgo)).toBe('1 minute ago');
    });

    it('returns hours ago', () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      expect(formatTimeAgo(twoHoursAgo)).toBe('2 hours ago');
    });

    it('returns Yesterday for 24-48 hours ago', () => {
      const oneDayAgo = Date.now() - 25 * 60 * 60 * 1000;
      expect(formatTimeAgo(oneDayAgo)).toBe('Yesterday');
    });
  });

  describe('formatRange', () => {
    it('returns Not provided for missing range', () => {
      expect(formatRange(null)).toBe('Not provided');
      expect(formatRange(undefined)).toBe('Not provided');
      expect(formatRange({ min: null, max: null })).toBe('Not provided');
    });

    it('formats range with min and max', () => {
      expect(formatRange({ min: 14, max: 16 }, 'years')).toBe('14 – 16 years');
      expect(formatRange({ min: 4, max: 6 }, 'kg')).toBe('4 – 6 kg');
    });

    it('formats single value when min equals max', () => {
      expect(formatRange({ min: 10, max: 10 }, 'kg')).toBe('10 kg');
    });

    it('formats open-ended ranges', () => {
      expect(formatRange({ min: 15 }, 'kg')).toBe('From 15 kg');
      expect(formatRange({ max: 25 }, 'kg')).toBe('Up to 25 kg');
    });
  });

  describe('formatExerciseMinutes', () => {
    it('returns Not provided for null/zero/negative', () => {
      expect(formatExerciseMinutes(null)).toBe('Not provided');
      expect(formatExerciseMinutes(0)).toBe('Not provided');
      expect(formatExerciseMinutes(-10)).toBe('Not provided');
    });

    it('formats valid exercise minutes', () => {
      expect(formatExerciseMinutes(30)).toBe('30 min/day');
      expect(formatExerciseMinutes(60)).toBe('60 min/day');
    });
  });

  describe('formatStringList', () => {
    it('formats arrays into comma-separated string', () => {
      expect(formatStringList(['AKC', 'FCI', 'UKC'])).toBe('AKC, FCI, UKC');
    });

    it('returns fallback for empty or missing arrays', () => {
      expect(formatStringList([])).toBe('Not provided');
      expect(formatStringList(null)).toBe('Not provided');
    });
  });
});

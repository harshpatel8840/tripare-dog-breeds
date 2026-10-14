import { normalizeCoatCategory, matchesCoatFilter } from '../utils/coatNormalizer';

describe('coatNormalizer utility', () => {
  describe('normalizeCoatCategory', () => {
    it('normalizes wire coat type even if length is short', () => {
      expect(normalizeCoatCategory('wire', 'short')).toBe('wire');
      expect(normalizeCoatCategory('wire', null)).toBe('wire');
      expect(normalizeCoatCategory(null, 'wire')).toBe('wire');
    });

    it('normalizes length fields correctly', () => {
      expect(normalizeCoatCategory('smooth', 'short')).toBe('short');
      expect(normalizeCoatCategory('double', 'medium')).toBe('medium');
      expect(normalizeCoatCategory('silky', 'long')).toBe('long');
    });

    it('returns other for unknown values', () => {
      expect(normalizeCoatCategory('hairless', 'none')).toBe('other');
      expect(normalizeCoatCategory(null, null)).toBe('other');
    });
  });

  describe('matchesCoatFilter', () => {
    it('returns true when no filters are selected', () => {
      expect(matchesCoatFilter([], 'wire', 'short')).toBe(true);
      expect(matchesCoatFilter([], null, null)).toBe(true);
    });

    it('matches wire filter when coat.type is wire', () => {
      expect(matchesCoatFilter(['wire'], 'wire', 'short')).toBe(true);
      expect(matchesCoatFilter(['wire'], 'smooth', 'short')).toBe(false);
    });

    it('matches wire filter when coat.length is wire', () => {
      expect(matchesCoatFilter(['wire'], 'double', 'wire')).toBe(true);
    });

    it('matches short, medium, and long length filters correctly', () => {
      expect(matchesCoatFilter(['short'], 'smooth', 'short')).toBe(true);
      expect(matchesCoatFilter(['medium'], 'double', 'medium')).toBe(true);
      expect(matchesCoatFilter(['long'], 'silky', 'long')).toBe(true);
      expect(matchesCoatFilter(['short'], 'silky', 'long')).toBe(false);
    });

    it('supports multiple selected coat filters', () => {
      expect(matchesCoatFilter(['short', 'wire'], 'wire', 'medium')).toBe(true);
      expect(matchesCoatFilter(['short', 'wire'], 'smooth', 'short')).toBe(true);
      expect(matchesCoatFilter(['short', 'wire'], 'silky', 'long')).toBe(false);
    });
  });
});

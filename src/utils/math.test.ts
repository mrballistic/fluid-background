import { describe, it, expect } from 'vitest';
import { clamp, normalize, map, lerp, smoothstep } from './math';

describe('Math utilities', () => {
  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('normalize', () => {
    it('should normalize value to 0-1 range', () => {
      expect(normalize(5, 0, 10)).toBe(0.5);
      expect(normalize(0, 0, 10)).toBe(0);
      expect(normalize(10, 0, 10)).toBe(1);
    });

    it('should handle negative ranges', () => {
      expect(normalize(0, -10, 10)).toBe(0.5);
      expect(normalize(-5, -10, 10)).toBe(0.25);
    });
  });

  describe('map', () => {
    it('should map value from one range to another', () => {
      expect(map(5, 0, 10, 0, 100)).toBe(50);
      expect(map(0, 0, 10, 100, 200)).toBe(100);
      expect(map(10, 0, 10, 100, 200)).toBe(200);
    });

    it('should handle different ranges', () => {
      expect(map(1, 0, 2, -1, 1)).toBe(0);
      expect(map(0.5, 0, 1, 10, 20)).toBe(15);
    });
  });

  describe('lerp', () => {
    it('should interpolate between two values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
      expect(lerp(10, -10, 0.25)).toBe(5);
    });
  });

  describe('smoothstep', () => {
    it('should provide smooth interpolation', () => {
      expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5);
      expect(smoothstep(0, 1, 0)).toBe(0);
      expect(smoothstep(0, 1, 1)).toBe(1);
    });

    it('should clamp values outside range', () => {
      expect(smoothstep(0, 1, -0.5)).toBe(0);
      expect(smoothstep(0, 1, 1.5)).toBe(1);
    });

    it('should be smoother than linear interpolation', () => {
      const linear = 0.25;
      const smooth = smoothstep(0, 1, 0.25);
      expect(smooth).toBeLessThan(linear);
    });
  });
});
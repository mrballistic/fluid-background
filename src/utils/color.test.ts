import { describe, it, expect } from 'vitest';
import { 
  hsvToRgb, 
  rgbToHsv, 
  generateRainbowColor, 
  generateRandomColor,
  blendColors,
  rgbToHex,
  hexToRgb,
  type RGB,
  type HSV
} from './color';

describe('Color utilities', () => {
  describe('hsvToRgb', () => {
    it('should convert pure red', () => {
      const result = hsvToRgb(0, 1, 1);
      expect(result.r).toBeCloseTo(1);
      expect(result.g).toBeCloseTo(0);
      expect(result.b).toBeCloseTo(0);
    });

    it('should convert pure green', () => {
      const result = hsvToRgb(120, 1, 1);
      expect(result.r).toBeCloseTo(0);
      expect(result.g).toBeCloseTo(1);
      expect(result.b).toBeCloseTo(0);
    });

    it('should convert pure blue', () => {
      const result = hsvToRgb(240, 1, 1);
      expect(result.r).toBeCloseTo(0);
      expect(result.g).toBeCloseTo(0);
      expect(result.b).toBeCloseTo(1);
    });

    it('should handle white (no saturation)', () => {
      const result = hsvToRgb(0, 0, 1);
      expect(result.r).toBeCloseTo(1);
      expect(result.g).toBeCloseTo(1);
      expect(result.b).toBeCloseTo(1);
    });

    it('should handle black (no value)', () => {
      const result = hsvToRgb(0, 1, 0);
      expect(result.r).toBeCloseTo(0);
      expect(result.g).toBeCloseTo(0);
      expect(result.b).toBeCloseTo(0);
    });
  });

  describe('rgbToHsv', () => {
    it('should convert red to HSV', () => {
      const result = rgbToHsv(1, 0, 0);
      expect(result.h).toBeCloseTo(0);
      expect(result.s).toBeCloseTo(1);
      expect(result.v).toBeCloseTo(1);
    });

    it('should convert white to HSV', () => {
      const result = rgbToHsv(1, 1, 1);
      expect(result.h).toBeCloseTo(0);
      expect(result.s).toBeCloseTo(0);
      expect(result.v).toBeCloseTo(1);
    });

    it('should convert black to HSV', () => {
      const result = rgbToHsv(0, 0, 0);
      expect(result.h).toBeCloseTo(0);
      expect(result.s).toBeCloseTo(0);
      expect(result.v).toBeCloseTo(0);
    });
  }); 
 describe('generateRainbowColor', () => {
    it('should generate different colors for different t values', () => {
      const color1 = generateRainbowColor(0);
      const color2 = generateRainbowColor(0.5);
      expect(color1).not.toEqual(color2);
    });

    it('should cycle through hues', () => {
      const color1 = generateRainbowColor(0);
      const color2 = generateRainbowColor(1);
      expect(color1.r).toBeCloseTo(color2.r, 1);
      expect(color1.g).toBeCloseTo(color2.g, 1);
      expect(color1.b).toBeCloseTo(color2.b, 1);
    });
  });

  describe('generateRandomColor', () => {
    it('should generate valid RGB values', () => {
      const color = generateRandomColor();
      expect(color.r).toBeGreaterThanOrEqual(0);
      expect(color.r).toBeLessThanOrEqual(1);
      expect(color.g).toBeGreaterThanOrEqual(0);
      expect(color.g).toBeLessThanOrEqual(1);
      expect(color.b).toBeGreaterThanOrEqual(0);
      expect(color.b).toBeLessThanOrEqual(1);
    });

    it('should use custom saturation and value', () => {
      const color = generateRandomColor(0.5, 0.7);
      const hsv = rgbToHsv(color.r, color.g, color.b);
      expect(hsv.s).toBeCloseTo(0.5);
      expect(hsv.v).toBeCloseTo(0.7);
    });
  });

  describe('blendColors', () => {
    it('should blend two colors', () => {
      const red: RGB = { r: 1, g: 0, b: 0 };
      const blue: RGB = { r: 0, g: 0, b: 1 };
      const blended = blendColors(red, blue, 0.5);
      
      expect(blended.r).toBeCloseTo(0.5);
      expect(blended.g).toBeCloseTo(0);
      expect(blended.b).toBeCloseTo(0.5);
    });

    it('should return first color when factor is 0', () => {
      const red: RGB = { r: 1, g: 0, b: 0 };
      const blue: RGB = { r: 0, g: 0, b: 1 };
      const result = blendColors(red, blue, 0);
      
      expect(result).toEqual(red);
    });

    it('should return second color when factor is 1', () => {
      const red: RGB = { r: 1, g: 0, b: 0 };
      const blue: RGB = { r: 0, g: 0, b: 1 };
      const result = blendColors(red, blue, 1);
      
      expect(result).toEqual(blue);
    });

    it('should clamp factor to 0-1 range', () => {
      const red: RGB = { r: 1, g: 0, b: 0 };
      const blue: RGB = { r: 0, g: 0, b: 1 };
      
      const result1 = blendColors(red, blue, -0.5);
      expect(result1).toEqual(red);
      
      const result2 = blendColors(red, blue, 1.5);
      expect(result2).toEqual(blue);
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(1, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 1, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 1)).toBe('#0000ff');
      expect(rgbToHex(1, 1, 1)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('should handle fractional values', () => {
      expect(rgbToHex(0.5, 0.5, 0.5)).toBe('#808080');
    });
  });

  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 1, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 1, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 1 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 1, g: 1, b: 1 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle hex without #', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 1, g: 0, b: 0 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#gg0000')).toBeNull();
    });
  });
});
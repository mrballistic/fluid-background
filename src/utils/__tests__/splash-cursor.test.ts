/**
 * Tests for splash cursor utility functions
 */

import {
  createVector2,
  addVectors,
  subtractVectors,
  multiplyVector,
  divideVector,
  vectorLength,
  normalizeVector,
  distanceBetween,
  lerpVector,
  createHSLColor,
  hslToRgb,
  hslToString,
  blendHSLColors,
  generateRainbowHSL,
  generateVelocityBasedColor,
  randomBetween,
  randomVector2,
  randomUnitVector,
  getHighResolutionTime,
  calculateDeltaTime
} from '../splash-cursor';

describe('Vector2 utilities', () => {
  test('createVector2 should create vector with default values', () => {
    const v = createVector2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  test('createVector2 should create vector with specified values', () => {
    const v = createVector2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  test('addVectors should add two vectors correctly', () => {
    const v1 = createVector2(1, 2);
    const v2 = createVector2(3, 4);
    const result = addVectors(v1, v2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  test('subtractVectors should subtract vectors correctly', () => {
    const v1 = createVector2(5, 7);
    const v2 = createVector2(2, 3);
    const result = subtractVectors(v1, v2);
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  test('multiplyVector should scale vector correctly', () => {
    const v = createVector2(2, 3);
    const result = multiplyVector(v, 2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  test('divideVector should scale vector correctly', () => {
    const v = createVector2(6, 8);
    const result = divideVector(v, 2);
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  test('vectorLength should calculate length correctly', () => {
    const v = createVector2(3, 4);
    const length = vectorLength(v);
    expect(length).toBe(5);
  });

  test('normalizeVector should create unit vector', () => {
    const v = createVector2(3, 4);
    const normalized = normalizeVector(v);
    expect(normalized.x).toBeCloseTo(0.6);
    expect(normalized.y).toBeCloseTo(0.8);
    expect(vectorLength(normalized)).toBeCloseTo(1);
  });

  test('normalizeVector should handle zero vector', () => {
    const v = createVector2(0, 0);
    const normalized = normalizeVector(v);
    expect(normalized.x).toBe(0);
    expect(normalized.y).toBe(0);
  });

  test('distanceBetween should calculate distance correctly', () => {
    const v1 = createVector2(0, 0);
    const v2 = createVector2(3, 4);
    const distance = distanceBetween(v1, v2);
    expect(distance).toBe(5);
  });

  test('lerpVector should interpolate between vectors', () => {
    const v1 = createVector2(0, 0);
    const v2 = createVector2(10, 20);
    const result = lerpVector(v1, v2, 0.5);
    expect(result.x).toBe(5);
    expect(result.y).toBe(10);
  });
});

describe('HSL Color utilities', () => {
  test('createHSLColor should create color with default values', () => {
    const color = createHSLColor();
    expect(color.h).toBe(0);
    expect(color.s).toBe(100);
    expect(color.l).toBe(50);
    expect(color.a).toBe(1);
  });

  test('createHSLColor should clamp values to valid ranges', () => {
    const color = createHSLColor(400, 150, -10, 2);
    expect(color.h).toBe(40); // 400 % 360
    expect(color.s).toBe(100); // clamped to max
    expect(color.l).toBe(0); // clamped to min
    expect(color.a).toBe(1); // clamped to max
  });

  test('hslToRgb should convert HSL to RGB correctly', () => {
    const hsl = createHSLColor(0, 100, 50); // Pure red
    const rgb = hslToRgb(hsl);
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
    expect(rgb.a).toBe(1);
  });

  test('hslToString should format HSL color correctly', () => {
    const hsl = createHSLColor(120, 80, 60, 0.8);
    const str = hslToString(hsl);
    expect(str).toBe('hsla(120, 80%, 60%, 0.8)');
  });

  test('blendHSLColors should blend colors correctly', () => {
    const color1 = createHSLColor(0, 100, 50); // Red
    const color2 = createHSLColor(120, 100, 50); // Green
    const blended = blendHSLColors(color1, color2, 0.5);
    expect(blended.h).toBe(60); // Halfway between red and green
    expect(blended.s).toBe(100);
    expect(blended.l).toBe(50);
  });

  test('generateRainbowHSL should generate rainbow colors', () => {
    const color1 = generateRainbowHSL(0);
    const color2 = generateRainbowHSL(0.5);
    
    expect(color1.h).toBe(0);
    expect(color2.h).toBe(180);
    expect(color1.s).toBe(80);
    expect(color1.l).toBe(60);
  });

  test('generateVelocityBasedColor should generate colors based on velocity', () => {
    const velocity = createVector2(5, 0);
    const color = generateVelocityBasedColor(velocity);
    
    expect(color.h).toBeGreaterThanOrEqual(0);
    expect(color.h).toBeLessThan(360);
    expect(color.s).toBeGreaterThan(70);
    expect(color.l).toBeGreaterThan(50);
  });
});

describe('Random utilities', () => {
  test('randomBetween should generate values in range', () => {
    for (let i = 0; i < 100; i++) {
      const value = randomBetween(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  test('randomVector2 should generate vectors in range', () => {
    for (let i = 0; i < 100; i++) {
      const v = randomVector2(0, 10, 0, 20);
      expect(v.x).toBeGreaterThanOrEqual(0);
      expect(v.x).toBeLessThanOrEqual(10);
      expect(v.y).toBeGreaterThanOrEqual(0);
      expect(v.y).toBeLessThanOrEqual(20);
    }
  });

  test('randomUnitVector should generate unit vectors', () => {
    for (let i = 0; i < 100; i++) {
      const v = randomUnitVector();
      const length = vectorLength(v);
      expect(length).toBeCloseTo(1, 5);
    }
  });
});

describe('Time utilities', () => {
  test('getHighResolutionTime should return a number', () => {
    const time = getHighResolutionTime();
    expect(typeof time).toBe('number');
    expect(time).toBeGreaterThan(0);
  });

  test('calculateDeltaTime should calculate delta correctly', () => {
    const delta = calculateDeltaTime(1000, 1016.67);
    expect(delta).toBeCloseTo(0.01667, 4);
  });

  test('calculateDeltaTime should cap delta time', () => {
    const delta = calculateDeltaTime(1000, 2000); // 1 second gap
    expect(delta).toBe(1/30); // Capped at 30 FPS minimum
  });
});
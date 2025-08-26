/**
 * Utility functions for splash cursor system
 */

import { Vector2, HSLColor } from '../types/splash-cursor';

// Vector2 utility functions
export const createVector2 = (x: number = 0, y: number = 0): Vector2 => ({ x, y });

export const addVectors = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y
});

export const subtractVectors = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x - b.x,
  y: a.y - b.y
});

export const multiplyVector = (v: Vector2, scalar: number): Vector2 => ({
  x: v.x * scalar,
  y: v.y * scalar
});

export const divideVector = (v: Vector2, scalar: number): Vector2 => ({
  x: v.x / scalar,
  y: v.y / scalar
});

export const dotProduct = (a: Vector2, b: Vector2): number => {
  return a.x * b.x + a.y * b.y;
};

export const vectorLength = (v: Vector2): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};

export const vectorLengthSquared = (v: Vector2): number => {
  return v.x * v.x + v.y * v.y;
};

export const normalizeVector = (v: Vector2): Vector2 => {
  const length = vectorLength(v);
  if (length === 0) return { x: 0, y: 0 };
  return divideVector(v, length);
};

export const distanceBetween = (a: Vector2, b: Vector2): number => {
  return vectorLength(subtractVectors(a, b));
};

export const distanceSquaredBetween = (a: Vector2, b: Vector2): number => {
  return vectorLengthSquared(subtractVectors(a, b));
};

export const lerpVector = (a: Vector2, b: Vector2, t: number): Vector2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t
});

export const clampVector = (v: Vector2, min: Vector2, max: Vector2): Vector2 => ({
  x: Math.max(min.x, Math.min(max.x, v.x)),
  y: Math.max(min.y, Math.min(max.y, v.y))
});

// Color utility functions for splash cursor
export const createHSLColor = (h: number = 0, s: number = 100, l: number = 50, a: number = 1): HSLColor => ({
  h: h % 360,
  s: Math.max(0, Math.min(100, s)),
  l: Math.max(0, Math.min(100, l)),
  a: Math.max(0, Math.min(1, a))
});

export const hslToRgb = (hsl: HSLColor): { r: number; g: number; b: number; a: number } => {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsl.a
  };
};

export const hslToString = (hsl: HSLColor): string => {
  return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`;
};

export const blendHSLColors = (color1: HSLColor, color2: HSLColor, factor: number): HSLColor => {
  const clampedFactor = Math.max(0, Math.min(1, factor));
  
  // Handle hue blending (circular interpolation)
  let h1 = color1.h;
  let h2 = color2.h;
  let hDiff = h2 - h1;
  
  if (hDiff > 180) {
    h1 += 360;
  } else if (hDiff < -180) {
    h2 += 360;
  }
  
  const blendedH = (h1 + (h2 - h1) * clampedFactor) % 360;
  
  return {
    h: blendedH < 0 ? blendedH + 360 : blendedH,
    s: color1.s + (color2.s - color1.s) * clampedFactor,
    l: color1.l + (color2.l - color1.l) * clampedFactor,
    a: color1.a + (color2.a - color1.a) * clampedFactor
  };
};

export const generateRainbowHSL = (t: number, saturation: number = 80, lightness: number = 60): HSLColor => {
  return createHSLColor((t * 360) % 360, saturation, lightness, 1);
};

export const generateVelocityBasedColor = (velocity: Vector2, baseHue: number = 200): HSLColor => {
  const speed = vectorLength(velocity);
  const normalizedSpeed = Math.min(speed / 10, 1); // Normalize to 0-1 range
  
  // Shift hue based on velocity direction
  const angle = Math.atan2(velocity.y, velocity.x);
  const hueShift = (angle / Math.PI) * 30; // ±30 degree shift
  
  return createHSLColor(
    baseHue + hueShift,
    70 + normalizedSpeed * 30, // More saturated with higher velocity
    50 + normalizedSpeed * 20,  // Brighter with higher velocity
    0.8 + normalizedSpeed * 0.2
  );
};

// Import utility functions from existing math utilities
import { clamp, lerp, smoothstep } from './math';

export const easeOutQuad = (t: number): number => {
  return 1 - (1 - t) * (1 - t);
};

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

// Random utility functions
export const randomBetween = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

export const randomVector2 = (minX: number, maxX: number, minY: number, maxY: number): Vector2 => ({
  x: randomBetween(minX, maxX),
  y: randomBetween(minY, maxY)
});

export const randomUnitVector = (): Vector2 => {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.cos(angle),
    y: Math.sin(angle)
  };
};

// Time utilities
export const getHighResolutionTime = (): number => {
  return performance.now();
};

export const calculateDeltaTime = (lastTime: number, currentTime: number): number => {
  return Math.min((currentTime - lastTime) / 1000, 1/30); // Cap at 30 FPS minimum
};
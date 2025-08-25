/**
 * Math utility functions for fluid simulation
 */

/**
 * Clamps a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Normalizes a value from one range to another
 */
export const normalize = (value: number, min: number, max: number): number => {
  return (value - min) / (max - min);
};

/**
 * Maps a value from one range to another
 */
export const map = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return outMin + (outMax - outMin) * normalize(value, inMin, inMax);
};

/**
 * Linear interpolation between two values
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

/**
 * Smoothstep function for smooth interpolation
 */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
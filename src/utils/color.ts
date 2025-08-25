/**
 * Color utility functions for fluid simulation
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

/**
 * Converts HSV color to RGB
 * @param h Hue (0-360)
 * @param s Saturation (0-1)
 * @param v Value/Brightness (0-1)
 * @returns RGB color object with values 0-1
 */
export const hsvToRgb = (h: number, s: number, v: number): RGB => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: r + m,
    g: g + m,
    b: b + m
  };
};

/**
 * Converts RGB color to HSV
 */
export const rgbToHsv = (r: number, g: number, b: number): HSV => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, v };
};/**
 
* Generates a rainbow color based on time or position
 */
export const generateRainbowColor = (t: number): RGB => {
  const hue = (t * 360) % 360;
  return hsvToRgb(hue, 0.8, 0.9);
};

/**
 * Generates random color with specified saturation and value
 */
export const generateRandomColor = (saturation = 0.8, value = 0.9): RGB => {
  const hue = Math.random() * 360;
  return hsvToRgb(hue, saturation, value);
};

/**
 * Blends two RGB colors
 */
export const blendColors = (color1: RGB, color2: RGB, factor: number): RGB => {
  const clampedFactor = Math.max(0, Math.min(1, factor));
  return {
    r: color1.r + (color2.r - color1.r) * clampedFactor,
    g: color1.g + (color2.g - color1.g) * clampedFactor,
    b: color1.b + (color2.b - color1.b) * clampedFactor
  };
};

/**
 * Converts RGB values (0-1) to hex string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Converts hex string to RGB values (0-1)
 */
export const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
};
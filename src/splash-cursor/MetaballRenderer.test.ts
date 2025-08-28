/**
 * Unit tests for MetaballRenderer class
 * Tests metaball field calculations, color blending, and performance optimizations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetaballRenderer, MetaballRendererConfig } from './MetaballRenderer';
import { Particle, Vector2, HSLColor } from '../types/splash-cursor';

// Mock canvas and context
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  imageSmoothingEnabled: boolean = true;
  imageSmoothingQuality: ImageSmoothingQuality = 'high';
  filter: string = 'none';
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  globalAlpha: number = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  save(): void {
    // Mock implementation
  }

  restore(): void {
    // Mock implementation
  }

  createImageData(width: number, height: number): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    return { data, width, height, colorSpace: 'srgb' } as ImageData;
  }

  putImageData(imageData: ImageData, dx: number, dy: number): void {
    // Mock implementation
  }

  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    const data = new Uint8ClampedArray(sw * sh * 4);
    return { data, width: sw, height: sh, colorSpace: 'srgb' } as ImageData;
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    // Mock implementation
  }

  drawImage(image: CanvasImageSource, dx: number, dy: number): void;
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
  drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
  drawImage(...args: any[]): void {
    // Mock implementation
  }
}

class MockHTMLCanvasElement {
  width: number = 800;
  height: number = 600;
  private context: MockCanvasRenderingContext2D;

  constructor() {
    this.context = new MockCanvasRenderingContext2D(this as any);
  }

  getContext(contextId: '2d'): MockCanvasRenderingContext2D | null {
    if (contextId === '2d') {
      return this.context;
    }
    return null;
  }
}

describe('MetaballRenderer', () => {
  let canvas: MockHTMLCanvasElement;
  let renderer: MetaballRenderer;
  let defaultConfig: MetaballRendererConfig;

  beforeEach(() => {
    canvas = new MockHTMLCanvasElement();
    defaultConfig = {
      threshold: 0.5,
      blurAmount: 2,
      qualityLevel: 'high',
      maxInfluenceDistance: 100,
      skipPixels: 1
    };
    renderer = new MetaballRenderer(canvas as any, defaultConfig);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with correct configuration', () => {
      const config = renderer.getConfig();
      expect(config.threshold).toBe(0.5);
      expect(config.blurAmount).toBe(2);
      expect(config.maxInfluenceDistance).toBe(100);
      expect(config.skipPixels).toBe(1);
    });

    it('should throw error if canvas context is not available', () => {
      const badCanvas = {
        getContext: () => null,
        width: 800,
        height: 600
      };
      
      expect(() => {
        new MetaballRenderer(badCanvas as any, defaultConfig);
      }).toThrow('Failed to get 2D rendering context from canvas');
    });

    it('should initialize buffers on construction', () => {
      const stats = renderer.getStats();
      expect(stats.fieldBufferLength).toBeGreaterThan(0);
      expect(stats.colorBufferLength).toBeGreaterThan(0);
      expect(stats.bufferSize).toBe(800 * 600); // Full resolution with skipPixels = 1
    });
  });

  describe('Resize Functionality', () => {
    it('should update canvas dimensions and reinitialize buffers', () => {
      renderer.resize(400, 300);
      
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(300);
      
      const stats = renderer.getStats();
      expect(stats.bufferSize).toBe(400 * 300);
    });

    it('should handle skip pixels correctly when resizing', () => {
      renderer.setSkipPixels(2);
      renderer.resize(400, 300);
      
      const stats = renderer.getStats();
      const expectedBufferSize = Math.ceil(400 / 2) * Math.ceil(300 / 2);
      expect(stats.bufferSize).toBe(expectedBufferSize);
    });
  });

  describe('Metaball Field Calculation', () => {
    let testParticles: Particle[];

    beforeEach(() => {
      testParticles = [
        {
          position: { x: 100, y: 100 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 20,
          color: { h: 180, s: 80, l: 50, a: 1.0 },
          createdAt: 0
        },
        {
          position: { x: 200, y: 150 },
          velocity: { x: 0, y: 0 },
          life: 0.3,
          maxLife: 1.0,
          size: 15,
          color: { h: 240, s: 90, l: 60, a: 0.8 },
          createdAt: 0
        }
      ];
    });

    it('should calculate particle influence correctly', () => {
      // Use reflection to access private method for testing
      const calculateInfluence = (renderer as any).calculateParticleInfluence.bind(renderer);
      
      const particle = testParticles[0];
      
      // Test influence at particle center (should be maximum)
      const centerInfluence = calculateInfluence(100, 100, particle);
      expect(centerInfluence).toBeGreaterThan(0);
      
      // Test influence at distance (should be less) - within influence radius
      const distantInfluence = calculateInfluence(130, 130, particle); // Distance ~42.4, within radius of 60
      expect(distantInfluence).toBeLessThan(centerInfluence);
      expect(distantInfluence).toBeGreaterThan(0);
      
      // Test influence beyond max distance (should be 0)
      const farInfluence = calculateInfluence(500, 500, particle);
      expect(farInfluence).toBe(0);
    });

    it('should apply distance-based culling', () => {
      const calculateInfluence = (renderer as any).calculateParticleInfluence.bind(renderer);
      
      const particle = testParticles[0]; // size = 20, so max distance = 60
      
      // Within influence range
      const nearInfluence = calculateInfluence(130, 130, particle);
      expect(nearInfluence).toBeGreaterThan(0);
      
      // Beyond influence range
      const farInfluence = calculateInfluence(200, 200, particle);
      expect(farInfluence).toBe(0);
    });

    it('should consider particle alpha in influence calculation', () => {
      const calculateInfluence = (renderer as any).calculateParticleInfluence.bind(renderer);
      
      const fullAlphaParticle = { ...testParticles[0], color: { ...testParticles[0].color, a: 1.0 } };
      const halfAlphaParticle = { ...testParticles[0], color: { ...testParticles[0].color, a: 0.5 } };
      
      const fullInfluence = calculateInfluence(100, 100, fullAlphaParticle);
      const halfInfluence = calculateInfluence(100, 100, halfAlphaParticle);
      
      expect(halfInfluence).toBe(fullInfluence * 0.5);
    });

    it('should render particles without errors', () => {
      expect(() => {
        renderer.render(testParticles);
      }).not.toThrow();
    });
  });

  describe('Color Blending', () => {
    it('should convert HSL to RGB correctly', () => {
      const hslToRgb = (renderer as any).hslToRgb.bind(renderer);
      
      // Test pure red
      const red = hslToRgb({ h: 0, s: 100, l: 50, a: 1 });
      expect(red.r).toBe(255);
      expect(red.g).toBe(0);
      expect(red.b).toBe(0);
      
      // Test pure green
      const green = hslToRgb({ h: 120, s: 100, l: 50, a: 1 });
      expect(green.r).toBe(0);
      expect(green.g).toBe(255);
      expect(green.b).toBe(0);
      
      // Test pure blue
      const blue = hslToRgb({ h: 240, s: 100, l: 50, a: 1 });
      expect(blue.r).toBe(0);
      expect(blue.g).toBe(0);
      expect(blue.b).toBe(255);
      
      // Test grayscale (no saturation)
      const gray = hslToRgb({ h: 0, s: 0, l: 50, a: 1 });
      expect(gray.r).toBe(128);
      expect(gray.g).toBe(128);
      expect(gray.b).toBe(128);
    });

    it('should convert RGB to HSL correctly', () => {
      const rgbToHsl = (renderer as any).rgbToHsl.bind(renderer);
      
      // Test pure red
      const red = rgbToHsl(255, 0, 0);
      expect(red.h).toBe(0);
      expect(red.s).toBe(100);
      expect(red.l).toBe(50);
      
      // Test pure green
      const green = rgbToHsl(0, 255, 0);
      expect(green.h).toBe(120);
      expect(green.s).toBe(100);
      expect(green.l).toBe(50);
      
      // Test grayscale
      const gray = rgbToHsl(128, 128, 128);
      expect(gray.h).toBe(0);
      expect(gray.s).toBe(0);
      expect(Math.round(gray.l)).toBe(50);
    });

    it('should blend particle colors based on influence', () => {
      const blendColors = (renderer as any).blendParticleColors.bind(renderer);
      
      const particles: Particle[] = [
        {
          position: { x: 100, y: 100 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 20,
          color: { h: 0, s: 100, l: 50, a: 1.0 }, // Red
          createdAt: 0
        },
        {
          position: { x: 120, y: 100 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 20,
          color: { h: 240, s: 100, l: 50, a: 1.0 }, // Blue
          createdAt: 0
        }
      ];
      
      // Test blending at midpoint between red and blue particles
      const blendedColor = blendColors(110, 100, particles);
      
      // Should have some red and blue components
      expect(blendedColor.r).toBeGreaterThan(0);
      expect(blendedColor.b).toBeGreaterThan(0);
      expect(blendedColor.a).toBeGreaterThan(0);
    });

    it('should handle single particle color blending', () => {
      const blendColors = (renderer as any).blendParticleColors.bind(renderer);
      
      const particles: Particle[] = [
        {
          position: { x: 100, y: 100 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 20,
          color: { h: 180, s: 80, l: 60, a: 0.8 },
          createdAt: 0
        }
      ];
      
      // Test color at particle center
      const blendedColor = blendColors(100, 100, particles);
      
      // Should have color components based on the particle
      expect(blendedColor.r).toBeGreaterThan(0);
      expect(blendedColor.g).toBeGreaterThan(0);
      expect(blendedColor.b).toBeGreaterThan(0);
      expect(blendedColor.a).toBeGreaterThan(0);
    });

    it('should apply smooth alpha falloff', () => {
      const calculateSmoothAlpha = (renderer as any).calculateSmoothAlpha.bind(renderer);
      
      // Test smooth alpha calculation
      const alpha1 = calculateSmoothAlpha(1.0, 1.0, 1.0); // Maximum influence
      const alpha2 = calculateSmoothAlpha(0.5, 1.0, 1.0); // Half influence
      const alpha3 = calculateSmoothAlpha(0.0, 1.0, 1.0); // No influence
      
      expect(alpha1).toBe(1.0);
      expect(alpha2).toBeLessThan(alpha1);
      expect(alpha2).toBeGreaterThan(alpha3);
      expect(alpha3).toBe(0);
    });

    it('should enhance colors for better vibrancy', () => {
      const enhanceColor = (renderer as any).enhanceColor.bind(renderer);
      
      // Test color enhancement
      const enhanced = enhanceColor(100, 150, 200);
      
      expect(typeof enhanced.r).toBe('number');
      expect(typeof enhanced.g).toBe('number');
      expect(typeof enhanced.b).toBe('number');
      expect(enhanced.r).toBeGreaterThanOrEqual(0);
      expect(enhanced.r).toBeLessThanOrEqual(255);
      expect(enhanced.g).toBeGreaterThanOrEqual(0);
      expect(enhanced.g).toBeLessThanOrEqual(255);
      expect(enhanced.b).toBeGreaterThanOrEqual(0);
      expect(enhanced.b).toBeLessThanOrEqual(255);
    });

    it('should return transparent color when no particles have influence', () => {
      const blendColors = (renderer as any).blendParticleColors.bind(renderer);
      
      const particles: Particle[] = [
        {
          position: { x: 100, y: 100 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 5, // Small size for limited influence
          color: { h: 0, s: 100, l: 50, a: 1.0 },
          createdAt: 0
        }
      ];
      
      // Test far from particle
      const blendedColor = blendColors(500, 500, particles);
      
      expect(blendedColor.r).toBe(0);
      expect(blendedColor.g).toBe(0);
      expect(blendedColor.b).toBe(0);
      expect(blendedColor.a).toBe(0);
    });

    it('should blend multiple particles with additive mixing', () => {
      const blendMultipleColors = (renderer as any).blendMultipleParticleColors.bind(renderer);
      
      const particleInfluences = [
        {
          particle: {
            position: { x: 100, y: 100 },
            velocity: { x: 0, y: 0 },
            life: 0.5,
            maxLife: 1.0,
            size: 20,
            color: { h: 0, s: 100, l: 50, a: 1.0 }, // Red
            createdAt: 0
          },
          influence: 0.8,
          rgb: { r: 255, g: 0, b: 0 }
        },
        {
          particle: {
            position: { x: 110, y: 100 },
            velocity: { x: 0, y: 0 },
            life: 0.5,
            maxLife: 1.0,
            size: 20,
            color: { h: 120, s: 100, l: 50, a: 1.0 }, // Green
            createdAt: 0
          },
          influence: 0.6,
          rgb: { r: 0, g: 255, b: 0 }
        }
      ];
      
      const blended = blendMultipleColors(particleInfluences, 0.8);
      
      // Should have both red and green components
      expect(blended.r).toBeGreaterThan(0);
      expect(blended.g).toBeGreaterThan(0);
      expect(blended.a).toBeGreaterThan(0);
    });
  });

  describe('Threshold Application', () => {
    it('should apply threshold correctly', () => {
      renderer.setThreshold(0.3);
      expect(renderer.getConfig().threshold).toBe(0.3);
      
      renderer.setThreshold(-0.1); // Should clamp to 0
      expect(renderer.getConfig().threshold).toBe(0);
      
      renderer.setThreshold(1.5); // Should clamp to 1
      expect(renderer.getConfig().threshold).toBe(1);
    });

    it('should create connected appearance above threshold', () => {
      const particles: Particle[] = [
        {
          position: { x: 100, y: 100 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 30, // Large size for strong influence
          color: { h: 180, s: 80, l: 50, a: 1.0 },
          createdAt: 0
        }
      ];
      
      renderer.setThreshold(0.1); // Low threshold
      
      expect(() => {
        renderer.render(particles);
      }).not.toThrow();
    });
  });

  describe('Performance Optimizations', () => {
    it('should handle skip pixels for performance', () => {
      renderer.setSkipPixels(4);
      
      const stats = renderer.getStats();
      expect(stats.skipPixels).toBe(4);
      
      // Buffer should be smaller with skip pixels
      const expectedBufferSize = Math.ceil(canvas.width / 4) * Math.ceil(canvas.height / 4);
      expect(stats.bufferSize).toBe(expectedBufferSize);
    });

    it('should update quality level and adjust settings', () => {
      renderer.setQualityLevel('low');
      
      const config = renderer.getConfig();
      expect(config.threshold).toBe(0.7); // Low quality threshold
      expect(config.blurAmount).toBe(0);   // No blur for low quality
      expect(config.skipPixels).toBe(3);   // Skip more pixels
    });

    it('should handle large particle counts efficiently', () => {
      // Create many particles
      const manyParticles: Particle[] = [];
      for (let i = 0; i < 100; i++) {
        manyParticles.push({
          position: { x: Math.random() * 800, y: Math.random() * 600 },
          velocity: { x: 0, y: 0 },
          life: Math.random(),
          maxLife: 1.0,
          size: 10 + Math.random() * 20,
          color: { h: Math.random() * 360, s: 80, l: 50, a: Math.random() },
          createdAt: 0
        });
      }
      
      // Should handle many particles without throwing
      expect(() => {
        renderer.render(manyParticles);
      }).not.toThrow();
    });
  });

  describe('Configuration Updates', () => {
    it('should update blur amount', () => {
      renderer.setBlurAmount(5);
      expect(renderer.getConfig().blurAmount).toBe(5);
      
      renderer.setBlurAmount(-1); // Should clamp to 0
      expect(renderer.getConfig().blurAmount).toBe(0);
    });

    it('should update max influence distance', () => {
      renderer.setMaxInfluenceDistance(200);
      expect(renderer.getConfig().maxInfluenceDistance).toBe(200);
      
      renderer.setMaxInfluenceDistance(0); // Should clamp to 1
      expect(renderer.getConfig().maxInfluenceDistance).toBe(1);
    });

    it('should provide accurate statistics', () => {
      const stats = renderer.getStats();
      
      expect(typeof stats.bufferSize).toBe('number');
      expect(typeof stats.fieldBufferLength).toBe('number');
      expect(typeof stats.colorBufferLength).toBe('number');
      expect(typeof stats.skipPixels).toBe('number');
      
      expect(stats.bufferSize).toBeGreaterThan(0);
      expect(stats.fieldBufferLength).toBeGreaterThan(0);
      expect(stats.colorBufferLength).toBeGreaterThan(0);
      expect(stats.skipPixels).toBeGreaterThan(0);
    });
  });

  describe('Clear and Reset', () => {
    it('should clear canvas without errors', () => {
      expect(() => {
        renderer.clear();
      }).not.toThrow();
    });

    it('should handle empty particle array', () => {
      expect(() => {
        renderer.render([]);
      }).not.toThrow();
    });

    it('should handle particles with zero size', () => {
      const zeroSizeParticles: Particle[] = [
        {
          position: { x: 100, y: 100 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 0,
          color: { h: 180, s: 80, l: 50, a: 1.0 },
          createdAt: 0
        }
      ];
      
      expect(() => {
        renderer.render(zeroSizeParticles);
      }).not.toThrow();
    });
  });

  describe('Visual Effects', () => {
    it('should apply gradient smoothing without errors', () => {
      const applyGradientSmoothing = (renderer as any).applyGradientSmoothing.bind(renderer);
      
      // Create test image data
      const testImageData = renderer.ctx.createImageData(10, 10);
      (renderer as any).imageData = testImageData;
      
      expect(() => {
        applyGradientSmoothing();
      }).not.toThrow();
    });

    it('should calculate gradient magnitude correctly', () => {
      const calculateGradientMagnitude = (renderer as any).calculateGradientMagnitude.bind(renderer);
      
      // Create test data with a clear edge
      const data = new Uint8ClampedArray(9 * 4); // 3x3 pixels
      
      // Create horizontal edge (top row white, bottom row black)
      for (let i = 0; i < 3; i++) {
        const topIdx = i * 4;
        const bottomIdx = (i + 6) * 4;
        
        // Top row - white
        data[topIdx] = 255;
        data[topIdx + 1] = 255;
        data[topIdx + 2] = 255;
        data[topIdx + 3] = 255;
        
        // Bottom row - black
        data[bottomIdx] = 0;
        data[bottomIdx + 1] = 0;
        data[bottomIdx + 2] = 0;
        data[bottomIdx + 3] = 255;
      }
      
      const gradient = calculateGradientMagnitude(data, 1, 1, 3);
      expect(gradient).toBeGreaterThan(0);
    });

    it('should calculate smoothed pixel values', () => {
      const calculateSmoothedPixel = (renderer as any).calculateSmoothedPixel.bind(renderer);
      
      // Create test data
      const data = new Uint8ClampedArray(9 * 4); // 3x3 pixels
      
      // Fill with test pattern
      for (let i = 0; i < 9; i++) {
        const idx = i * 4;
        data[idx] = 100 + i * 10;     // Red gradient
        data[idx + 1] = 150;          // Constant green
        data[idx + 2] = 200 - i * 5;  // Blue gradient
        data[idx + 3] = 255;          // Full alpha
      }
      
      const smoothed = calculateSmoothedPixel(data, 1, 1, 3);
      
      expect(smoothed.r).toBeGreaterThan(0);
      expect(smoothed.g).toBeGreaterThan(0);
      expect(smoothed.b).toBeGreaterThan(0);
      expect(smoothed.a).toBeGreaterThan(0);
    });

    it('should enhance pixels for better contrast', () => {
      const enhancePixel = (renderer as any).enhancePixel.bind(renderer);
      
      const enhanced = enhancePixel(128, 128, 128);
      
      expect(typeof enhanced.r).toBe('number');
      expect(typeof enhanced.g).toBe('number');
      expect(typeof enhanced.b).toBe('number');
      expect(enhanced.r).toBeGreaterThanOrEqual(0);
      expect(enhanced.r).toBeLessThanOrEqual(255);
    });

    it('should apply contrast curve correctly', () => {
      const applyContrastCurve = (renderer as any).applyContrastCurve.bind(renderer);
      
      // Test S-curve behavior
      const dark = applyContrastCurve(25);   // Dark input
      const mid = applyContrastCurve(50);    // Mid input
      const bright = applyContrastCurve(75); // Bright input
      
      expect(dark).toBeLessThan(25);    // Should be darker
      expect(mid).toBe(50);             // Should remain the same
      expect(bright).toBeGreaterThan(75); // Should be brighter
    });

    it('should apply smooth step function correctly', () => {
      const smoothStep = (renderer as any).smoothStep.bind(renderer);
      
      const step0 = smoothStep(0, 1, 0);
      const step1 = smoothStep(0, 1, 1);
      const stepMid = smoothStep(0, 1, 0.5);
      
      expect(step0).toBe(0);
      expect(step1).toBe(1);
      expect(stepMid).toBe(0.5);
      
      // Test smooth interpolation
      const step25 = smoothStep(0, 1, 0.25);
      const step75 = smoothStep(0, 1, 0.75);
      
      expect(step25).toBeLessThan(0.25); // Should be smoother than linear
      expect(step75).toBeGreaterThan(0.75);
    });

    it('should handle post-processing effects without errors', () => {
      const applyPostProcessingEffects = (renderer as any).applyPostProcessingEffects.bind(renderer);
      
      expect(() => {
        applyPostProcessingEffects();
      }).not.toThrow();
    });

    it('should handle glow effect application', () => {
      const applyGlowEffect = (renderer as any).applyGlowEffect.bind(renderer);
      
      expect(() => {
        applyGlowEffect();
      }).not.toThrow();
    });

    it('should handle color enhancement on image data', () => {
      const applyColorEnhancement = (renderer as any).applyColorEnhancement.bind(renderer);
      
      expect(() => {
        applyColorEnhancement();
      }).not.toThrow();
    });
  });

  describe('Optimization Controls', () => {
    it('should enable and disable optimizations', () => {
      renderer.setOptimizationsEnabled(false);
      expect(() => {
        renderer.render([]);
      }).not.toThrow();

      renderer.setOptimizationsEnabled(true);
      expect(() => {
        renderer.render([]);
      }).not.toThrow();
    });

    it('should enable and disable spatial partitioning', () => {
      renderer.setSpatialPartitioningEnabled(true);
      expect(() => {
        renderer.render([]);
      }).not.toThrow();

      renderer.setSpatialPartitioningEnabled(false);
      expect(() => {
        renderer.render([]);
      }).not.toThrow();

      // Re-enable to test grid creation
      renderer.setSpatialPartitioningEnabled(true);
      expect(() => {
        renderer.render([]);
      }).not.toThrow();
    });

    it('should enable and disable dirty rectangle tracking', () => {
      renderer.setDirtyRectanglesEnabled(true);
      expect(() => {
        renderer.render([]);
      }).not.toThrow();

      renderer.setDirtyRectanglesEnabled(false);
      expect(() => {
        renderer.render([]);
      }).not.toThrow();

      // Re-enable to test tracker creation
      renderer.setDirtyRectanglesEnabled(true);
      expect(() => {
        renderer.render([]);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle particles at canvas boundaries', () => {
      const boundaryParticles: Particle[] = [
        {
          position: { x: 0, y: 0 }, // Top-left corner
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 20,
          color: { h: 0, s: 100, l: 50, a: 1.0 },
          createdAt: 0
        },
        {
          position: { x: canvas.width, y: canvas.height }, // Bottom-right corner
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 20,
          color: { h: 120, s: 100, l: 50, a: 1.0 },
          createdAt: 0
        }
      ];
      
      expect(() => {
        renderer.render(boundaryParticles);
      }).not.toThrow();
    });

    it('should handle particles outside canvas bounds', () => {
      const outsideParticles: Particle[] = [
        {
          position: { x: -100, y: -100 }, // Outside canvas
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 20,
          color: { h: 0, s: 100, l: 50, a: 1.0 },
          createdAt: 0
        },
        {
          position: { x: canvas.width + 100, y: canvas.height + 100 }, // Outside canvas
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 20,
          color: { h: 240, s: 100, l: 50, a: 1.0 },
          createdAt: 0
        }
      ];
      
      expect(() => {
        renderer.render(outsideParticles);
      }).not.toThrow();
    });

    it('should handle very small canvas sizes', () => {
      renderer.resize(1, 1);
      
      const particle: Particle[] = [
        {
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 10,
          color: { h: 180, s: 80, l: 50, a: 1.0 },
          createdAt: 0
        }
      ];
      
      expect(() => {
        renderer.render(particle);
      }).not.toThrow();
    });
  });
});
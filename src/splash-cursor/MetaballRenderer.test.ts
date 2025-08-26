/**
 * Unit tests for MetaballRenderer class
 * Tests metaball field calculations, color blending, and performance optimizations
 */

import { MetaballRenderer, MetaballRendererConfig } from './MetaballRenderer';
import { Particle, Vector2, HSLColor } from '../types/splash-cursor';

// Mock canvas and context
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  imageSmoothingEnabled: boolean = true;
  filter: string = 'none';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
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
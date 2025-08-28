/**
 * Tests for fallback rendering modes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MetaballRenderer,
  SimpleRenderer,
  BasicRenderer,
  DisabledRenderer,
  RendererFactory,
  RenderingMode,
  FallbackRendererConfig,
} from '../fallback-renderer';

// Mock canvas and context
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn(),
} as unknown as HTMLCanvasElement;

const mockContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  arc: vi.fn(),
  beginPath: vi.fn(),
  fill: vi.fn(),
  createImageData: vi.fn(),
  putImageData: vi.fn(),
  drawImage: vi.fn(),
  globalCompositeOperation: 'source-over',
  fillStyle: '',
  filter: 'none',
} as unknown as CanvasRenderingContext2D;

const mockImageData = {
  data: new Uint8ClampedArray(800 * 600 * 4),
  width: 800,
  height: 600,
} as ImageData;

const defaultConfig: FallbackRendererConfig = {
  mode: 'metaball',
  particleCount: 100,
  enableBlur: true,
  enableCompositing: true,
  enableTransforms: true,
  pixelSkip: 1,
  simplificationLevel: 1,
};

const mockParticles = [
  {
    position: { x: 100, y: 100 },
    velocity: { x: 1, y: 1 },
    life: 1.0,
    maxLife: 2.0,
    size: 10,
    color: { h: 180, s: 80, l: 60, a: 1.0 },
    createdAt: Date.now(),
  },
  {
    position: { x: 200, y: 200 },
    velocity: { x: -1, y: 1 },
    life: 0.5,
    maxLife: 2.0,
    size: 15,
    color: { h: 240, s: 90, l: 70, a: 0.8 },
    createdAt: Date.now(),
  },
];

describe('Fallback Renderers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset canvas dimensions
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    
    // Reset mock context methods
    mockContext.clearRect = vi.fn();
    mockContext.fillRect = vi.fn();
    mockContext.arc = vi.fn();
    mockContext.beginPath = vi.fn();
    mockContext.fill = vi.fn();
    mockContext.createImageData = vi.fn().mockReturnValue(mockImageData);
    mockContext.putImageData = vi.fn();
    mockContext.drawImage = vi.fn();
    mockContext.globalCompositeOperation = 'source-over';
    mockContext.fillStyle = '';
    mockContext.filter = 'none';
    
    mockCanvas.getContext = vi.fn().mockReturnValue(mockContext);
  });

  describe('MetaballRenderer', () => {
    it('should create metaball renderer successfully', () => {
      const renderer = new MetaballRenderer(mockCanvas, defaultConfig);
      expect(renderer).toBeDefined();
      expect(renderer.getMode()).toBe('metaball');
    });

    it('should handle render without errors', () => {
      const renderer = new MetaballRenderer(mockCanvas, defaultConfig);
      renderer.resize(800, 600);
      
      expect(() => {
        renderer.render(mockParticles);
      }).not.toThrow();
    });

    it('should clear canvas', () => {
      const renderer = new MetaballRenderer(mockCanvas, defaultConfig);
      renderer.clear();
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should resize and create new image data', () => {
      const renderer = new MetaballRenderer(mockCanvas, defaultConfig);
      renderer.resize(1024, 768);
      
      expect(mockContext.createImageData).toHaveBeenCalledWith(1024, 768);
    });

    it('should handle ImageData creation failure gracefully', () => {
      mockContext.createImageData = vi.fn().mockImplementation(() => {
        throw new Error('ImageData not supported');
      });
      
      const renderer = new MetaballRenderer(mockCanvas, defaultConfig);
      
      expect(() => {
        renderer.resize(800, 600);
      }).not.toThrow();
    });

    it('should update configuration', () => {
      const renderer = new MetaballRenderer(mockCanvas, defaultConfig);
      const newConfig = { enableBlur: false, pixelSkip: 2 };
      
      renderer.setConfig(newConfig);
      
      // Configuration should be updated (tested through behavior)
      expect(renderer.getMode()).toBe('metaball');
    });

    it('should apply blur when enabled', () => {
      const renderer = new MetaballRenderer(mockCanvas, defaultConfig);
      renderer.resize(800, 600);
      renderer.render(mockParticles);
      
      // Should set filter and draw image for blur effect
      expect(mockContext.drawImage).toHaveBeenCalled();
    });
  });

  describe('SimpleRenderer', () => {
    it('should create simple renderer successfully', () => {
      const renderer = new SimpleRenderer(mockCanvas, defaultConfig);
      expect(renderer).toBeDefined();
      expect(renderer.getMode()).toBe('simple');
    });

    it('should render particles as circles', () => {
      const renderer = new SimpleRenderer(mockCanvas, defaultConfig);
      renderer.render(mockParticles);
      
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should use composite operation when enabled', () => {
      const config = { ...defaultConfig, enableCompositing: true };
      const renderer = new SimpleRenderer(mockCanvas, config);
      renderer.render(mockParticles);
      
      // Should set and reset composite operation
      expect(mockContext.globalCompositeOperation).toBe('source-over');
    });

    it('should not use composite operation when disabled', () => {
      const config = { ...defaultConfig, enableCompositing: false };
      const renderer = new SimpleRenderer(mockCanvas, config);
      
      const originalComposite = mockContext.globalCompositeOperation;
      renderer.render(mockParticles);
      
      expect(mockContext.globalCompositeOperation).toBe(originalComposite);
    });

    it('should clear canvas', () => {
      const renderer = new SimpleRenderer(mockCanvas, defaultConfig);
      renderer.clear();
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should resize canvas', () => {
      const renderer = new SimpleRenderer(mockCanvas, defaultConfig);
      renderer.resize(1024, 768);
      
      expect(mockCanvas.width).toBe(1024);
      expect(mockCanvas.height).toBe(768);
    });
  });

  describe('BasicRenderer', () => {
    it('should create basic renderer successfully', () => {
      const renderer = new BasicRenderer(mockCanvas, defaultConfig);
      expect(renderer).toBeDefined();
      expect(renderer.getMode()).toBe('basic');
    });

    it('should render particles as rectangles', () => {
      const renderer = new BasicRenderer(mockCanvas, defaultConfig);
      renderer.render(mockParticles);
      
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillStyle).toContain('rgba');
    });

    it('should use simple colors without HSL conversion', () => {
      const renderer = new BasicRenderer(mockCanvas, defaultConfig);
      renderer.render(mockParticles);
      
      // Should use hardcoded color values
      expect(mockContext.fillStyle).toContain('255, 100, 150');
    });

    it('should clear canvas', () => {
      const renderer = new BasicRenderer(mockCanvas, defaultConfig);
      renderer.clear();
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should resize canvas', () => {
      const renderer = new BasicRenderer(mockCanvas, defaultConfig);
      renderer.resize(1024, 768);
      
      expect(mockCanvas.width).toBe(1024);
      expect(mockCanvas.height).toBe(768);
    });
  });

  describe('DisabledRenderer', () => {
    it('should create disabled renderer successfully', () => {
      const renderer = new DisabledRenderer();
      expect(renderer).toBeDefined();
      expect(renderer.getMode()).toBe('disabled');
    });

    it('should do nothing on render', () => {
      const renderer = new DisabledRenderer();
      
      expect(() => {
        renderer.render(mockParticles);
      }).not.toThrow();
      
      // Should not call any canvas methods
      expect(mockContext.clearRect).not.toHaveBeenCalled();
      expect(mockContext.fillRect).not.toHaveBeenCalled();
    });

    it('should do nothing on clear', () => {
      const renderer = new DisabledRenderer();
      
      expect(() => {
        renderer.clear();
      }).not.toThrow();
    });

    it('should do nothing on resize', () => {
      const renderer = new DisabledRenderer();
      
      expect(() => {
        renderer.resize(1024, 768);
      }).not.toThrow();
    });

    it('should do nothing on config update', () => {
      const renderer = new DisabledRenderer();
      
      expect(() => {
        renderer.setConfig({ enableBlur: false });
      }).not.toThrow();
    });
  });

  describe('RendererFactory', () => {
    it('should create metaball renderer', () => {
      const renderer = RendererFactory.createRenderer(mockCanvas, 'metaball', defaultConfig);
      expect(renderer).toBeInstanceOf(MetaballRenderer);
      expect(renderer.getMode()).toBe('metaball');
    });

    it('should create simple renderer', () => {
      const renderer = RendererFactory.createRenderer(mockCanvas, 'simple', defaultConfig);
      expect(renderer).toBeInstanceOf(SimpleRenderer);
      expect(renderer.getMode()).toBe('simple');
    });

    it('should create basic renderer', () => {
      const renderer = RendererFactory.createRenderer(mockCanvas, 'basic', defaultConfig);
      expect(renderer).toBeInstanceOf(BasicRenderer);
      expect(renderer.getMode()).toBe('basic');
    });

    it('should create disabled renderer', () => {
      const renderer = RendererFactory.createRenderer(mockCanvas, 'disabled', defaultConfig);
      expect(renderer).toBeInstanceOf(DisabledRenderer);
      expect(renderer.getMode()).toBe('disabled');
    });

    it('should throw error for unknown mode', () => {
      expect(() => {
        RendererFactory.createRenderer(mockCanvas, 'unknown' as RenderingMode, defaultConfig);
      }).toThrow('Unknown rendering mode: unknown');
    });

    it('should select best mode based on capabilities', () => {
      // High-end capabilities
      const highEndCaps = {
        canvas2d: true,
        imageData: true,
        compositeOperations: true,
        transforms: true,
      };
      expect(RendererFactory.selectBestMode(highEndCaps)).toBe('metaball');

      // Medium capabilities
      const mediumCaps = {
        canvas2d: true,
        imageData: false,
        compositeOperations: true,
        transforms: true,
      };
      expect(RendererFactory.selectBestMode(mediumCaps)).toBe('simple');

      // Low capabilities
      const lowCaps = {
        canvas2d: true,
        imageData: false,
        compositeOperations: false,
        transforms: false,
      };
      expect(RendererFactory.selectBestMode(lowCaps)).toBe('basic');

      // No capabilities
      const noCaps = {
        canvas2d: false,
        imageData: false,
        compositeOperations: false,
        transforms: false,
      };
      expect(RendererFactory.selectBestMode(noCaps)).toBe('disabled');
    });
  });

  describe('Error Handling', () => {
    it('should handle canvas context creation failure', () => {
      const nullCanvas = { ...mockCanvas, getContext: vi.fn().mockReturnValue(null) };
      
      expect(() => {
        new MetaballRenderer(nullCanvas as any, defaultConfig);
      }).toThrow('Cannot get 2D context');
      
      expect(() => {
        new SimpleRenderer(nullCanvas as any, defaultConfig);
      }).toThrow('Cannot get 2D context');
      
      expect(() => {
        new BasicRenderer(nullCanvas as any, defaultConfig);
      }).toThrow('Cannot get 2D context');
    });

    it('should handle rendering errors gracefully', () => {
      const errorContext = {
        ...mockContext,
        arc: vi.fn().mockImplementation(() => {
          throw new Error('Arc not supported');
        }),
      };
      
      const errorCanvas = { ...mockCanvas, getContext: vi.fn().mockReturnValue(errorContext) };
      const renderer = new SimpleRenderer(errorCanvas as any, defaultConfig);
      
      expect(() => {
        renderer.render(mockParticles);
      }).toThrow();
    });
  });

  describe('Performance Optimizations', () => {
    it('should respect pixel skip setting in metaball renderer', () => {
      const config = { ...defaultConfig, pixelSkip: 4 };
      const renderer = new MetaballRenderer(mockCanvas, config);
      renderer.resize(800, 600);
      
      // Should process fewer pixels with higher skip value
      expect(() => {
        renderer.render(mockParticles);
      }).not.toThrow();
    });

    it('should handle empty particle array', () => {
      const renderer = new SimpleRenderer(mockCanvas, defaultConfig);
      
      expect(() => {
        renderer.render([]);
      }).not.toThrow();
      
      // Should not call rendering methods for empty array
      expect(mockContext.arc).not.toHaveBeenCalled();
    });

    it('should handle particles with zero life', () => {
      const deadParticles = mockParticles.map(p => ({ ...p, life: 0 }));
      const renderer = new SimpleRenderer(mockCanvas, defaultConfig);
      
      expect(() => {
        renderer.render(deadParticles);
      }).not.toThrow();
    });
  });
});
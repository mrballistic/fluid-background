/**
 * Tests for browser compatibility detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserCompatibility } from '../browser-compatibility';

// Mock browser environment
const mockCanvas = {
  getContext: vi.fn(),
  width: 0,
  height: 0,
};

const mockContext2D = {
  createImageData: vi.fn(),
  globalCompositeOperation: '',
  setTransform: vi.fn(),
};

const mockImageData = {
  data: new Uint8ClampedArray(4),
};

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => mockCanvas),
  writable: true,
});

describe('BrowserCompatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset static cache
    (BrowserCompatibility as any)._capabilities = null;
    (BrowserCompatibility as any)._performance = null;
  });

  describe('Canvas 2D Detection', () => {
    it('should detect Canvas 2D support when available', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.canvas2d).toBe(true);
    });

    it('should detect lack of Canvas 2D support', () => {
      mockCanvas.getContext.mockReturnValue(null);
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.canvas2d).toBe(false);
    });

    it('should handle Canvas 2D detection errors gracefully', () => {
      mockCanvas.getContext.mockImplementation(() => {
        throw new Error('Canvas not supported');
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.canvas2d).toBe(false);
    });
  });

  describe('ImageData Detection', () => {
    it('should detect ImageData support when available', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      mockContext2D.createImageData.mockReturnValue(mockImageData);
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.imageData).toBe(true);
    });

    it('should detect lack of ImageData support', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      mockContext2D.createImageData.mockReturnValue(null);
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.imageData).toBe(false);
    });

    it('should handle ImageData detection errors gracefully', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      mockContext2D.createImageData.mockImplementation(() => {
        throw new Error('ImageData not supported');
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.imageData).toBe(false);
    });
  });

  describe('RequestAnimationFrame Detection', () => {
    it('should detect native requestAnimationFrame', () => {
      Object.defineProperty(window, 'requestAnimationFrame', {
        value: vi.fn(),
        writable: true,
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.requestAnimationFrame).toBe(true);
    });

    it('should detect webkit prefixed requestAnimationFrame', () => {
      delete (window as any).requestAnimationFrame;
      Object.defineProperty(window, 'webkitRequestAnimationFrame', {
        value: vi.fn(),
        writable: true,
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.requestAnimationFrame).toBe(true);
    });

    it('should detect moz prefixed requestAnimationFrame', () => {
      delete (window as any).requestAnimationFrame;
      delete (window as any).webkitRequestAnimationFrame;
      Object.defineProperty(window, 'mozRequestAnimationFrame', {
        value: vi.fn(),
        writable: true,
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.requestAnimationFrame).toBe(true);
    });

    it('should detect lack of requestAnimationFrame support', () => {
      delete (window as any).requestAnimationFrame;
      delete (window as any).webkitRequestAnimationFrame;
      delete (window as any).mozRequestAnimationFrame;
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.requestAnimationFrame).toBe(false);
    });
  });

  describe('Performance.now Detection', () => {
    it('should detect performance.now support', () => {
      Object.defineProperty(global, 'performance', {
        value: { now: vi.fn() },
        writable: true,
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.performanceNow).toBe(true);
    });

    it('should detect lack of performance.now support', () => {
      delete (global as any).performance;
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.performanceNow).toBe(false);
    });
  });

  describe('Composite Operations Detection', () => {
    it('should detect composite operations support', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      Object.defineProperty(mockContext2D, 'globalCompositeOperation', {
        get: () => 'lighter',
        set: (value) => { /* setter */ },
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.compositeOperations).toBe(true);
    });

    it('should detect lack of composite operations support', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      Object.defineProperty(mockContext2D, 'globalCompositeOperation', {
        get: () => 'source-over', // Default value, not 'lighter'
        set: (value) => { /* setter */ },
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.compositeOperations).toBe(false);
    });
  });

  describe('WebGL Detection', () => {
    it('should detect WebGL support', () => {
      const mockWebGLContext = {};
      mockCanvas.getContext.mockImplementation((type) => {
        if (type === 'webgl' || type === 'experimental-webgl') {
          return mockWebGLContext;
        }
        return mockContext2D;
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.webgl).toBe(true);
    });

    it('should detect lack of WebGL support', () => {
      mockCanvas.getContext.mockImplementation((type) => {
        if (type === 'webgl' || type === 'experimental-webgl') {
          return null;
        }
        return mockContext2D;
      });
      
      const capabilities = BrowserCompatibility.getCapabilities();
      expect(capabilities.webgl).toBe(false);
    });
  });

  describe('Performance Capabilities', () => {
    beforeEach(() => {
      // Mock navigator
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 8,
        writable: true,
      });
    });

    it('should detect high performance capabilities', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      mockContext2D.createImageData.mockReturnValue(mockImageData);
      
      const performance = BrowserCompatibility.getPerformanceCapabilities();
      expect(performance.isHighPerformance).toBe(true);
      expect(performance.estimatedParticleLimit).toBe(150);
      expect(performance.supportsMetaballs).toBe(true);
      expect(performance.recommendedQuality).toBe('high');
    });

    it('should detect mobile device limitations', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      });
      
      const performance = BrowserCompatibility.getPerformanceCapabilities();
      expect(performance.isHighPerformance).toBe(false);
      expect(performance.estimatedParticleLimit).toBeLessThan(150);
    });

    it('should detect old browser limitations', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1)',
        writable: true,
      });
      
      const performance = BrowserCompatibility.getPerformanceCapabilities();
      expect(performance.isHighPerformance).toBe(false);
      expect(performance.recommendedQuality).toBe('low');
    });

    it('should detect low-end hardware limitations', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2,
        writable: true,
      });
      
      const performance = BrowserCompatibility.getPerformanceCapabilities();
      expect(performance.estimatedParticleLimit).toBeLessThan(150);
    });
  });

  describe('Overall Support Detection', () => {
    it('should report supported when all critical features are available', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      mockContext2D.createImageData.mockReturnValue(mockImageData);
      Object.defineProperty(window, 'requestAnimationFrame', {
        value: vi.fn(),
        writable: true,
      });
      
      expect(BrowserCompatibility.isSupported()).toBe(true);
    });

    it('should report unsupported when Canvas 2D is missing', () => {
      mockCanvas.getContext.mockReturnValue(null);
      
      expect(BrowserCompatibility.isSupported()).toBe(false);
    });

    it('should report unsupported when ImageData is missing', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      mockContext2D.createImageData.mockReturnValue(null);
      
      expect(BrowserCompatibility.isSupported()).toBe(false);
    });
  });

  describe('Recommended Configuration', () => {
    it('should provide appropriate configuration for high-end browsers', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      mockContext2D.createImageData.mockReturnValue(mockImageData);
      Object.defineProperty(window, 'requestAnimationFrame', {
        value: vi.fn(),
        writable: true,
      });
      
      const config = BrowserCompatibility.getRecommendedConfig();
      expect(config.particleCount).toBe(150);
      expect(config.quality).toBe('high');
      expect(config.useMetaballs).toBe(true);
      expect(config.targetFPS).toBe(60);
    });

    it('should provide degraded configuration for low-end browsers', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X)',
        writable: true,
      });
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      mockContext2D.createImageData.mockReturnValue(null);
      
      const config = BrowserCompatibility.getRecommendedConfig();
      expect(config.particleCount).toBeLessThan(150);
      expect(config.quality).not.toBe('high');
      expect(config.useMetaballs).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache capabilities after first detection', () => {
      mockCanvas.getContext.mockReturnValue(mockContext2D);
      
      const caps1 = BrowserCompatibility.getCapabilities();
      const caps2 = BrowserCompatibility.getCapabilities();
      
      expect(caps1).toBe(caps2); // Same object reference
      expect(document.createElement).toHaveBeenCalledTimes(10); // Called once per detection method
    });

    it('should cache performance capabilities after first detection', () => {
      const perf1 = BrowserCompatibility.getPerformanceCapabilities();
      const perf2 = BrowserCompatibility.getPerformanceCapabilities();
      
      expect(perf1).toBe(perf2); // Same object reference
    });
  });
});
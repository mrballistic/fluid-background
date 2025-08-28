/**
 * Integration tests for cross-browser compatibility features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserCompatibility } from '../browser-compatibility';
import { GracefulDegradation } from '../graceful-degradation';
import { installPolyfills, getRequestAnimationFrame, getCancelAnimationFrame } from '../polyfills';

describe('Cross-Browser Compatibility Integration', () => {
  beforeEach(() => {
    // Reset static cache
    (BrowserCompatibility as any)._capabilities = null;
    (BrowserCompatibility as any)._performance = null;
  });

  describe('Feature Detection', () => {
    it('should detect basic browser capabilities', () => {
      const capabilities = BrowserCompatibility.getCapabilities();
      
      // These should be available in the test environment
      expect(typeof capabilities.canvas2d).toBe('boolean');
      expect(typeof capabilities.imageData).toBe('boolean');
      expect(typeof capabilities.requestAnimationFrame).toBe('boolean');
      expect(typeof capabilities.performanceNow).toBe('boolean');
      expect(typeof capabilities.addEventListener).toBe('boolean');
    });

    it('should detect performance capabilities', () => {
      const performance = BrowserCompatibility.getPerformanceCapabilities();
      
      expect(typeof performance.isHighPerformance).toBe('boolean');
      expect(typeof performance.estimatedParticleLimit).toBe('number');
      expect(typeof performance.supportsMetaballs).toBe('boolean');
      expect(['high', 'medium', 'low']).toContain(performance.recommendedQuality);
    });

    it('should provide recommended configuration', () => {
      const config = BrowserCompatibility.getRecommendedConfig();
      
      expect(typeof config.particleCount).toBe('number');
      expect(config.particleCount).toBeGreaterThan(0);
      expect(typeof config.quality).toBe('string');
      expect(typeof config.useMetaballs).toBe('boolean');
      expect(typeof config.targetFPS).toBe('number');
    });
  });

  describe('Graceful Degradation', () => {
    it('should analyze browser capabilities and provide degradation info', () => {
      const degradation = new GracefulDegradation();
      const features = degradation.analyze();
      
      expect(['none', 'minor', 'major', 'severe', 'disabled']).toContain(features.level);
      expect(typeof features.canRun).toBe('boolean');
      expect(Array.isArray(features.disabledFeatures)).toBe(true);
      expect(Array.isArray(features.enabledFeatures)).toBe(true);
      expect(Array.isArray(features.warnings)).toBe(true);
      expect(typeof features.recommendedConfig).toBe('object');
    });

    it('should provide compatibility report', () => {
      const degradation = new GracefulDegradation();
      const report = degradation.generateCompatibilityReport();
      
      expect(typeof report).toBe('string');
      expect(report).toContain('Compatibility Report');
      expect(report).toContain('Browser Capabilities');
      expect(report).toContain('Performance Assessment');
    });

    it('should handle different fallback modes', () => {
      const simpleMode = new GracefulDegradation({ fallbackMode: 'simple' });
      const compatibleMode = new GracefulDegradation({ fallbackMode: 'compatible' });
      
      const simpleConfig = simpleMode.getRecommendedConfig();
      const compatibleConfig = compatibleMode.getRecommendedConfig();
      
      expect(typeof simpleConfig).toBe('object');
      expect(typeof compatibleConfig).toBe('object');
    });
  });

  describe('Polyfills', () => {
    it('should install polyfills without errors', () => {
      expect(() => installPolyfills()).not.toThrow();
    });

    it('should provide cross-browser requestAnimationFrame', () => {
      const raf = getRequestAnimationFrame();
      expect(typeof raf).toBe('function');
    });

    it('should provide cross-browser cancelAnimationFrame', () => {
      const caf = getCancelAnimationFrame();
      expect(typeof caf).toBe('function');
    });

    it('should handle requestAnimationFrame callback', () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('RequestAnimationFrame callback not called within timeout'));
        }, 100);
        
        const raf = getRequestAnimationFrame();
        raf((timestamp) => {
          clearTimeout(timeout);
          // Just verify the callback was called - timestamp format may vary in test environment
          resolve();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Canvas gracefully', () => {
      // Mock document.createElement to return null
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockReturnValue(null);
      
      try {
        // Reset cache to force re-detection
        (BrowserCompatibility as any)._capabilities = null;
        
        const capabilities = BrowserCompatibility.getCapabilities();
        expect(capabilities.canvas2d).toBe(false);
      } finally {
        document.createElement = originalCreateElement;
      }
    });

    it('should handle Canvas context creation failure gracefully', () => {
      // Mock canvas that returns null context
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
        width: 0,
        height: 0,
      };
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockReturnValue(mockCanvas);
      
      try {
        // Reset cache to force re-detection
        (BrowserCompatibility as any)._capabilities = null;
        
        const capabilities = BrowserCompatibility.getCapabilities();
        expect(capabilities.canvas2d).toBe(false);
      } finally {
        document.createElement = originalCreateElement;
      }
    });

    it('should handle exceptions during feature detection', () => {
      // Mock canvas that throws errors
      const mockCanvas = {
        getContext: vi.fn().mockImplementation(() => {
          throw new Error('Canvas not supported');
        }),
        width: 0,
        height: 0,
      };
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockReturnValue(mockCanvas);
      
      try {
        // Reset cache to force re-detection
        (BrowserCompatibility as any)._capabilities = null;
        
        expect(() => {
          BrowserCompatibility.getCapabilities();
        }).not.toThrow();
        
        const capabilities = BrowserCompatibility.getCapabilities();
        expect(capabilities.canvas2d).toBe(false);
      } finally {
        document.createElement = originalCreateElement;
      }
    });
  });

  describe('Callback Integration', () => {
    it('should call degradation callbacks when appropriate', () => {
      const onDegraded = vi.fn();
      const onUnsupported = vi.fn();
      
      // Mock a scenario that would trigger degradation
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null), // No Canvas support
        width: 0,
        height: 0,
      };
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockReturnValue(mockCanvas);
      
      try {
        // Reset cache to force re-detection
        (BrowserCompatibility as any)._capabilities = null;
        (BrowserCompatibility as any)._performance = null;
        
        const degradation = new GracefulDegradation({
          onDegraded,
          onUnsupported,
        });
        
        const features = degradation.analyze();
        
        // Should call onUnsupported since Canvas is missing
        if (!features.canRun) {
          expect(onUnsupported).toHaveBeenCalled();
        }
      } finally {
        document.createElement = originalCreateElement;
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should provide valid particle count ranges', () => {
      const config = BrowserCompatibility.getRecommendedConfig();
      expect(config.particleCount).toBeGreaterThanOrEqual(10);
      expect(config.particleCount).toBeLessThanOrEqual(200);
    });

    it('should provide valid FPS targets', () => {
      const config = BrowserCompatibility.getRecommendedConfig();
      expect([30, 60]).toContain(config.targetFPS);
    });

    it('should provide consistent configuration across calls', () => {
      const config1 = BrowserCompatibility.getRecommendedConfig();
      const config2 = BrowserCompatibility.getRecommendedConfig();
      
      expect(config1.particleCount).toBe(config2.particleCount);
      expect(config1.quality).toBe(config2.quality);
      expect(config1.targetFPS).toBe(config2.targetFPS);
    });
  });
});
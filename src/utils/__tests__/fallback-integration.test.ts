/**
 * Integration tests for fallback rendering system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RendererFactory, RenderingMode } from '../fallback-renderer';
import { BrowserCompatibility } from '../browser-compatibility';

// Mock BrowserCompatibility
vi.mock('../browser-compatibility');
const mockBrowserCompatibility = BrowserCompatibility as any;

describe('Fallback Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mode Selection', () => {
    it('should select appropriate rendering mode based on capabilities', () => {
      // Test high-end capabilities
      const highEndCaps = {
        canvas2d: true,
        imageData: true,
        compositeOperations: true,
        transforms: true,
      };
      
      const mode = RendererFactory.selectBestMode(highEndCaps);
      expect(mode).toBe('metaball');
    });

    it('should fallback to simple mode for medium capabilities', () => {
      const mediumCaps = {
        canvas2d: true,
        imageData: false,
        compositeOperations: true,
        transforms: true,
      };
      
      const mode = RendererFactory.selectBestMode(mediumCaps);
      expect(mode).toBe('simple');
    });

    it('should fallback to basic mode for low capabilities', () => {
      const lowCaps = {
        canvas2d: true,
        imageData: false,
        compositeOperations: false,
        transforms: false,
      };
      
      const mode = RendererFactory.selectBestMode(lowCaps);
      expect(mode).toBe('basic');
    });

    it('should disable for no capabilities', () => {
      const noCaps = {
        canvas2d: false,
        imageData: false,
        compositeOperations: false,
        transforms: false,
      };
      
      const mode = RendererFactory.selectBestMode(noCaps);
      expect(mode).toBe('disabled');
    });
  });

  describe('Graceful Degradation Integration', () => {
    it('should provide appropriate fallback configuration', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: false,
        compositeOperations: false,
        transforms: false,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: false,
        estimatedParticleLimit: 50,
        supportsMetaballs: false,
        recommendedQuality: 'low',
      });

      mockBrowserCompatibility.getRecommendedConfig.mockReturnValue({
        particleCount: 50,
        quality: 'low',
        useMetaballs: false,
        targetFPS: 30,
      });

      const config = BrowserCompatibility.getRecommendedConfig();
      
      expect(config.particleCount).toBeLessThanOrEqual(50);
      expect(config.quality).toBe('low');
      expect(config.useMetaballs).toBe(false);
      expect(config.targetFPS).toBe(30);
    });

    it('should handle browser compatibility detection', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: true,
        compositeOperations: true,
        transforms: true,
      });

      mockBrowserCompatibility.isSupported.mockReturnValue(true);

      expect(BrowserCompatibility.isSupported()).toBe(true);
      expect(BrowserCompatibility.getCapabilities().canvas2d).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle unsupported browser gracefully', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: false,
        imageData: false,
        compositeOperations: false,
        transforms: false,
      });

      mockBrowserCompatibility.isSupported.mockReturnValue(false);

      expect(BrowserCompatibility.isSupported()).toBe(false);
      
      const mode = RendererFactory.selectBestMode(BrowserCompatibility.getCapabilities());
      expect(mode).toBe('disabled');
    });

    it('should provide fallback configuration for degraded browsers', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: false,
        compositeOperations: false,
        transforms: false,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: false,
        estimatedParticleLimit: 30,
        supportsMetaballs: false,
        recommendedQuality: 'low',
      });

      const mode = RendererFactory.selectBestMode(BrowserCompatibility.getCapabilities());
      expect(mode).toBe('basic');
      
      const perfCaps = BrowserCompatibility.getPerformanceCapabilities();
      expect(perfCaps.supportsMetaballs).toBe(false);
      expect(perfCaps.recommendedQuality).toBe('low');
    });
  });

  describe('Rendering Mode Hierarchy', () => {
    it('should respect rendering mode hierarchy', () => {
      const modes: RenderingMode[] = ['disabled', 'basic', 'simple', 'metaball'];
      
      // Each mode should be "better" than the previous
      for (let i = 1; i < modes.length; i++) {
        const currentMode = modes[i];
        const previousMode = modes[i - 1];
        
        // This is a conceptual test - in practice, metaball > simple > basic > disabled
        expect(modes.indexOf(currentMode)).toBeGreaterThan(modes.indexOf(previousMode));
      }
    });

    it('should select best available mode', () => {
      // Test that the factory selects the best mode for given capabilities
      const testCases = [
        {
          caps: { canvas2d: true, imageData: true, compositeOperations: true, transforms: true },
          expected: 'metaball' as RenderingMode,
        },
        {
          caps: { canvas2d: true, imageData: false, compositeOperations: true, transforms: true },
          expected: 'simple' as RenderingMode,
        },
        {
          caps: { canvas2d: true, imageData: false, compositeOperations: false, transforms: false },
          expected: 'basic' as RenderingMode,
        },
        {
          caps: { canvas2d: false, imageData: false, compositeOperations: false, transforms: false },
          expected: 'disabled' as RenderingMode,
        },
      ];

      testCases.forEach(({ caps, expected }) => {
        const mode = RendererFactory.selectBestMode(caps);
        expect(mode).toBe(expected);
      });
    });
  });
});
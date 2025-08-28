/**
 * Tests for graceful degradation system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GracefulDegradation, DegradationLevel } from '../graceful-degradation';
import { BrowserCompatibility } from '../browser-compatibility';

// Mock the BrowserCompatibility module
vi.mock('../browser-compatibility');
vi.mock('../polyfills');

const mockBrowserCompatibility = BrowserCompatibility as any;

describe('GracefulDegradation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should use default configuration when none provided', () => {
      const degradation = new GracefulDegradation();
      expect(degradation).toBeDefined();
    });

    it('should merge provided configuration with defaults', () => {
      const config = {
        enableFallbacks: false,
        fallbackMode: 'simple' as const,
      };
      
      const degradation = new GracefulDegradation(config);
      expect(degradation).toBeDefined();
    });

    it('should install polyfills by default', () => {
      const { installPolyfills } = require('../polyfills');
      new GracefulDegradation();
      expect(installPolyfills).toHaveBeenCalled();
    });

    it('should not install polyfills when disabled', () => {
      const { installPolyfills } = require('../polyfills');
      jest.clearAllMocks();
      
      new GracefulDegradation({ autoInstallPolyfills: false });
      expect(installPolyfills).not.toHaveBeenCalled();
    });
  });

  describe('Feature Analysis', () => {
    it('should analyze capabilities and return degraded features', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: true,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: true,
        recommendedQuality: 'high',
      });

      mockBrowserCompatibility.getRecommendedConfig.mockReturnValue({
        particleCount: 150,
        quality: 'high',
        useMetaballs: true,
        targetFPS: 60,
      });

      const degradation = new GracefulDegradation();
      const features = degradation.analyze();

      expect(features.level).toBe('none');
      expect(features.canRun).toBe(true);
      expect(features.enabledFeatures).toContain('canvas2d');
      expect(features.enabledFeatures).toContain('imageData');
      expect(features.warnings).toHaveLength(0);
    });

    it('should detect disabled state when Canvas 2D is missing', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: false,
        imageData: false,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: false,
        transforms: false,
        webgl: false,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: false,
        estimatedParticleLimit: 50,
        supportsMetaballs: false,
        recommendedQuality: 'low',
      });

      const degradation = new GracefulDegradation();
      const features = degradation.analyze();

      expect(features.level).toBe('disabled');
      expect(features.canRun).toBe(false);
      expect(features.disabledFeatures).toContain('canvas2d');
      expect(features.warnings.length).toBeGreaterThan(0);
    });

    it('should detect major degradation when ImageData is missing', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: false,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: false, // Disabled due to missing ImageData
        recommendedQuality: 'high',
      });

      const degradation = new GracefulDegradation();
      const features = degradation.analyze();

      expect(features.level).toBe('major');
      expect(features.canRun).toBe(true);
      expect(features.disabledFeatures).toContain('imageData');
      expect(features.disabledFeatures).toContain('metaballs');
    });

    it('should detect minor degradation for missing non-critical features', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: true,
        requestAnimationFrame: false, // Minor degradation
        performanceNow: true,
        addEventListener: true,
        compositeOperations: false, // Minor degradation
        transforms: false, // Minor degradation
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: true,
        recommendedQuality: 'high',
      });

      const degradation = new GracefulDegradation();
      const features = degradation.analyze();

      expect(features.level).toBe('minor');
      expect(features.canRun).toBe(true);
      expect(features.disabledFeatures).toContain('requestAnimationFrame');
      expect(features.disabledFeatures).toContain('compositeOperations');
      expect(features.disabledFeatures).toContain('transforms');
    });

    it('should cache analysis results', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: true,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: true,
        recommendedQuality: 'high',
      });

      const degradation = new GracefulDegradation();
      const features1 = degradation.analyze();
      const features2 = degradation.analyze();

      expect(features1).toBe(features2); // Same object reference
      expect(mockBrowserCompatibility.getCapabilities).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration Generation', () => {
    it('should generate appropriate config for high-end browsers', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: true,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: true,
        recommendedQuality: 'high',
      });

      mockBrowserCompatibility.getRecommendedConfig.mockReturnValue({
        particleCount: 150,
        quality: 'high',
        useMetaballs: true,
        targetFPS: 60,
      });

      const degradation = new GracefulDegradation();
      const config = degradation.getRecommendedConfig();

      expect(config.useMetaballs).toBe(true);
      expect(config.enableBlur).toBe(true);
      expect(config.enableTransforms).toBe(true);
      expect(config.particleCount).toBe(150);
      expect(config.targetFPS).toBe(60);
      expect(config.renderingMode).toBe('metaball');
      expect(config.animationMode).toBe('raf');
    });

    it('should generate degraded config for low-end browsers', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: false,
        requestAnimationFrame: false,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: false,
        transforms: false,
        webgl: false,
        devicePixelRatio: true,
        visibilityAPI: true,
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

      const degradation = new GracefulDegradation();
      const config = degradation.getRecommendedConfig();

      expect(config.useMetaballs).toBe(false);
      expect(config.enableBlur).toBe(false);
      expect(config.enableTransforms).toBe(false);
      expect(config.particleCount).toBeLessThanOrEqual(50);
      expect(config.targetFPS).toBe(30);
      expect(config.renderingMode).toBe('basic');
      expect(config.animationMode).toBe('timeout');
    });

    it('should handle simple fallback mode', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: true,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: true,
        recommendedQuality: 'high',
      });

      mockBrowserCompatibility.getRecommendedConfig.mockReturnValue({
        particleCount: 150,
        quality: 'high',
        useMetaballs: true,
        targetFPS: 60,
      });

      const degradation = new GracefulDegradation({ fallbackMode: 'simple' });
      const config = degradation.getRecommendedConfig();

      expect(config.useMetaballs).toBe(false);
      expect(config.enableBlur).toBe(false);
      expect(config.particleCount).toBeLessThanOrEqual(30);
      expect(config.renderingMode).toBe('simple');
    });

    it('should handle disable fallback mode', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: false, // This will cause degradation
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: false,
        recommendedQuality: 'high',
      });

      mockBrowserCompatibility.getRecommendedConfig.mockReturnValue({
        particleCount: 150,
        quality: 'high',
        useMetaballs: false,
        targetFPS: 60,
      });

      const degradation = new GracefulDegradation({ fallbackMode: 'disable' });
      const config = degradation.getRecommendedConfig();

      expect(config.enabled).toBe(false);
    });
  });

  describe('Callback Notifications', () => {
    it('should call onDegraded callback when degradation occurs', () => {
      const onDegraded = vi.fn();
      
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: false, // Causes major degradation
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: false,
        recommendedQuality: 'high',
      });

      const degradation = new GracefulDegradation({ onDegraded });
      degradation.analyze();

      expect(onDegraded).toHaveBeenCalledWith('major');
    });

    it('should call onUnsupported callback when browser is unsupported', () => {
      const onUnsupported = vi.fn();
      
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: false, // Critical feature missing
        imageData: false,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: false,
        transforms: false,
        webgl: false,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: false,
        estimatedParticleLimit: 50,
        supportsMetaballs: false,
        recommendedQuality: 'low',
      });

      const degradation = new GracefulDegradation({ onUnsupported });
      degradation.analyze();

      expect(onUnsupported).toHaveBeenCalledWith('Critical features not supported');
    });

    it('should not call callbacks when no degradation occurs', () => {
      const onDegraded = vi.fn();
      const onUnsupported = vi.fn();
      
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: true,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: true,
        recommendedQuality: 'high',
      });

      const degradation = new GracefulDegradation({ onDegraded, onUnsupported });
      degradation.analyze();

      expect(onDegraded).not.toHaveBeenCalled();
      expect(onUnsupported).not.toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should return correct canRun status', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: true,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: true,
        recommendedQuality: 'high',
      });

      const degradation = new GracefulDegradation();
      expect(degradation.canRun()).toBe(true);
    });

    it('should return warnings array', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: false,
        requestAnimationFrame: false,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: false,
        transforms: false,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: false,
        estimatedParticleLimit: 50,
        supportsMetaballs: false,
        recommendedQuality: 'low',
      });

      const degradation = new GracefulDegradation();
      const warnings = degradation.getWarnings();

      expect(Array.isArray(warnings)).toBe(true);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Compatibility Report', () => {
    it('should generate comprehensive compatibility report', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: true,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: true,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: true,
        estimatedParticleLimit: 150,
        supportsMetaballs: true,
        recommendedQuality: 'high',
      });

      mockBrowserCompatibility.getRecommendedConfig.mockReturnValue({
        particleCount: 150,
        quality: 'high',
        useMetaballs: true,
        targetFPS: 60,
      });

      const degradation = new GracefulDegradation();
      const report = degradation.generateCompatibilityReport();

      expect(typeof report).toBe('string');
      expect(report).toContain('Compatibility Report');
      expect(report).toContain('COMPATIBLE');
      expect(report).toContain('Browser Capabilities');
      expect(report).toContain('Performance Assessment');
      expect(report).toContain('Recommended Configuration');
    });

    it('should include warnings in compatibility report', () => {
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: true,
        imageData: false,
        requestAnimationFrame: true,
        performanceNow: true,
        addEventListener: true,
        compositeOperations: false,
        transforms: true,
        webgl: true,
        devicePixelRatio: true,
        visibilityAPI: true,
      });

      mockBrowserCompatibility.getPerformanceCapabilities.mockReturnValue({
        isHighPerformance: false,
        estimatedParticleLimit: 100,
        supportsMetaballs: false,
        recommendedQuality: 'medium',
      });

      mockBrowserCompatibility.getRecommendedConfig.mockReturnValue({
        particleCount: 100,
        quality: 'medium',
        useMetaballs: false,
        targetFPS: 30,
      });

      const degradation = new GracefulDegradation();
      const report = degradation.generateCompatibilityReport();

      expect(report).toContain('Warnings');
      expect(report).toContain('⚠');
    });
  });
});
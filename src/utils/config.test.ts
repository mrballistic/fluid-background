import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_CONFIG,
  PERFORMANCE_PRESETS,
  mergeConfig,
  validateConfig,
  createAutoConfig,
  getResolutionMultiplier,
  detectMobileDevice,
  createInitialMetrics,
  type FluidSimulationConfig,
  type PerformanceMetrics
} from './config';

describe('Configuration management', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have valid default values', () => {
      expect(DEFAULT_CONFIG.colors.background).toEqual({ r: 0, g: 0, b: 0 });
      expect(DEFAULT_CONFIG.colors.fluid).toBe('rainbow');
      expect(DEFAULT_CONFIG.physics.viscosity).toBe(30);
      expect(DEFAULT_CONFIG.performance.resolution).toBe('auto');
      expect(DEFAULT_CONFIG.interaction.enabled).toBe(true);
    });
  });

  describe('mergeConfig', () => {
    it('should merge user config with defaults', () => {
      const userConfig = {
        physics: {
          viscosity: 50
        },
        colors: {
          background: { r: 0.1, g: 0.1, b: 0.1 }
        }
      };

      const result = mergeConfig(userConfig);

      expect(result.physics.viscosity).toBe(50);
      expect(result.physics.density).toBe(DEFAULT_CONFIG.physics.density); // Should keep default
      expect(result.colors.background).toEqual({ r: 0.1, g: 0.1, b: 0.1 });
      expect(result.colors.fluid).toBe(DEFAULT_CONFIG.colors.fluid); // Should keep default
    });

    it('should handle empty user config', () => {
      const result = mergeConfig({});
      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it('should handle undefined user config', () => {
      const result = mergeConfig();
      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it('should use custom base config', () => {
      const customBase: FluidSimulationConfig = {
        ...DEFAULT_CONFIG,
        physics: {
          ...DEFAULT_CONFIG.physics,
          viscosity: 100
        }
      };

      const result = mergeConfig({}, customBase);
      expect(result.physics.viscosity).toBe(100);
    });
  });

  describe('validateConfig', () => {
    it('should clamp physics values to safe ranges', () => {
      const invalidConfig: FluidSimulationConfig = {
        ...DEFAULT_CONFIG,
        physics: {
          viscosity: -10, // Should be clamped to 0
          density: 2.0, // Should be clamped to 1.0
          pressure: -1, // Should be clamped to 0
          curl: 200, // Should be clamped to 100
          splatRadius: 2.0, // Should be clamped to 1.0
          splatForce: 50000 // Should be clamped to 20000
        }
      };

      const result = validateConfig(invalidConfig);

      expect(result.physics.viscosity).toBe(0);
      expect(result.physics.density).toBe(1.0);
      expect(result.physics.pressure).toBe(0);
      expect(result.physics.curl).toBe(100);
      expect(result.physics.splatRadius).toBe(1.0);
      expect(result.physics.splatForce).toBe(20000);
    });

    it('should clamp color values to 0-1 range', () => {
      const invalidConfig: FluidSimulationConfig = {
        ...DEFAULT_CONFIG,
        colors: {
          ...DEFAULT_CONFIG.colors,
          background: { r: -0.5, g: 1.5, b: 0.5 }
        }
      };

      const result = validateConfig(invalidConfig);

      expect(result.colors.background.r).toBe(0);
      expect(result.colors.background.g).toBe(1);
      expect(result.colors.background.b).toBe(0.5);
    });

    it('should validate resolution setting', () => {
      const invalidConfig: FluidSimulationConfig = {
        ...DEFAULT_CONFIG,
        performance: {
          ...DEFAULT_CONFIG.performance,
          resolution: 'invalid' as any
        }
      };

      const result = validateConfig(invalidConfig);
      expect(result.performance.resolution).toBe('auto');
    });

    it('should clamp frame rate', () => {
      const invalidConfig: FluidSimulationConfig = {
        ...DEFAULT_CONFIG,
        performance: {
          ...DEFAULT_CONFIG.performance,
          frameRate: 200 // Should be clamped to 120
        }
      };

      const result = validateConfig(invalidConfig);
      expect(result.performance.frameRate).toBe(120);
    });

    it('should convert interaction booleans', () => {
      const config: FluidSimulationConfig = {
        ...DEFAULT_CONFIG,
        interaction: {
          enabled: 1 as any, // Should convert to true
          mouse: 0 as any, // Should convert to false
          touch: 'true' as any, // Should convert to true
          intensity: 10 // Should be clamped to 5
        }
      };

      const result = validateConfig(config);
      expect(result.interaction.enabled).toBe(true);
      expect(result.interaction.mouse).toBe(false);
      expect(result.interaction.touch).toBe(true);
      expect(result.interaction.intensity).toBe(5);
    });
  });

  describe('createAutoConfig', () => {
    it('should use low performance preset for mobile', () => {
      const metrics: PerformanceMetrics = {
        fps: 60,
        frameTime: 16.67,
        isLowPerformance: false,
        devicePixelRatio: 2,
        isMobile: true
      };

      const result = createAutoConfig(metrics);

      expect(result.physics.viscosity).toBe(20); // Uses low preset, mobile doesn't affect viscosity
      expect(result.performance.resolution).toBe('low');
      expect(result.physics.splatRadius).toBeGreaterThan(PERFORMANCE_PRESETS.low.physics.splatRadius);
    });

    it('should use high performance preset for good performance', () => {
      const metrics: PerformanceMetrics = {
        fps: 60,
        frameTime: 16.67,
        isLowPerformance: false,
        devicePixelRatio: 1,
        isMobile: false
      };

      const result = createAutoConfig(metrics);

      expect(result.physics.viscosity).toBe(PERFORMANCE_PRESETS.high.physics.viscosity);
      expect(result.performance.resolution).toBe('high');
    });

    it('should use low performance preset for low FPS', () => {
      const metrics: PerformanceMetrics = {
        fps: 25,
        frameTime: 40,
        isLowPerformance: true,
        devicePixelRatio: 1,
        isMobile: false
      };

      const result = createAutoConfig(metrics);

      expect(result.physics.viscosity).toBe(16); // 20 * 0.8 (low performance optimization)
      expect(result.performance.frameRate).toBeLessThanOrEqual(30);
    });

    it('should merge user config with auto config', () => {
      const metrics: PerformanceMetrics = {
        fps: 60,
        frameTime: 16.67,
        isLowPerformance: false,
        devicePixelRatio: 1,
        isMobile: false
      };

      const userConfig = {
        colors: {
          background: { r: 0.2, g: 0.2, b: 0.2 }
        }
      };

      const result = createAutoConfig(metrics, userConfig);

      expect(result.colors.background).toEqual({ r: 0.2, g: 0.2, b: 0.2 });
      expect(result.physics.viscosity).toBe(PERFORMANCE_PRESETS.high.physics.viscosity);
    });
  });

  describe('getResolutionMultiplier', () => {
    it('should return correct multiplier for explicit resolutions', () => {
      const metrics: PerformanceMetrics = {
        fps: 60,
        frameTime: 16.67,
        isLowPerformance: false,
        devicePixelRatio: 1,
        isMobile: false
      };

      expect(getResolutionMultiplier('low', metrics)).toBe(0.5);
      expect(getResolutionMultiplier('medium', metrics)).toBe(0.75);
      expect(getResolutionMultiplier('high', metrics)).toBe(1.0);
    });

    it('should auto-adjust for mobile devices', () => {
      const mobileMetrics: PerformanceMetrics = {
        fps: 60,
        frameTime: 16.67,
        isLowPerformance: false,
        devicePixelRatio: 2,
        isMobile: true
      };

      expect(getResolutionMultiplier('auto', mobileMetrics)).toBe(0.5);
    });

    it('should auto-adjust for low performance', () => {
      const lowPerfMetrics: PerformanceMetrics = {
        fps: 25,
        frameTime: 40,
        isLowPerformance: true,
        devicePixelRatio: 1,
        isMobile: false
      };

      expect(getResolutionMultiplier('auto', lowPerfMetrics)).toBe(0.5);
    });

    it('should auto-adjust for good performance', () => {
      const goodMetrics: PerformanceMetrics = {
        fps: 55,
        frameTime: 18,
        isLowPerformance: false,
        devicePixelRatio: 1,
        isMobile: false
      };

      expect(getResolutionMultiplier('auto', goodMetrics)).toBe(1.0);
    });

    it('should auto-adjust for medium performance', () => {
      const mediumMetrics: PerformanceMetrics = {
        fps: 40,
        frameTime: 25,
        isLowPerformance: false,
        devicePixelRatio: 1,
        isMobile: false
      };

      expect(getResolutionMultiplier('auto', mediumMetrics)).toBe(0.75);
    });
  });

  describe('detectMobileDevice', () => {
    let originalNavigator: Navigator;
    let originalWindow: Window & typeof globalThis;

    beforeEach(() => {
      originalNavigator = global.navigator;
      originalWindow = global.window;
    });

    afterEach(() => {
      global.navigator = originalNavigator;
      global.window = originalWindow;
    });

    it('should return false when window is undefined (SSR)', () => {
      global.window = undefined as any;
      expect(detectMobileDevice()).toBe(false);
    });

    it('should detect mobile by user agent', () => {
      global.navigator = {
        ...originalNavigator,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      } as Navigator;

      global.window = {
        ...originalWindow,
        innerWidth: 1920,
        innerHeight: 1080
      } as Window & typeof globalThis;

      expect(detectMobileDevice()).toBe(true);
    });

    it('should detect mobile by screen size and touch', () => {
      global.navigator = {
        ...originalNavigator,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        maxTouchPoints: 5
      } as Navigator;

      global.window = {
        ...originalWindow,
        innerWidth: 600,
        innerHeight: 800,
        ontouchstart: {} as any
      } as Window & typeof globalThis;

      expect(detectMobileDevice()).toBe(true);
    });

    it('should return false for desktop', () => {
      global.navigator = {
        ...originalNavigator,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        maxTouchPoints: 0
      } as Navigator;

      global.window = {
        ...originalWindow,
        innerWidth: 1920,
        innerHeight: 1080
      } as Window & typeof globalThis;

      expect(detectMobileDevice()).toBe(false);
    });
  });

  describe('createInitialMetrics', () => {
    it('should create initial metrics with defaults', () => {
      const metrics = createInitialMetrics();

      expect(metrics.fps).toBe(60);
      expect(metrics.frameTime).toBeCloseTo(16.67);
      expect(typeof metrics.isLowPerformance).toBe('boolean');
      expect(typeof metrics.isMobile).toBe('boolean');
      expect(metrics.devicePixelRatio).toBeGreaterThan(0);
    });

    it('should handle SSR environment', () => {
      const originalWindow = global.window;
      global.window = undefined as any;

      const metrics = createInitialMetrics();

      expect(metrics.devicePixelRatio).toBe(1);
      expect(metrics.isMobile).toBe(false);

      global.window = originalWindow;
    });
  });
});
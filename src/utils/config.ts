/**
 * Configuration management system for fluid simulation
 */

import type { RGB } from './color';

export interface FluidSimulationConfig {
  // Visual Configuration
  colors: {
    background: RGB;
    fluid: 'rainbow' | 'monochrome' | RGB[];
  };
  
  // Physics Configuration
  physics: {
    viscosity: number;
    density: number;
    pressure: number;
    curl: number;
    splatRadius: number;
    splatForce: number;
  };
  
  // Performance Configuration
  performance: {
    resolution: 'low' | 'medium' | 'high' | 'auto';
    frameRate: number;
    pauseOnHidden: boolean;
  };
  
  // Interaction Configuration
  interaction: {
    enabled: boolean;
    mouse: boolean;
    touch: boolean;
    intensity: number;
  };
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  isLowPerformance: boolean;
  devicePixelRatio: number;
  isMobile: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: FluidSimulationConfig = {
  colors: {
    background: { r: 0.0, g: 0.0, b: 0.0 },
    fluid: 'rainbow'
  },
  physics: {
    viscosity: 30,
    density: 0.98,
    pressure: 0.8,
    curl: 30,
    splatRadius: 0.25,
    splatForce: 6000
  },
  performance: {
    resolution: 'auto',
    frameRate: 60,
    pauseOnHidden: true
  },
  interaction: {
    enabled: true,
    mouse: true,
    touch: true,
    intensity: 1.0
  }
};

/**
 * Performance-based configuration presets
 */
export const PERFORMANCE_PRESETS = {
  low: {
    physics: {
      viscosity: 20,
      density: 0.95,
      pressure: 0.6,
      curl: 20,
      splatRadius: 0.3,
      splatForce: 4000
    },
    performance: {
      resolution: 'low' as const,
      frameRate: 30
    }
  },
  medium: {
    physics: {
      viscosity: 25,
      density: 0.97,
      pressure: 0.7,
      curl: 25,
      splatRadius: 0.25,
      splatForce: 5000
    },
    performance: {
      resolution: 'medium' as const,
      frameRate: 45
    }
  },
  high: {
    physics: {
      viscosity: 30,
      density: 0.98,
      pressure: 0.8,
      curl: 30,
      splatRadius: 0.2,
      splatForce: 6000
    },
    performance: {
      resolution: 'high' as const,
      frameRate: 60
    }
  }
};/**

 * Merges user configuration with defaults
 */
export const mergeConfig = (
  userConfig: Partial<FluidSimulationConfig> = {},
  baseConfig: FluidSimulationConfig = DEFAULT_CONFIG
): FluidSimulationConfig => {
  return {
    colors: {
      ...baseConfig.colors,
      ...userConfig.colors
    },
    physics: {
      ...baseConfig.physics,
      ...userConfig.physics
    },
    performance: {
      ...baseConfig.performance,
      ...userConfig.performance
    },
    interaction: {
      ...baseConfig.interaction,
      ...userConfig.interaction
    }
  };
};

/**
 * Validates configuration values and clamps them to safe ranges
 */
export const validateConfig = (config: FluidSimulationConfig): FluidSimulationConfig => {
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  
  return {
    colors: {
      background: {
        r: clamp(config.colors.background.r, 0, 1),
        g: clamp(config.colors.background.g, 0, 1),
        b: clamp(config.colors.background.b, 0, 1)
      },
      fluid: config.colors.fluid // Validated separately based on type
    },
    physics: {
      viscosity: clamp(config.physics.viscosity, 0, 100),
      density: clamp(config.physics.density, 0.1, 1.0),
      pressure: clamp(config.physics.pressure, 0, 2.0),
      curl: clamp(config.physics.curl, 0, 100),
      splatRadius: clamp(config.physics.splatRadius, 0.01, 1.0),
      splatForce: clamp(config.physics.splatForce, 100, 20000)
    },
    performance: {
      resolution: ['low', 'medium', 'high', 'auto'].includes(config.performance.resolution) 
        ? config.performance.resolution 
        : 'auto',
      frameRate: clamp(config.performance.frameRate, 15, 120),
      pauseOnHidden: Boolean(config.performance.pauseOnHidden)
    },
    interaction: {
      enabled: Boolean(config.interaction.enabled),
      mouse: Boolean(config.interaction.mouse),
      touch: Boolean(config.interaction.touch),
      intensity: clamp(config.interaction.intensity, 0, 5.0)
    }
  };
};

/**
 * Creates performance-based auto-configuration
 */
export const createAutoConfig = (
  metrics: PerformanceMetrics,
  userConfig: Partial<FluidSimulationConfig> = {}
): FluidSimulationConfig => {
  let performanceLevel: keyof typeof PERFORMANCE_PRESETS = 'medium';
  
  // Determine performance level based on metrics
  if (metrics.isMobile || metrics.fps < 30 || metrics.isLowPerformance) {
    performanceLevel = 'low';
  } else if (metrics.fps >= 50 && !metrics.isLowPerformance) {
    performanceLevel = 'high';
  }
  
  // Start with performance preset
  const presetConfig = PERFORMANCE_PRESETS[performanceLevel];
  
  // Merge with defaults and user config
  const baseConfig = mergeConfig({
    ...presetConfig,
    ...userConfig
  });
  
  // Apply mobile-specific optimizations
  if (metrics.isMobile) {
    baseConfig.physics.splatRadius *= 1.2; // Larger touch targets
    baseConfig.physics.splatForce *= 0.8; // Gentler effects
    baseConfig.performance.frameRate = Math.min(baseConfig.performance.frameRate, 45);
  }
  
  // Apply low performance optimizations
  if (metrics.isLowPerformance) {
    baseConfig.physics.viscosity *= 0.8;
    baseConfig.physics.curl *= 0.7;
    baseConfig.performance.frameRate = Math.min(baseConfig.performance.frameRate, 30);
  }
  
  return validateConfig(baseConfig);
};

/**
 * Gets resolution multiplier based on performance settings
 */
export const getResolutionMultiplier = (
  resolution: FluidSimulationConfig['performance']['resolution'],
  metrics: PerformanceMetrics
): number => {
  if (resolution === 'auto') {
    if (metrics.isMobile || metrics.isLowPerformance) {
      return 0.5;
    } else if (metrics.fps >= 50) {
      return 1.0;
    } else {
      return 0.75;
    }
  }
  
  switch (resolution) {
    case 'low': return 0.5;
    case 'medium': return 0.75;
    case 'high': return 1.0;
    default: return 0.75;
  }
};

/**
 * Detects if device is mobile based on user agent and screen size
 */
export const detectMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isSmallScreen && isTouchDevice);
};

/**
 * Creates initial performance metrics
 */
export const createInitialMetrics = (): PerformanceMetrics => {
  const isMobile = detectMobileDevice();
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  
  return {
    fps: 60,
    frameTime: 16.67,
    isLowPerformance: isMobile || devicePixelRatio > 2,
    devicePixelRatio,
    isMobile
  };
};
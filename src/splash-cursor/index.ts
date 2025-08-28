/**
 * Splash Cursor module exports
 * Provides both React component and vanilla JavaScript API
 */

// React component exports
export { SplashCursor } from '../components/SplashCursor';
export { useSplashCursor } from '../hooks/useSplashCursor';

// Core classes for vanilla JS usage
export { ParticleSystem } from './ParticleSystem';
export { PhysicsEngine } from './PhysicsEngine';
export { MetaballRenderer } from './MetaballRenderer';
export { MouseTracker } from './MouseTracker';

// Utility functions
export { 
  createSplashCursorConfig,
  validateSplashCursorConfig,
  createDefaultColorConfig,
  hslToRgb,
  rgbToHsl,
  interpolateColors
} from '../utils/splash-cursor';

// Type exports
export type {
  SplashCursorProps,
  ColorConfig,
  UseSplashCursorReturn,
  Vector2,
  HSLColor,
  Rectangle,
  MouseState,
  Particle,
  QualityLevel,
  SplashCursorConfig,
  ParticleSystemConfig,
  PhysicsConfig,
  SplashCursorPerformanceMetrics,
  QualitySettings
} from '../types/splash-cursor';

// Vanilla JavaScript API
export { 
  SplashCursorVanilla,
  createSplashCursor
} from '../vanilla/SplashCursorVanilla';
export type {
  SplashCursorVanillaOptions,
  SplashCursorVanillaAPI
} from '../vanilla/SplashCursorVanilla';

// Error exports
export {
  SplashCursorError,
  CanvasInitializationError,
  PerformanceError
} from '../types/splash-cursor';
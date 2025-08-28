// Main component exports
export { default as FluidBackground } from './FluidBackground';
export { SplashCursor } from './components/SplashCursor';

// Simulation classes export
export {
  WebGLContextImpl,
  ShaderManagerImpl,
  FramebufferManagerImpl,
} from './simulation';

// Utility exports
export * from './utils';

// Type exports
export type {
  FluidBackgroundProps,
  FluidSimulationConfig,
  ColorRGB,
  ColorHSV,
  Resolution,
  FluidColorMode,
  UseFluidSimulationReturn,
  UseResponsiveReturn,
  UsePerformanceReturn,
  WebGLContext,
  WebGLExtensions,
  WebGLCapabilities,
  ShaderManager,
  ShaderProgram,
  FramebufferManager,
  FramebufferPair,
} from './types';

// SplashCursor type exports
export type {
  SplashCursorProps,
  ColorConfig,
  UseSplashCursorReturn,
  Vector2,
  HSLColor,
  Rectangle,
  MouseState,
  Particle,
  QualityLevel
} from './types/splash-cursor';

// Error exports
export { WebGLError, ShaderCompilationError } from './types';
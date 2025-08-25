// Main component export
export { default as FluidBackground } from './FluidBackground';

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

// Error exports
export { WebGLError, ShaderCompilationError } from './types';
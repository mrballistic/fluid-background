// Main component export
export { default as FluidBackground } from './FluidBackground';

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
} from './types';

// Error exports
export { WebGLError, ShaderCompilationError } from './types';
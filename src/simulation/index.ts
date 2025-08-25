// WebGL Foundation Classes
export { WebGLContextImpl } from './WebGLContext';
export { ShaderManagerImpl } from './ShaderManager';
export { FramebufferManagerImpl } from './FramebufferManager';

// Re-export types for convenience
export type {
  WebGLContext,
  WebGLExtensions,
  WebGLCapabilities,
  ShaderManager,
  ShaderProgram,
  FramebufferManager,
  FramebufferPair,
} from '../types';
// Performance metrics for hooks and tests
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  frameCount: number;
  droppedFrames: number;
}


import { CSSProperties } from 'react';









// Utility types
export type ColorRGB = { r: number; g: number; b: number };
export type ColorHSV = { h: number; s: number; v: number };

export type Resolution = 'low' | 'medium' | 'high' | 'auto';

// Error types
export class WebGLError extends Error {
  constructor(message: string, public readonly context?: string) {
    super(message);
    this.name = 'WebGLError';
  }
}

export class ShaderCompilationError extends Error {
  constructor(message: string, public readonly shaderSource?: string) {
    super(message);
    this.name = 'ShaderCompilationError';
  }
}
import { CSSProperties } from 'react';

// Main component props interface
export interface FluidBackgroundProps {
  // Visual Configuration
  colors?: {
    background?: { r: number; g: number; b: number };
    fluid?: 'rainbow' | 'monochrome' | { r: number; g: number; b: number }[];
  };
  
  // Physics Configuration
  physics?: {
    viscosity?: number;
    density?: number;
    pressure?: number;
    curl?: number;
    splatRadius?: number;
    splatForce?: number;
  };
  
  // Performance Configuration
  performance?: {
    resolution?: 'low' | 'medium' | 'high' | 'auto';
    frameRate?: number;
    pauseOnHidden?: boolean;
  };
  
  // Interaction Configuration
  interaction?: {
    enabled?: boolean;
    mouse?: boolean;
    touch?: boolean;
    intensity?: number;
  };
  
  // Layout Configuration
  style?: CSSProperties;
  className?: string;
  zIndex?: number;
}

// Core simulation configuration
export interface FluidSimulationConfig {
  // Canvas and rendering
  canvas: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  
  // Visual settings
  colors: {
    background: { r: number; g: number; b: number };
    fluid: { r: number; g: number; b: number }[];
  };
  
  // Physics parameters
  physics: {
    viscosity: number;
    density: number;
    pressure: number;
    curl: number;
    splatRadius: number;
    splatForce: number;
    iterations: number;
  };
  
  // Performance settings
  performance: {
    resolution: number;
    frameRate: number;
    pauseOnHidden: boolean;
    autoOptimize: boolean;
  };
  
  // Interaction settings
  interaction: {
    enabled: boolean;
    mouse: boolean;
    touch: boolean;
    intensity: number;
  };
}

// WebGL context and capabilities
export interface WebGLCapabilities {
  maxTextureSize: number;
  floatTextures: boolean;
  halfFloatTextures: boolean;
  linearFiltering: boolean;
}

export interface WebGLExtensions {
  floatTexture?: OES_texture_float;
  halfFloatTexture?: OES_texture_half_float;
  linearFloat?: OES_texture_float_linear;
  linearHalfFloat?: OES_texture_half_float_linear;
}

// Render pass interfaces
export interface RenderPassInputs {
  velocity: WebGLTexture;
  density: WebGLTexture;
  pressure?: WebGLTexture;
  curl?: WebGLTexture;
  divergence?: WebGLTexture;
  deltaTime: number;
  mouse?: { x: number; y: number; dx: number; dy: number; down: boolean };
}

export interface RenderPass {
  execute(gl: WebGL2RenderingContext, inputs: RenderPassInputs): void;
  cleanup(): void;
}

// Shader management
export interface ShaderProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
  attributes: Record<string, number>;
}

export interface ShaderManager {
  compileShader(type: number, source: string): WebGLShader;
  createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram;
  getUniforms(program: WebGLProgram): Record<string, WebGLUniformLocation>;
  cleanup(): void;
}

// Framebuffer management
export interface FramebufferPair {
  read: WebGLFramebuffer;
  write: WebGLFramebuffer;
  texture: WebGLTexture;
  swap(): void;
}

export interface FramebufferManager {
  createFramebuffer(width: number, height: number, format: number): WebGLFramebuffer;
  createFramebufferPair(width: number, height: number, format: number): FramebufferPair;
  resize(width: number, height: number): void;
  cleanup(): void;
}

// WebGL context manager
export interface WebGLContext {
  gl: WebGL2RenderingContext;
  extensions: WebGLExtensions;
  capabilities: WebGLCapabilities;
  
  initialize(canvas: HTMLCanvasElement): boolean;
  resize(width: number, height: number): void;
  cleanup(): void;
}

// Simulation orchestrator
export interface SimulationStep {
  execute(deltaTime: number): void;
  handleInput(x: number, y: number, dx: number, dy: number, down: boolean): void;
  resize(width: number, height: number): void;
  cleanup(): void;
}

// Input handling
export interface InputState {
  x: number;
  y: number;
  dx: number;
  dy: number;
  down: boolean;
}

export interface InputHandler {
  getState(): InputState;
  handleMouseMove(event: MouseEvent): void;
  handleMouseDown(event: MouseEvent): void;
  handleMouseUp(event: MouseEvent): void;
  handleTouchStart(event: TouchEvent): void;
  handleTouchMove(event: TouchEvent): void;
  handleTouchEnd(event: TouchEvent): void;
  cleanup(): void;
}

// Hook return types
export interface UseFluidSimulationReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isInitialized: boolean;
  updateConfig: (config: Partial<FluidSimulationConfig>) => void;
}

export interface UseResponsiveReturn {
  dimensions: { width: number; height: number };
  devicePixelRatio: number;
}

export interface UsePerformanceReturn {
  fps: number;
  isVisible: boolean;
  shouldOptimize: boolean;
}

// Utility types
export type ColorRGB = { r: number; g: number; b: number };
export type ColorHSV = { h: number; s: number; v: number };

export type Resolution = 'low' | 'medium' | 'high' | 'auto';
export type FluidColorMode = 'rainbow' | 'monochrome' | ColorRGB[];

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
/**
 * TypeScript interfaces and types for splash cursor system
 */

import { CSSProperties } from 'react';

// Core data structures
export interface Vector2 {
  x: number;
  y: number;
}

export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
  a: number; // 0-1
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MouseState {
  position: Vector2;
  lastPosition: Vector2;
  velocity: Vector2;
  isDown: boolean;
  lastMoveTime: number;
}

// Configuration interfaces
export interface ColorConfig {
  mode: 'rainbow' | 'single' | 'gradient' | 'velocity';
  baseHue?: number;            // For single/gradient modes
  saturation?: number;         // Color saturation (0-100)
  lightness?: number;          // Color lightness (0-100)
  cycleSpeed?: number;         // Color cycling speed
}

export interface SplashCursorProps {
  // Visual configuration
  intensity?: number;           // 0-1, controls trail strength
  colors?: ColorConfig;         // Color scheme configuration
  particleCount?: number;       // Max particles (default: 150)
  
  // Physics configuration
  bounceEnabled?: boolean;      // Enable edge bouncing (default: true)
  gravity?: number;            // Upward drift strength (default: 0.01)
  drag?: number;               // Air resistance (default: 0.997)
  
  // Performance configuration
  targetFPS?: number;          // Target frame rate (default: 60)
  pauseOnHidden?: boolean;     // Pause when tab hidden (default: true)
  
  // Styling
  className?: string;
  style?: CSSProperties;
  zIndex?: number;             // Canvas z-index (default: 9999)
}

export interface SplashCursorConfig {
  // Visual
  intensity: number;
  colors: ColorConfig;
  particleCount: number;
  
  // Physics
  bounceEnabled: boolean;
  gravity: number;
  drag: number;
  
  // Performance
  targetFPS: number;
  pauseOnHidden: boolean;
  
  // Rendering
  metaballThreshold: number;
  blurAmount: number;
  fadeRate: number;
}

// Particle system interfaces
export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: HSLColor;
  createdAt: number;
}

export interface ParticleSystemConfig {
  maxParticles: number;
  emissionRate: number;
  particleLifetime: number;
  initialSize: number;
  sizeVariation: number;
}

// Physics engine interfaces
export interface PhysicsConfig {
  gravity: Vector2;
  drag: number;
  bounceEnabled: boolean;
  bounceDamping: number;
  bounds: Rectangle;
}

// Hook interfaces
export interface UseSplashCursorReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  particleCount: number;
  fps: number;
  
  // Control methods
  start: () => void;
  stop: () => void;
  reset: () => void;
  updateConfig: (config: Partial<SplashCursorProps>) => void;
}

// Performance monitoring interfaces
export interface SplashCursorPerformanceMetrics {
  fps: number;
  frameTime: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  frameCount: number;
  droppedFrames: number;
  particleCount: number;
  renderTime: number;
  updateTime: number;
}

// Error types
export class SplashCursorError extends Error {
  constructor(message: string, public readonly context?: string) {
    super(message);
    this.name = 'SplashCursorError';
  }
}

export class CanvasInitializationError extends SplashCursorError {
  constructor(message: string) {
    super(message, 'canvas-initialization');
    this.name = 'CanvasInitializationError';
  }
}

export class PerformanceError extends SplashCursorError {
  constructor(message: string, public readonly fps?: number, public readonly particleCount?: number) {
    super(message, 'performance');
    this.name = 'PerformanceError';
  }
}

// Quality levels for adaptive performance
export type QualityLevel = 'high' | 'medium' | 'low' | 'minimal';

export interface QualitySettings {
  particleCount: number;
  metaballThreshold: number;
  blurAmount: number;
  skipPixels: number;
  targetFPS: number;
}
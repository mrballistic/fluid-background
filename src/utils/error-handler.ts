/**
 * Error handling utilities for splash cursor system
 */

import { 
  SplashCursorError, 
  CanvasInitializationError, 
  PerformanceError,
  QualityLevel,
  QualitySettings 
} from '../types/splash-cursor';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Array<(error: Error, context?: string) => void> = [];
  private performanceCallbacks: Array<(fps: number, particleCount: number) => void> = [];
  private recoveryStrategies: Map<string, () => void> = new Map();

  private constructor() {
    this.setupDefaultRecoveryStrategies();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Error reporting
  public reportError(error: Error, context?: string): void {
    console.error(`[SplashCursor] Error in ${context || 'unknown context'}:`, error);
    
    // Call registered error callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error, context);
      } catch (callbackError) {
        console.error('[SplashCursor] Error in error callback:', callbackError);
      }
    });

    // Attempt recovery if strategy exists
    if (context && this.recoveryStrategies.has(context)) {
      try {
        const recoveryStrategy = this.recoveryStrategies.get(context);
        recoveryStrategy?.();
      } catch (recoveryError) {
        console.error(`[SplashCursor] Recovery strategy failed for ${context}:`, recoveryError);
      }
    }
  }

  public reportPerformanceIssue(fps: number, particleCount: number): void {
    console.warn(`[SplashCursor] Performance issue detected: ${fps.toFixed(1)} FPS with ${particleCount} particles`);
    
    // Call registered performance callbacks
    this.performanceCallbacks.forEach(callback => {
      try {
        callback(fps, particleCount);
      } catch (callbackError) {
        console.error('[SplashCursor] Error in performance callback:', callbackError);
      }
    });
  }

  // Callback registration
  public onError(callback: (error: Error, context?: string) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  public onPerformanceIssue(callback: (fps: number, particleCount: number) => void): () => void {
    this.performanceCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.performanceCallbacks.indexOf(callback);
      if (index > -1) {
        this.performanceCallbacks.splice(index, 1);
      }
    };
  }

  // Recovery strategies
  public setRecoveryStrategy(context: string, strategy: () => void): void {
    this.recoveryStrategies.set(context, strategy);
  }

  private setupDefaultRecoveryStrategies(): void {
    // Canvas initialization recovery
    this.setRecoveryStrategy('canvas-initialization', () => {
      console.log('[SplashCursor] Attempting canvas recovery...');
      // Recovery will be handled by the component that registers this strategy
    });

    // Performance recovery
    this.setRecoveryStrategy('performance', () => {
      console.log('[SplashCursor] Attempting performance recovery...');
      // Recovery will be handled by the performance monitor
    });
  }

  // Validation utilities
  public validateCanvasContext(canvas: HTMLCanvasElement | null): void {
    if (!canvas) {
      throw new CanvasInitializationError('Canvas element is null or undefined');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new CanvasInitializationError('Failed to get 2D rendering context from canvas');
    }

    // Check if canvas has valid dimensions
    if (canvas.width <= 0 || canvas.height <= 0) {
      throw new CanvasInitializationError(`Invalid canvas dimensions: ${canvas.width}x${canvas.height}`);
    }
  }

  public validateNumericRange(value: number, min: number, max: number, name: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new SplashCursorError(`${name} must be a valid number, got: ${value}`);
    }

    if (value < min || value > max) {
      throw new SplashCursorError(`${name} must be between ${min} and ${max}, got: ${value}`);
    }
  }

  public validateConfiguration(config: any): void {
    if (!config || typeof config !== 'object') {
      throw new SplashCursorError('Configuration must be a valid object');
    }

    // Validate numeric properties with ranges
    if (config.intensity !== undefined) {
      this.validateNumericRange(config.intensity, 0, 1, 'intensity');
    }

    if (config.particleCount !== undefined) {
      this.validateNumericRange(config.particleCount, 1, 1000, 'particleCount');
    }

    if (config.gravity !== undefined) {
      this.validateNumericRange(config.gravity, -1, 1, 'gravity');
    }

    if (config.drag !== undefined) {
      this.validateNumericRange(config.drag, 0, 1, 'drag');
    }

    if (config.targetFPS !== undefined) {
      this.validateNumericRange(config.targetFPS, 1, 120, 'targetFPS');
    }

    if (config.zIndex !== undefined) {
      this.validateNumericRange(config.zIndex, -10000, 10000, 'zIndex');
    }
  }

  // Feature detection
  public checkBrowserSupport(): { supported: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for Canvas 2D support
    try {
      const testCanvas = document.createElement('canvas');
      const ctx = testCanvas.getContext('2d');
      if (!ctx) {
        issues.push('Canvas 2D context not supported');
      }
    } catch (error) {
      issues.push('Canvas element not supported');
    }

    // Check for requestAnimationFrame
    if (!window.requestAnimationFrame) {
      issues.push('requestAnimationFrame not supported');
    }

    // Check for performance.now
    if (!window.performance || !window.performance.now) {
      issues.push('High-resolution timing not supported');
    }

    // Check for modern JavaScript features
    try {
      // Test for ES6 features
      const testArrow = () => {};
      const testClass = class {};
      const testConst = 'test';
    } catch (error) {
      issues.push('Modern JavaScript features not supported');
    }

    return {
      supported: issues.length === 0,
      issues
    };
  }

  // Graceful degradation
  public createFallbackCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.style.display = 'none';
    return canvas;
  }

  public getQualityFallback(currentQuality: QualityLevel): QualityLevel {
    const qualityLevels: QualityLevel[] = ['high', 'medium', 'low', 'minimal'];
    const currentIndex = qualityLevels.indexOf(currentQuality);
    
    if (currentIndex < qualityLevels.length - 1) {
      return qualityLevels[currentIndex + 1];
    }
    
    return 'minimal';
  }

  // Cleanup
  public cleanup(): void {
    this.errorCallbacks.length = 0;
    this.performanceCallbacks.length = 0;
    this.recoveryStrategies.clear();
    this.setupDefaultRecoveryStrategies();
  }
}

// Singleton instance export
export const errorHandler = ErrorHandler.getInstance();
/**
 * Vanilla JavaScript API for SplashCursor
 * Provides a simple interface for non-React applications
 */

import { ParticleSystem } from '../splash-cursor/ParticleSystem';
import { PhysicsEngine } from '../splash-cursor/PhysicsEngine';
import { MetaballRenderer } from '../splash-cursor/MetaballRenderer';
import { MouseTracker } from '../splash-cursor/MouseTracker';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { ErrorHandler } from '../utils/error-handler';
import { createSplashCursorConfig } from '../utils/splash-cursor';
import type {
  SplashCursorProps,
  SplashCursorConfig,
  Vector2,
  QualityLevel,
  SplashCursorPerformanceMetrics
} from '../types/splash-cursor';

export interface SplashCursorVanillaOptions extends Omit<SplashCursorProps, 'className' | 'style'> {
  container?: HTMLElement | string;
  canvas?: HTMLCanvasElement;
}

export interface SplashCursorVanillaAPI {
  // Control methods
  start(): void;
  stop(): void;
  destroy(): void;
  reset(): void;
  
  // Configuration
  updateConfig(config: Partial<SplashCursorProps>): void;
  getConfig(): SplashCursorConfig;
  
  // State
  isActive(): boolean;
  getParticleCount(): number;
  getFPS(): number;
  getQuality(): QualityLevel;
  getMetrics(): SplashCursorPerformanceMetrics | null;
  
  // Canvas access
  getCanvas(): HTMLCanvasElement | null;
  
  // Event handling
  onPerformanceUpdate(callback: (metrics: SplashCursorPerformanceMetrics) => void): () => void;
  onQualityChange(callback: (quality: QualityLevel) => void): () => void;
  onError(callback: (error: Error, context?: string) => void): () => void;
}

export class SplashCursorVanilla implements SplashCursorVanillaAPI {
  private canvas: HTMLCanvasElement | null = null;
  private container: HTMLElement | null = null;
  private config: SplashCursorConfig;
  
  // Core system components
  private particleSystem: ParticleSystem | null = null;
  private physicsEngine: PhysicsEngine | null = null;
  private metaballRenderer: MetaballRenderer | null = null;
  private mouseTracker: MouseTracker | null = null;
  
  // Performance and error handling
  private performanceMonitor: PerformanceMonitor | null = null;
  private errorHandler: ErrorHandler | null = null;
  
  // Animation state
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private active: boolean = false;
  
  // Performance tracking
  private currentFPS: number = 0;
  private currentQuality: QualityLevel = 'high';
  private particleCount: number = 0;
  
  constructor(options: SplashCursorVanillaOptions = {}) {
    this.config = createSplashCursorConfig(options);
    this.setupCanvas(options);
    this.initializeSystem();
  }
  
  private setupCanvas(options: SplashCursorVanillaOptions): void {
    if (options.canvas) {
      // Use provided canvas
      this.canvas = options.canvas;
    } else {
      // Create new canvas
      this.canvas = document.createElement('canvas');
      
      // Set up canvas styling for full-screen overlay
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = (options.zIndex || 9999).toString();
      
      // Find container
      if (options.container) {
        if (typeof options.container === 'string') {
          this.container = document.querySelector(options.container);
        } else {
          this.container = options.container;
        }
      }
      
      if (!this.container) {
        this.container = document.body;
      }
      
      // Append canvas to container
      this.container.appendChild(this.canvas);
    }
    
    // Set up canvas size
    this.resizeCanvas();
    
    // Set up resize listener
    window.addEventListener('resize', this.handleResize);
  }
  
  private handleResize = (): void => {
    this.resizeCanvas();
  };
  
  private resizeCanvas(): void {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    // Update physics engine bounds
    if (this.physicsEngine) {
      this.physicsEngine.setBounds({
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height
      });
    }
  }
  
  private initializeSystem(): void {
    try {
      if (!this.canvas) {
        throw new Error('Canvas not available for initialization');
      }
      
      // Initialize error handler and performance monitor
      this.errorHandler = ErrorHandler.getInstance();
      this.performanceMonitor = PerformanceMonitor.getInstance();
      
      // Initialize core components
      this.particleSystem = new ParticleSystem({
        maxParticles: this.config.particleCount,
        emissionRate: 30,
        particleLifetime: 2.0,
        initialSize: 8,
        sizeVariation: 4
      });
      
      this.physicsEngine = new PhysicsEngine({
        gravity: { x: 0, y: this.config.gravity },
        drag: this.config.drag,
        bounceEnabled: this.config.bounceEnabled,
        bounceDamping: 0.8,
        bounds: {
          x: 0,
          y: 0,
          width: this.canvas.width,
          height: this.canvas.height
        }
      });
      
      this.metaballRenderer = new MetaballRenderer(this.canvas, {
        threshold: this.config.metaballThreshold,
        blurAmount: this.config.blurAmount,
        qualityLevel: 'high',
        maxInfluenceDistance: 50,
        skipPixels: 1
      });
      
      this.mouseTracker = new MouseTracker({
        velocitySmoothing: 0.8,
        maxVelocity: 1000,
        touchSupport: true
      });
      
      // Start tracking mouse on the canvas
      this.mouseTracker.startTracking(this.canvas);
      
      // Configure performance monitoring
      this.performanceMonitor.startMonitoring(this.config.targetFPS);
      
      console.log('SplashCursor vanilla system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SplashCursor system:', error);
      if (this.errorHandler) {
        this.errorHandler.reportError(error as Error, 'vanilla-initialization');
      }
      throw error;
    }
  }
  
  private animate = (currentTime: number): void => {
    if (!this.active || !this.particleSystem || !this.physicsEngine || 
        !this.metaballRenderer || !this.mouseTracker) {
      return;
    }
    
    try {
      // Calculate delta time
      const deltaTime = this.lastFrameTime === 0 ? 0 : 
        Math.min((currentTime - this.lastFrameTime) / 1000, 1/30);
      this.lastFrameTime = currentTime;
      
      // Skip first frame to avoid large delta
      if (deltaTime === 0) {
        this.animationFrameId = requestAnimationFrame(this.animate);
        return;
      }
      
      // Get current mouse state
      const mouseState = this.mouseTracker.getMouseState();
      
      // Update particle system
      this.particleSystem.updateWithMouseState(deltaTime, mouseState);
      const particles = this.particleSystem.getParticles();
      
      // Update physics
      particles.forEach(particle => {
        this.physicsEngine!.updateParticle(particle, deltaTime);
      });
      
      // Render
      this.metaballRenderer.clear();
      this.metaballRenderer.render(particles);
      
      // Update performance metrics
      this.particleCount = particles.length;
      
      if (this.performanceMonitor) {
        const metrics = this.performanceMonitor.getMetrics();
        this.currentFPS = metrics.fps;
      }
      
    } catch (error) {
      console.error('Error in animation loop:', error);
      if (this.errorHandler) {
        this.errorHandler.reportError(error as Error, 'vanilla-animation');
      }
      this.stop();
      return;
    }
    
    // Continue animation
    this.animationFrameId = requestAnimationFrame(this.animate);
  };
  
  // Public API methods
  start(): void {
    if (this.active) return;
    
    this.active = true;
    this.lastFrameTime = 0;
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    console.log('SplashCursor started');
  }
  
  stop(): void {
    if (!this.active) return;
    
    this.active = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('SplashCursor stopped');
  }
  
  destroy(): void {
    this.stop();
    
    // Clean up components
    if (this.particleSystem) {
      this.particleSystem.cleanup();
    }
    
    if (this.mouseTracker) {
      this.mouseTracker.stopTracking();
    }
    
    if (this.performanceMonitor) {
      this.performanceMonitor.stopMonitoring();
    }
    
    // Remove canvas if we created it
    if (this.canvas && this.container && this.canvas.parentNode === this.container) {
      this.container.removeChild(this.canvas);
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Clear references
    this.canvas = null;
    this.container = null;
    this.particleSystem = null;
    this.physicsEngine = null;
    this.metaballRenderer = null;
    this.mouseTracker = null;
    this.performanceMonitor = null;
    this.errorHandler = null;
    
    console.log('SplashCursor destroyed');
  }
  
  reset(): void {
    if (this.particleSystem) {
      this.particleSystem.cleanup();
    }
    
    if (this.mouseTracker) {
      this.mouseTracker.reset();
    }
    
    this.particleCount = 0;
    this.currentFPS = 0;
    
    console.log('SplashCursor reset');
  }
  
  updateConfig(config: Partial<SplashCursorProps>): void {
    // Merge with existing config
    this.config = { ...this.config, ...createSplashCursorConfig(config) };
    
    // Update components
    if (this.particleSystem && config.particleCount !== undefined) {
      this.particleSystem.updateConfig({
        maxParticles: config.particleCount
      });
    }
    
    if (this.physicsEngine) {
      if (config.gravity !== undefined) {
        this.physicsEngine.setGravity({ x: 0, y: config.gravity });
      }
      if (config.drag !== undefined) {
        this.physicsEngine.setDrag(config.drag);
      }
    }
    
    if (this.performanceMonitor && config.targetFPS !== undefined) {
      this.performanceMonitor.stopMonitoring();
      this.performanceMonitor.startMonitoring(config.targetFPS);
    }
    
    console.log('SplashCursor config updated:', config);
  }
  
  getConfig(): SplashCursorConfig {
    return { ...this.config };
  }
  
  isActive(): boolean {
    return this.active;
  }
  
  getParticleCount(): number {
    return this.particleCount;
  }
  
  getFPS(): number {
    return this.currentFPS;
  }
  
  getQuality(): QualityLevel {
    return this.currentQuality;
  }
  
  getMetrics(): SplashCursorPerformanceMetrics | null {
    return this.performanceMonitor ? this.performanceMonitor.getMetrics() : null;
  }
  
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
  
  onPerformanceUpdate(callback: (metrics: SplashCursorPerformanceMetrics) => void): () => void {
    if (!this.performanceMonitor) {
      return () => {};
    }
    return this.performanceMonitor.onPerformanceUpdate(callback);
  }
  
  onQualityChange(callback: (quality: QualityLevel) => void): () => void {
    if (!this.performanceMonitor) {
      return () => {};
    }
    return this.performanceMonitor.onQualityChange((quality) => {
      this.currentQuality = quality;
      callback(quality);
    });
  }
  
  onError(callback: (error: Error, context?: string) => void): () => void {
    if (!this.errorHandler) {
      return () => {};
    }
    return this.errorHandler.onError(callback);
  }
}

// Factory function for easier usage
export function createSplashCursor(options: SplashCursorVanillaOptions = {}): SplashCursorVanillaAPI {
  return new SplashCursorVanilla(options);
}

// Default export for convenience
export default SplashCursorVanilla;
/**
 * useSplashCursor hook for managing splash cursor effect lifecycle
 * Provides canvas management, animation loop, and configuration handling
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { 
  UseSplashCursorReturn, 
  SplashCursorProps,
  SplashCursorConfig,
  SplashCursorPerformanceMetrics,
  QualityLevel
} from '../types/splash-cursor';
import { ParticleSystem } from '../splash-cursor/ParticleSystem';
import { MouseTracker } from '../splash-cursor/MouseTracker';
import { MetaballRenderer } from '../splash-cursor/MetaballRenderer';
import { PhysicsEngine } from '../splash-cursor/PhysicsEngine';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { ErrorHandler } from '../utils/error-handler';

/**
 * Default configuration for splash cursor
 */
const DEFAULT_CONFIG: SplashCursorConfig = {
  // Visual
  intensity: 0.8,
  colors: {
    mode: 'rainbow',
    saturation: 80,
    lightness: 60,
    cycleSpeed: 1.0
  },
  particleCount: 150,
  
  // Physics
  bounceEnabled: true,
  gravity: 0.01,
  drag: 0.997,
  
  // Performance
  targetFPS: 60,
  pauseOnHidden: true,
  
  // Rendering
  metaballThreshold: 0.5,
  blurAmount: 2,
  fadeRate: 0.02
};

/**
 * Validate and normalize configuration values
 */
const validateConfig = (config: Partial<SplashCursorProps>): Partial<SplashCursorConfig> => {
  const validated: Partial<SplashCursorConfig> = {};
  
  // Validate intensity (0-1)
  if (config.intensity !== undefined) {
    validated.intensity = Math.max(0, Math.min(1, config.intensity));
  }
  
  // Validate particle count (1-500)
  if (config.particleCount !== undefined) {
    validated.particleCount = Math.max(1, Math.min(500, Math.floor(config.particleCount)));
  }
  
  // Validate gravity (-1 to 1)
  if (config.gravity !== undefined) {
    validated.gravity = Math.max(-1, Math.min(1, config.gravity));
  }
  
  // Validate drag (0-1)
  if (config.drag !== undefined) {
    validated.drag = Math.max(0, Math.min(1, config.drag));
  }
  
  // Validate target FPS (10-120)
  if (config.targetFPS !== undefined) {
    validated.targetFPS = Math.max(10, Math.min(120, Math.floor(config.targetFPS)));
  }
  
  // Validate boolean values
  if (config.bounceEnabled !== undefined) {
    validated.bounceEnabled = Boolean(config.bounceEnabled);
  }
  
  if (config.pauseOnHidden !== undefined) {
    validated.pauseOnHidden = Boolean(config.pauseOnHidden);
  }
  
  // Validate colors configuration
  if (config.colors) {
    validated.colors = {
      mode: ['rainbow', 'single', 'gradient', 'velocity'].indexOf(config.colors.mode || '') !== -1
        ? config.colors.mode as any : 'rainbow',
      baseHue: config.colors.baseHue !== undefined 
        ? Math.max(0, Math.min(360, config.colors.baseHue)) : undefined,
      saturation: config.colors.saturation !== undefined 
        ? Math.max(0, Math.min(100, config.colors.saturation)) : undefined,
      lightness: config.colors.lightness !== undefined 
        ? Math.max(0, Math.min(100, config.colors.lightness)) : undefined,
      cycleSpeed: config.colors.cycleSpeed !== undefined 
        ? Math.max(0.1, Math.min(5, config.colors.cycleSpeed)) : undefined
    };
  }
  
  return validated;
};

/**
 * Merge configuration with defaults
 */
const mergeConfig = (userConfig: Partial<SplashCursorProps>, defaultConfig: SplashCursorConfig): SplashCursorConfig => {
  const validated = validateConfig(userConfig);
  return {
    ...defaultConfig,
    ...validated,
    colors: {
      ...defaultConfig.colors,
      ...(validated.colors || {})
    }
  };
};

/**
 * Hook for managing splash cursor effect
 */
export const useSplashCursor = (
  initialConfig: Partial<SplashCursorProps> = {}
): UseSplashCursorReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const [fps, setFps] = useState(0);
  
  // System instances
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const mouseTrackerRef = useRef<MouseTracker | null>(null);
  const metaballRendererRef = useRef<MetaballRenderer | null>(null);
  const physicsEngineRef = useRef<PhysicsEngine | null>(null);
  
  // Performance and error handling
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const errorHandlerRef = useRef<ErrorHandler | null>(null);
  
  // Animation and performance tracking
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsUpdateTimeRef = useRef<number>(0);
  
  // Configuration state
  const configRef = useRef<SplashCursorConfig>(
    mergeConfig(initialConfig, DEFAULT_CONFIG)
  );
  
  // Quality management
  const [currentQuality, setCurrentQuality] = useState<QualityLevel>('high');
  const qualityAdjustmentTimeRef = useRef<number>(0);
  
  // Performance monitoring
  const performanceMetricsRef = useRef<SplashCursorPerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    averageFps: 0,
    minFps: Infinity,
    maxFps: 0,
    frameCount: 0,
    droppedFrames: 0,
    particleCount: 0,
    renderTime: 0,
    updateTime: 0
  });
  
  /**
   * Apply quality settings to system components
   */
  const applyQualitySettings = useCallback((quality: QualityLevel) => {
    const qualitySettings = {
      high: { particles: configRef.current.particleCount, threshold: 0.5, blur: 2, skip: 1 },
      medium: { particles: Math.floor(configRef.current.particleCount * 0.7), threshold: 0.6, blur: 1, skip: 2 },
      low: { particles: Math.floor(configRef.current.particleCount * 0.4), threshold: 0.7, blur: 0, skip: 3 },
      minimal: { particles: Math.floor(configRef.current.particleCount * 0.2), threshold: 0.8, blur: 0, skip: 4 }
    };
    
    const settings = qualitySettings[quality];
    
    // Update particle system
    if (particleSystemRef.current) {
      particleSystemRef.current.updateConfig({
        maxParticles: settings.particles
      });
    }
    
    // Update metaball renderer
    if (metaballRendererRef.current) {
      metaballRendererRef.current.setThreshold(settings.threshold);
      metaballRendererRef.current.setBlurAmount(settings.blur);
    }
    
    console.log(`Applied ${quality} quality settings:`, settings);
  }, []);

  /**
   * Initialize performance monitoring and error handling
   */
  const initializeMonitoring = useCallback(() => {
    // Use singleton instances
    performanceMonitorRef.current = PerformanceMonitor.getInstance();
    errorHandlerRef.current = ErrorHandler.getInstance();
    
    // Configure performance monitoring
    performanceMonitorRef.current.startMonitoring(configRef.current.targetFPS);
    performanceMonitorRef.current.enableAdaptiveQuality({
      warningThreshold: 0.8,
      criticalThreshold: 0.6,
      excellentThreshold: 1.1,
      cooldownMs: 2000
    });
    
    // Set up performance monitoring callbacks
    const performanceUnsubscribe = performanceMonitorRef.current.onPerformanceUpdate((metrics: any) => {
      // Update FPS state
      setFps(Math.round(metrics.fps));
      
      // Check for performance issues
      if (metrics.averageFps < configRef.current.targetFPS * 0.6) {
        console.warn('Critical performance issue:', metrics);
      }
    });
    
    const qualityUnsubscribe = performanceMonitorRef.current.onQualityChange((quality: any, settings: any) => {
      setCurrentQuality(quality);
      applyQualitySettings(quality);
      console.log(`Quality changed to ${quality}:`, settings);
    });
    
    // Store unsubscribe functions for cleanup
    (performanceMonitorRef.current as any)._unsubscribeFunctions = [
      performanceUnsubscribe,
      qualityUnsubscribe
    ];
  }, [applyQualitySettings]);
  
  /**
   * Adjust quality based on performance
   */
  const adjustQualityForPerformance = useCallback((currentFps: number) => {
    const now = performance.now();
    
    // Don't adjust quality too frequently
    if (now - qualityAdjustmentTimeRef.current < 2000) {
      return;
    }
    
    const targetFps = configRef.current.targetFPS;
    let newQuality = currentQuality;
    
    // Determine quality adjustment based on FPS
    if (currentFps < targetFps * 0.6) {
      // Very poor performance - drop to minimal
      newQuality = 'minimal';
    } else if (currentFps < targetFps * 0.7) {
      // Poor performance - drop to low
      newQuality = 'low';
    } else if (currentFps < targetFps * 0.8) {
      // Moderate performance - drop to medium
      newQuality = 'medium';
    } else if (currentFps > targetFps * 0.95 && currentQuality !== 'high') {
      // Good performance - try to increase quality
      const qualityLevels: QualityLevel[] = ['minimal', 'low', 'medium', 'high'];
      const currentIndex = qualityLevels.indexOf(currentQuality);
      if (currentIndex < qualityLevels.length - 1) {
        newQuality = qualityLevels[currentIndex + 1];
      }
    }
    
    if (newQuality !== currentQuality) {
      setCurrentQuality(newQuality);
      applyQualitySettings(newQuality);
      qualityAdjustmentTimeRef.current = now;
      
      console.log(`Quality adjusted from ${currentQuality} to ${newQuality} (FPS: ${currentFps.toFixed(1)})`);
    }
  }, [currentQuality]);
  

  
  /**
   * Initialize all system components
   */
  const initializeSystem = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas ref not available for splash cursor');
      return false;
    }
    
    try {
      // Initialize monitoring first
      initializeMonitoring();
      
      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio));
      
      console.log('Initializing splash cursor with canvas size:', canvas.width, 'x', canvas.height);
      
      // Initialize ParticleSystem
      particleSystemRef.current = new ParticleSystem({
        maxParticles: configRef.current.particleCount,
        emissionRate: 30, // particles per second
        particleLifetime: 2.0, // seconds
        initialSize: 8,
        sizeVariation: 4
      });
      
      // Initialize MouseTracker
      mouseTrackerRef.current = new MouseTracker({
        velocitySmoothing: 0.8,
        maxVelocity: 1000,
        touchSupport: true,
        preventDefault: false
      });
      
      // Initialize MetaballRenderer
      metaballRendererRef.current = new MetaballRenderer(canvas, {
        threshold: configRef.current.metaballThreshold,
        blurAmount: configRef.current.blurAmount,
        qualityLevel: currentQuality,
        maxInfluenceDistance: 100,
        skipPixels: 1
      });
      
      // Initialize PhysicsEngine
      physicsEngineRef.current = new PhysicsEngine({
        bounds: {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height
        },
        gravity: { x: 0, y: configRef.current.gravity },
        drag: configRef.current.drag,
        bounceEnabled: configRef.current.bounceEnabled,
        bounceDamping: 0.8
      });
      
      // Start mouse tracking
      mouseTrackerRef.current.startTracking(canvas);
      
      // Apply initial quality settings
      applyQualitySettings(currentQuality);
      
      setIsActive(true);
      return true;
    } catch (error) {
      console.error('Error initializing splash cursor system:', error);
      
      // Report error to error handler
      if (errorHandlerRef.current) {
        errorHandlerRef.current.reportError(error as Error, 'system-initialization');
      }
      
      cleanup();
      return false;
    }
  }, [initializeMonitoring, currentQuality, applyQualitySettings]);
  
  /**
   * Handle canvas resize
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !metaballRendererRef.current || !physicsEngineRef.current) {
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    const newWidth = Math.max(1, Math.floor(rect.width * devicePixelRatio));
    const newHeight = Math.max(1, Math.floor(rect.height * devicePixelRatio));
    
    // Only resize if dimensions actually changed
    if (canvas.width === newWidth && canvas.height === newHeight) {
      return;
    }
    
    // Update canvas size
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Update renderer
    metaballRendererRef.current.resize(newWidth, newHeight);
    
    // Update physics bounds
    physicsEngineRef.current.setBounds({
      x: 0,
      y: 0,
      width: newWidth,
      height: newHeight
    });
  }, []);
  
  /**
   * Stop animation loop
   */
  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Animation loop using requestAnimationFrame
   */
  const animate = useCallback((currentTime: number) => {
    if (!particleSystemRef.current || !mouseTrackerRef.current || 
        !metaballRendererRef.current || !physicsEngineRef.current) {
      return;
    }
    
    // Calculate delta time
    const deltaTime = lastFrameTimeRef.current 
      ? Math.min((currentTime - lastFrameTimeRef.current) / 1000, 1/30) // Cap at 30fps minimum
      : 1/60;
    lastFrameTimeRef.current = currentTime;
    
    try {
      // Start performance monitoring for this frame
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.recordFrame(currentTime);
      }
      
      // Start update timing
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.startUpdateTiming();
      }
      
      // Get mouse state
      const mouseState = mouseTrackerRef.current.getMouseState();
      
      // Update particle system
      particleSystemRef.current.updateWithMouseState(deltaTime, mouseState);
      
      // Get particles for physics and rendering
      const particles = particleSystemRef.current.getParticles();
      
      // Update physics for all particles
      for (const particle of particles) {
        physicsEngineRef.current.updateParticle(particle, deltaTime);
      }
      
      // End update timing
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.endUpdateTiming();
      }
      
      // Start render timing
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.startRenderTiming();
      }
      
      // Render particles
      metaballRendererRef.current.clear();
      metaballRendererRef.current.render(particles);
      
      // End render timing
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.endRenderTiming();
      }
      
      // Update particle count state
      setParticleCount(particles.length);
      
      // Update performance metrics for display
      if (performanceMonitorRef.current) {
        const metrics = performanceMonitorRef.current.getMetrics();
        performanceMetricsRef.current = metrics;
        
        // Update FPS display less frequently to avoid excessive re-renders
        if (currentTime - fpsUpdateTimeRef.current >= 500) { // Update every 500ms
          setFps(Math.round(metrics.fps));
          fpsUpdateTimeRef.current = currentTime;
        }
      }
      
    } catch (error) {
      console.error('Error in splash cursor animation loop:', error);
      
      // Report error to error handler
      if (errorHandlerRef.current) {
        errorHandlerRef.current.reportError(error as Error, 'animation-loop');
      }
      
      stop();
      return;
    }
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [stop]);
  
  /**
   * Start animation loop
   */
  const start = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Reset performance tracking
    lastFrameTimeRef.current = 0;
    frameCountRef.current = 0;
    fpsUpdateTimeRef.current = performance.now();
    
    // Reset performance metrics
    const metrics = performanceMetricsRef.current;
    metrics.frameCount = 0;
    metrics.minFps = Infinity;
    metrics.maxFps = 0;
    metrics.averageFps = 0;
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);
  
  /**
   * Reset the entire system
   */
  const reset = useCallback(() => {
    stop();
    
    if (particleSystemRef.current) {
      particleSystemRef.current.cleanup();
    }
    
    if (mouseTrackerRef.current) {
      mouseTrackerRef.current.reset();
    }
    
    if (metaballRendererRef.current) {
      metaballRendererRef.current.clear();
    }
    
    // Reset performance metrics
    performanceMetricsRef.current = {
      fps: 0,
      frameTime: 0,
      averageFps: 0,
      minFps: Infinity,
      maxFps: 0,
      frameCount: 0,
      droppedFrames: 0,
      particleCount: 0,
      renderTime: 0,
      updateTime: 0
    };
    
    setParticleCount(0);
    setFps(0);
  }, [stop]);
  
  /**
   * Update configuration with validation and dynamic updates
   */
  const updateConfig = useCallback((newConfig: Partial<SplashCursorProps>) => {
    try {
      // Validate and merge new config with existing
      const mergedConfig = mergeConfig(newConfig, configRef.current);
      const previousConfig = { ...configRef.current };
      configRef.current = mergedConfig;
      
      console.log('Updating splash cursor configuration:', newConfig);
      
      // Update system components if they exist
      if (particleSystemRef.current) {
        particleSystemRef.current.updateConfig({
          maxParticles: mergedConfig.particleCount,
          emissionRate: 30,
          particleLifetime: 2.0,
          initialSize: 8,
          sizeVariation: 4
        });
      }
      
      if (physicsEngineRef.current) {
        physicsEngineRef.current.updateConfig({
          gravity: { x: 0, y: mergedConfig.gravity },
          drag: mergedConfig.drag,
          bounceEnabled: mergedConfig.bounceEnabled,
          bounceDamping: 0.8,
          bounds: physicsEngineRef.current.getConfig().bounds // Keep existing bounds
        });
      }
      
      if (metaballRendererRef.current) {
        metaballRendererRef.current.setThreshold(mergedConfig.metaballThreshold);
        metaballRendererRef.current.setBlurAmount(mergedConfig.blurAmount);
      }
      
      // Update performance monitor if target FPS changed
      if (performanceMonitorRef.current && mergedConfig.targetFPS !== previousConfig.targetFPS) {
        performanceMonitorRef.current.stopMonitoring();
        performanceMonitorRef.current.startMonitoring(mergedConfig.targetFPS);
      }
      
      // Re-apply quality settings if particle count changed significantly
      if (Math.abs(mergedConfig.particleCount - previousConfig.particleCount) > 10) {
        applyQualitySettings(currentQuality);
      }
      
    } catch (error) {
      console.error('Error updating splash cursor configuration:', error);
      
      // Report error to error handler
      if (errorHandlerRef.current) {
        errorHandlerRef.current.reportError(error as Error, 'config-update');
      }
    }
  }, [applyQualitySettings, currentQuality]);
  
  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    stop();
    
    if (mouseTrackerRef.current) {
      mouseTrackerRef.current.stopTracking();
      mouseTrackerRef.current = null;
    }
    
    if (particleSystemRef.current) {
      particleSystemRef.current.cleanup();
      particleSystemRef.current = null;
    }
    
    if (metaballRendererRef.current) {
      metaballRendererRef.current.clear();
      metaballRendererRef.current = null;
    }
    
    if (performanceMonitorRef.current) {
      // Clean up performance monitor callbacks
      const unsubscribeFunctions = (performanceMonitorRef.current as any)._unsubscribeFunctions;
      if (unsubscribeFunctions) {
        unsubscribeFunctions.forEach((unsubscribe: () => void) => unsubscribe());
      }
      
      performanceMonitorRef.current.stopMonitoring();
      performanceMonitorRef.current.resetMetrics();
      performanceMonitorRef.current = null;
    }
    
    if (errorHandlerRef.current) {
      errorHandlerRef.current = null;
    }
    
    physicsEngineRef.current = null;
    
    setIsActive(false);
    setParticleCount(0);
    setFps(0);
    setCurrentQuality('high');
  }, [stop]);
  
  // Initialize system when canvas is available
  useEffect(() => {
    if (canvasRef.current && !isActive) {
      const success = initializeSystem();
      if (success) {
        handleResize();
        start();
      }
    }
    
    return cleanup;
  }, [initializeSystem, handleResize, start, cleanup, isActive]);
  
  // Handle window resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  // Handle visibility change for performance
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (configRef.current.pauseOnHidden) {
        if (document.hidden) {
          stop();
        } else if (isActive) {
          start();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [start, stop, isActive]);
  
  return {
    canvasRef,
    isActive,
    particleCount,
    fps,
    start,
    stop,
    reset,
    updateConfig
  };
};
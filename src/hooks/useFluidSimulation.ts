/**
 * Main fluid simulation hook
 * Orchestrates WebGL initialization, simulation setup, and animation loop
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { 
  UseFluidSimulationReturn, 
  FluidSimulationConfig,
  WebGLContext,
  SimulationStep,
  InputHandler
} from '../types';
import { 
  WebGLContextImpl,
  SimulationStepImpl,
  InputHandlerImpl,
  ShaderManagerImpl,
  FramebufferManagerImpl
} from '../simulation';
import { mergeConfig, DEFAULT_CONFIG } from '../utils/config';

/**
 * Hook for managing fluid simulation lifecycle and WebGL context
 */
export const useFluidSimulation = (
  initialConfig: Partial<FluidSimulationConfig> = {}
): UseFluidSimulationReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // WebGL and simulation instances
  const webglContextRef = useRef<WebGLContext | null>(null);
  const simulationRef = useRef<SimulationStep | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Configuration state
  const configRef = useRef<FluidSimulationConfig>(
    mergeConfig(initialConfig, DEFAULT_CONFIG)
  );
  
  // Performance tracking
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  /**
   * Set up input event listeners
   */
  const setupEventListeners = useCallback((
    canvas: HTMLCanvasElement, 
    inputHandler: InputHandler
  ) => {
    // Mouse events
    canvas.addEventListener('mousemove', inputHandler.handleMouseMove);
    canvas.addEventListener('mousedown', inputHandler.handleMouseDown);
    canvas.addEventListener('mouseup', inputHandler.handleMouseUp);
    
    // Touch events
    canvas.addEventListener('touchstart', inputHandler.handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', inputHandler.handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', inputHandler.handleTouchEnd);
    
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }, []);
  
  /**
   * Initialize WebGL context and simulation
   */
  const initializeSimulation = useCallback(async (): Promise<boolean> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas ref not available for fluid simulation');
      return false;
    }
    
    try {
      // Check if WebGL is supported
      const testContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!testContext) {
        console.error('WebGL not supported by this browser');
        return false;
      }
      
      // Set canvas size before initializing WebGL
      const rect = canvas.getBoundingClientRect();
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio));
      
      console.log('Initializing WebGL with canvas size:', canvas.width, 'x', canvas.height);
      
      // Initialize WebGL context
      const webglContext = new WebGLContextImpl();
      const success = webglContext.initialize(canvas);
      
      if (!success) {
        console.error('Failed to initialize WebGL context');
        return false;
      }
      
      // Check if context is valid after initialization
      if (webglContext.gl.isContextLost()) {
        console.error('WebGL context was lost during initialization');
        return false;
      }
      
      // Wait a frame to ensure context is stable
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      webglContextRef.current = webglContext;
      
      // Initialize shader manager and framebuffer manager
      const shaderManager = new ShaderManagerImpl(webglContext.gl);
      const framebufferManager = new FramebufferManagerImpl(webglContext.gl);
      
      // Initialize simulation step
      const simulation = new SimulationStepImpl(
        webglContext.gl,
        configRef.current,
        framebufferManager,
        shaderManager
      );
      simulationRef.current = simulation;
      
      // Initialize input handler with proper config structure
      const inputHandler = new InputHandlerImpl(canvas, configRef.current);
      inputHandlerRef.current = inputHandler;
      
      // Set up event listeners
      setupEventListeners(canvas, inputHandler);
      
      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error('Error initializing fluid simulation:', error);
      
      // Cleanup on error
      if (webglContextRef.current) {
        webglContextRef.current.cleanup();
        webglContextRef.current = null;
      }
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Framebuffer incomplete')) {
          console.error('WebGL framebuffer error - this may be due to device limitations or driver issues');
          console.error('Try refreshing the page or using a different browser');
        } else if (error.message.includes('WebGL')) {
          console.error('WebGL initialization failed - ensure your browser supports WebGL');
        } else if (error.message.includes('Shader')) {
          console.error('Shader compilation error:', error.message);
        }
      }
      
      return false;
    }
  }, [setupEventListeners]);
  
  /**
   * Stop animation loop
   */
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Animation loop using requestAnimationFrame
   */
  const animate = useCallback((currentTime: number) => {
    if (!simulationRef.current || !inputHandlerRef.current || !webglContextRef.current) {
      return;
    }
    
    // Check if WebGL context is still valid
    if (webglContextRef.current.gl.isContextLost()) {
      console.error('WebGL context lost during animation');
      stopAnimation();
      return;
    }
    
    // Calculate delta time
    const deltaTime = lastFrameTimeRef.current 
      ? (currentTime - lastFrameTimeRef.current) / 1000 
      : 1/60;
    lastFrameTimeRef.current = currentTime;
    
    // Limit frame rate if specified
    const targetFrameTime = 1000 / configRef.current.performance.frameRate;
    if (deltaTime * 1000 < targetFrameTime * 0.9) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    
    try {
      // Get input state
      const inputState = inputHandlerRef.current.getState();
      
      // Handle input if interaction is enabled
      if (configRef.current.interaction.enabled) {
        simulationRef.current.handleInput(
          inputState.x,
          inputState.y,
          inputState.dx,
          inputState.dy,
          inputState.down
        );
      }
      
      // Execute simulation step
      simulationRef.current.execute(Math.min(deltaTime, 1/30)); // Cap delta time
      
      frameCountRef.current++;
    } catch (error) {
      console.error('Error in simulation animation loop:', error);
      
      // If we get repeated errors, stop the animation to prevent spam
      if (error instanceof Error && error.message.includes('WebGL')) {
        console.error('WebGL error detected, stopping animation');
        stopAnimation();
        return;
      }
    }
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [stopAnimation]);
  
  /**
   * Start animation loop
   */
  const startAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    lastFrameTimeRef.current = 0;
    frameCountRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);
  
  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<FluidSimulationConfig>) => {
    const mergedConfig = mergeConfig(newConfig, configRef.current);
    configRef.current = mergedConfig;
    
    // Update simulation if initialized
    if (simulationRef.current && webglContextRef.current) {
      // Recreate simulation with new config
      simulationRef.current.cleanup();
      const shaderManager = new ShaderManagerImpl(webglContextRef.current.gl);
      const framebufferManager = new FramebufferManagerImpl(webglContextRef.current.gl);
      simulationRef.current = new SimulationStepImpl(
        webglContextRef.current.gl,
        configRef.current,
        framebufferManager,
        shaderManager
      );
    }
  }, []);
  
  /**
   * Handle canvas resize
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !webglContextRef.current || !simulationRef.current) {
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    const newWidth = rect.width * devicePixelRatio;
    const newHeight = rect.height * devicePixelRatio;
    
    // Only resize if dimensions actually changed
    if (canvas.width === newWidth && canvas.height === newHeight) {
      return;
    }
    
    // Update canvas size
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Update WebGL viewport
    webglContextRef.current.resize(canvas.width, canvas.height);
    
    // Update simulation
    simulationRef.current.resize(canvas.width, canvas.height);
  }, []);
  
  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    stopAnimation();
    
    if (simulationRef.current) {
      simulationRef.current.cleanup();
      simulationRef.current = null;
    }
    
    if (inputHandlerRef.current) {
      inputHandlerRef.current.cleanup();
      inputHandlerRef.current = null;
    }
    
    if (webglContextRef.current) {
      webglContextRef.current.cleanup();
      webglContextRef.current = null;
    }
    
    setIsInitialized(false);
  }, [stopAnimation]);
  
  // Initialize simulation when canvas is available
  useEffect(() => {
    if (canvasRef.current && !isInitialized) {
      initializeSimulation().then((success) => {
        if (success) {
          handleResize();
          startAnimation();
        }
      });
    }
    
    return cleanup;
  }, [initializeSimulation, handleResize, startAnimation, cleanup, isInitialized]);
  
  // Handle window resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  return {
    canvasRef,
    isInitialized,
    updateConfig
  };
};
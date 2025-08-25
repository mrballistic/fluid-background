import React, { useEffect, useMemo } from 'react';
import { FluidBackgroundProps, FluidSimulationConfig } from './types';
import { useFluidSimulation } from './hooks/useFluidSimulation';
import { useResponsive } from './hooks/useResponsive';
import { usePerformance, useReducedMotion } from './hooks/usePerformance';
import { mergeConfig, DEFAULT_CONFIG } from './utils/config';

/**
 * FluidBackground - Main React component for fluid simulation background
 * 
 * Provides an interactive fluid simulation that can be used as a background element.
 * Handles SSR gracefully and includes accessibility features.
 */
const FluidBackground: React.FC<FluidBackgroundProps> = ({
  colors,
  physics,
  performance,
  interaction,
  style,
  className,
  zIndex = -1,
  ...props
}) => {
  // Check for reduced motion preference
  const prefersReducedMotion = useReducedMotion();
  
  // Responsive behavior
  const { dimensions, devicePixelRatio } = useResponsive();
  
  // Performance monitoring
  const performanceHook = usePerformance(
    performance?.frameRate || DEFAULT_CONFIG.performance.frameRate
  );
  
  // Create simulation configuration
  const simulationConfig = useMemo((): FluidSimulationConfig => {
    const userConfig: Partial<FluidSimulationConfig> = {};
    
    // Handle colors
    if (colors) {
      userConfig.colors = {
        background: colors.background || DEFAULT_CONFIG.colors.background,
        fluid: colors.fluid || DEFAULT_CONFIG.colors.fluid
      };
    }
    
    // Handle physics
    if (physics) {
      userConfig.physics = {
        ...DEFAULT_CONFIG.physics,
        ...physics
      };
    }
    
    // Handle performance
    if (performance) {
      userConfig.performance = {
        ...DEFAULT_CONFIG.performance,
        ...performance
      };
    }
    
    // Handle interaction
    if (interaction) {
      userConfig.interaction = {
        ...DEFAULT_CONFIG.interaction,
        ...interaction
      };
    }
    
    // Disable interaction if reduced motion is preferred
    if (prefersReducedMotion) {
      userConfig.interaction = {
        ...DEFAULT_CONFIG.interaction,
        ...userConfig.interaction,
        enabled: false
      };
      userConfig.performance = {
        ...DEFAULT_CONFIG.performance,
        ...userConfig.performance,
        frameRate: 30 // Lower frame rate for reduced motion
      };
    }
    
    return mergeConfig(userConfig, DEFAULT_CONFIG);
  }, [colors, physics, performance, interaction, prefersReducedMotion]);
  
  // Initialize fluid simulation
  const { canvasRef, isInitialized, updateConfig } = useFluidSimulation(simulationConfig);
  
  // Update configuration when props change
  useEffect(() => {
    if (isInitialized) {
      updateConfig(simulationConfig);
    }
  }, [simulationConfig, isInitialized, updateConfig]);
  
  // Handle canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set display size
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    // Set actual canvas size based on device pixel ratio and performance
    const rect = canvas.getBoundingClientRect();
    let pixelRatio = devicePixelRatio;
    
    // Limit pixel ratio for performance
    if (performanceHook.shouldOptimize || simulationConfig.performance.resolution === 'low') {
      pixelRatio = Math.min(pixelRatio, 1);
    } else if (simulationConfig.performance.resolution === 'medium') {
      pixelRatio = Math.min(pixelRatio, 1.5);
    }
    
    canvas.width = Math.floor(rect.width * pixelRatio);
    canvas.height = Math.floor(rect.height * pixelRatio);
  }, [dimensions, devicePixelRatio, simulationConfig.performance.resolution, performanceHook.shouldOptimize, canvasRef]);
  
  // SSR handling - only render on client side
  if (typeof window === 'undefined') {
    return null;
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex,
        pointerEvents: (interaction?.enabled !== false && !prefersReducedMotion) ? 'auto' : 'none',
        overflow: 'hidden',
        // Ensure proper layering and performance
        willChange: 'auto',
        backfaceVisibility: 'hidden',
        perspective: 1000,
        ...style
      }}
      className={className}
      aria-hidden="true"
      role="presentation"
      aria-label={prefersReducedMotion ? "Static background decoration" : "Interactive fluid simulation background"}
      {...props}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none', // Prevent scrolling on touch
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          // Performance optimizations
          imageRendering: 'pixelated' as const,
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          WebkitPerspective: 1000,
          perspective: 1000,
          WebkitTransform: 'translate3d(0, 0, 0)',
          transform: 'translate3d(0, 0, 0)'
        }}
        aria-label={
          prefersReducedMotion 
            ? "Static background decoration" 
            : interaction?.enabled !== false 
              ? "Interactive fluid simulation background - move your mouse or touch to interact"
              : "Fluid simulation background animation"
        }
        aria-describedby={prefersReducedMotion ? undefined : "fluid-bg-description"}
      />
      {/* Hidden description for screen readers */}
      {!prefersReducedMotion && (
        <div
          id="fluid-bg-description"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }}
          aria-hidden="true"
        >
          This is an interactive fluid simulation background. 
          {interaction?.enabled !== false && 'Move your mouse cursor or touch the screen to create fluid effects. '}
          The animation respects your motion preferences and will be disabled if you prefer reduced motion.
        </div>
      )}
    </div>
  );
};

export default FluidBackground;
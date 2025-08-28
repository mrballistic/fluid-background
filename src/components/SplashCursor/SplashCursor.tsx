/**
 * SplashCursor React Component
 * 
 * A React component that creates a beautiful splash cursor effect with fluid trails
 * that follow the user's cursor movement. Features realistic physics, smooth visual
 * blending, and adaptive performance optimization.
 */

import React, { forwardRef, useMemo } from 'react';
import { useSplashCursor } from '../../hooks/useSplashCursor';
import type { SplashCursorProps } from '../../types/splash-cursor';

/**
 * Default props for the SplashCursor component
 */
const DEFAULT_PROPS: Required<Pick<SplashCursorProps, 'zIndex' | 'className'>> & Partial<SplashCursorProps> = {
  // Visual configuration
  intensity: 0.8,
  colors: {
    mode: 'rainbow',
    saturation: 80,
    lightness: 60,
    cycleSpeed: 1.0
  },
  particleCount: 150,
  
  // Physics configuration
  bounceEnabled: true,
  gravity: 0.01,
  drag: 0.997,
  
  // Performance configuration
  targetFPS: 60,
  pauseOnHidden: true,
  
  // Styling
  className: '',
  zIndex: 9999
};

/**
 * Validate props and provide warnings for invalid values
 */
const validateProps = (props: SplashCursorProps): void => {
  if (props.intensity !== undefined && (props.intensity < 0 || props.intensity > 1)) {
    console.warn('SplashCursor: intensity should be between 0 and 1');
  }
  
  if (props.particleCount !== undefined && (props.particleCount < 1 || props.particleCount > 500)) {
    console.warn('SplashCursor: particleCount should be between 1 and 500');
  }
  
  if (props.gravity !== undefined && (props.gravity < -1 || props.gravity > 1)) {
    console.warn('SplashCursor: gravity should be between -1 and 1');
  }
  
  if (props.drag !== undefined && (props.drag < 0 || props.drag > 1)) {
    console.warn('SplashCursor: drag should be between 0 and 1');
  }
  
  if (props.targetFPS !== undefined && (props.targetFPS < 10 || props.targetFPS > 120)) {
    console.warn('SplashCursor: targetFPS should be between 10 and 120');
  }
  
  if (props.zIndex !== undefined && props.zIndex < 0) {
    console.warn('SplashCursor: zIndex should be a positive number');
  }
  
  if (props.colors?.baseHue !== undefined && (props.colors.baseHue < 0 || props.colors.baseHue > 360)) {
    console.warn('SplashCursor: colors.baseHue should be between 0 and 360');
  }
  
  if (props.colors?.saturation !== undefined && (props.colors.saturation < 0 || props.colors.saturation > 100)) {
    console.warn('SplashCursor: colors.saturation should be between 0 and 100');
  }
  
  if (props.colors?.lightness !== undefined && (props.colors.lightness < 0 || props.colors.lightness > 100)) {
    console.warn('SplashCursor: colors.lightness should be between 0 and 100');
  }
  
  if (props.colors?.cycleSpeed !== undefined && (props.colors.cycleSpeed < 0.1 || props.colors.cycleSpeed > 5)) {
    console.warn('SplashCursor: colors.cycleSpeed should be between 0.1 and 5');
  }
};

/**
 * SplashCursor Component
 * 
 * Creates a full-screen canvas overlay that renders beautiful fluid trails
 * following the user's cursor movement.
 */
export const SplashCursor = forwardRef<HTMLCanvasElement, SplashCursorProps>(
  (props, ref) => {
    // Validate props in development (disabled for build compatibility)
    // validateProps(props);
    
    // Merge props with defaults
    const mergedProps = useMemo(() => ({
      ...DEFAULT_PROPS,
      ...props
    }), [props]);
    
    // Extract styling props
    const { className, style, zIndex, ...hookProps } = mergedProps;
    
    // Initialize splash cursor hook
    const { canvasRef, isActive, particleCount, fps } = useSplashCursor(hookProps);
    
    // Combine canvas styles
    const canvasStyle: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: zIndex,
      ...style
    };
    
    // Combine class names
    const canvasClassName = [
      'splash-cursor-canvas',
      className
    ].filter(Boolean).join(' ');
    
    return (
      <canvas
        ref={(element) => {
          // Set both the hook ref and the forwarded ref
          if (canvasRef.current !== element) {
            (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = element;
          }
          
          if (ref) {
            if (typeof ref === 'function') {
              ref(element);
            } else {
              ref.current = element;
            }
          }
        }}
        className={canvasClassName}
        style={canvasStyle}
        data-splash-cursor-active={isActive}
        data-particle-count={particleCount}
        data-fps={fps}
        data-testid="splash-cursor-canvas"
        aria-hidden="true"
        role="presentation"
      />
    );
  }
);

// Set display name for debugging
SplashCursor.displayName = 'SplashCursor';

export default SplashCursor;
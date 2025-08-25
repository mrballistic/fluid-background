/**
 * Responsive behavior hook for fluid simulation
 * Handles viewport size detection, canvas resizing, and device pixel ratio
 */

import { useState, useEffect, useCallback } from 'react';
import type { UseResponsiveReturn } from '../types';
import { detectMobileDevice } from '../utils/config';

/**
 * Hook for managing responsive behavior and canvas dimensions
 */
export const useResponsive = (): UseResponsiveReturn => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600
  });
  
  const [devicePixelRatio, setDevicePixelRatio] = useState(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  );
  
  /**
   * Update dimensions based on current viewport
   */
  const updateDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const newDimensions = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const newDevicePixelRatio = window.devicePixelRatio || 1;
    
    setDimensions(newDimensions);
    setDevicePixelRatio(newDevicePixelRatio);
  }, []);
  
  /**
   * Handle resize events with debouncing
   */
  const handleResize = useCallback(() => {
    // Use requestAnimationFrame to debounce resize events
    requestAnimationFrame(updateDimensions);
  }, [updateDimensions]);
  
  /**
   * Handle orientation change on mobile devices
   */
  const handleOrientationChange = useCallback(() => {
    // Delay to allow viewport to settle after orientation change
    setTimeout(updateDimensions, 100);
  }, [updateDimensions]);
  
  /**
   * Handle device pixel ratio changes (e.g., zoom, external monitor)
   */
  const handlePixelRatioChange = useCallback(() => {
    updateDimensions();
  }, [updateDimensions]);
  
  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initial update
    updateDimensions();
    
    // Resize event listener
    window.addEventListener('resize', handleResize);
    
    // Orientation change listener (mobile)
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Device pixel ratio change detection
    let mediaQuery: MediaQueryList | null = null;
    if (window.matchMedia) {
      mediaQuery = window.matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handlePixelRatioChange);
      } else if (mediaQuery.addListener) {
        // Fallback for older browsers
        mediaQuery.addListener(handlePixelRatioChange);
      }
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handlePixelRatioChange);
        } else if (mediaQuery.removeListener) {
          // Fallback for older browsers
          mediaQuery.removeListener(handlePixelRatioChange);
        }
      }
    };
  }, [handleResize, handleOrientationChange, handlePixelRatioChange, devicePixelRatio, updateDimensions]);
  
  return {
    dimensions,
    devicePixelRatio
  };
};

/**
 * Hook for calculating optimal canvas dimensions based on container and performance
 */
export const useCanvasDimensions = (
  containerRef: React.RefObject<HTMLElement>,
  resolutionMultiplier: number = 1
) => {
  const { devicePixelRatio } = useResponsive();
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 800,
    height: 600,
    displayWidth: 800,
    displayHeight: 600
  });
  
  /**
   * Update canvas dimensions based on container size
   */
  const updateCanvasDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const isMobile = detectMobileDevice();
    
    // Calculate display dimensions
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Calculate actual canvas dimensions with pixel ratio and resolution multiplier
    let pixelRatio = devicePixelRatio;
    
    // Limit pixel ratio on mobile to prevent performance issues
    if (isMobile && pixelRatio > 2) {
      pixelRatio = 2;
    }
    
    // Apply resolution multiplier for performance optimization
    const effectivePixelRatio = pixelRatio * resolutionMultiplier;
    
    const canvasWidth = Math.floor(displayWidth * effectivePixelRatio);
    const canvasHeight = Math.floor(displayHeight * effectivePixelRatio);
    
    setCanvasDimensions({
      width: canvasWidth,
      height: canvasHeight,
      displayWidth,
      displayHeight
    });
  }, [containerRef, devicePixelRatio, resolutionMultiplier]);
  
  // Update dimensions when dependencies change
  useEffect(() => {
    updateCanvasDimensions();
  }, [updateCanvasDimensions]);
  
  // Set up resize observer for container
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') {
      // Fallback to window resize if ResizeObserver is not available
      const handleResize = () => {
        requestAnimationFrame(updateCanvasDimensions);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateCanvasDimensions);
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, updateCanvasDimensions]);
  
  return canvasDimensions;
};

/**
 * Hook for detecting mobile device and screen characteristics
 */
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        orientation: 'landscape' as const,
        screenSize: 'large' as const
      };
    }
    
    const isMobile = detectMobileDevice();
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Determine device type
    const isTablet = hasTouch && Math.min(width, height) >= 768;
    const isDesktop = !isMobile && !isTablet;
    
    // Determine orientation
    const orientation = width > height ? 'landscape' : 'portrait';
    
    // Determine screen size category
    let screenSize: 'small' | 'medium' | 'large';
    if (Math.min(width, height) < 480) {
      screenSize = 'small';
    } else if (Math.min(width, height) < 768) {
      screenSize = 'medium';
    } else {
      screenSize = 'large';
    }
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      hasTouch,
      orientation,
      screenSize
    };
  });
  
  /**
   * Update device info on resize/orientation change
   */
  const updateDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = detectMobileDevice();
    const isTablet = hasTouch && Math.min(width, height) >= 768;
    const isDesktop = !isMobile && !isTablet;
    const orientation = width > height ? 'landscape' : 'portrait';
    
    let screenSize: 'small' | 'medium' | 'large';
    if (Math.min(width, height) < 480) {
      screenSize = 'small';
    } else if (Math.min(width, height) < 768) {
      screenSize = 'medium';
    } else {
      screenSize = 'large';
    }
    
    setDeviceInfo({
      isMobile,
      isTablet,
      isDesktop,
      hasTouch,
      orientation,
      screenSize
    });
  }, []);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleChange = () => {
      requestAnimationFrame(updateDeviceInfo);
    };
    
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);
    
    return () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, [updateDeviceInfo]);
  
  return deviceInfo;
};
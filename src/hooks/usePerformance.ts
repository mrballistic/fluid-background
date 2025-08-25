/**
 * Performance monitoring and optimization hook
 * Tracks frame rate, handles visibility-based pausing, and automatic quality adjustment
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UsePerformanceReturn } from '../types';

interface BatteryManager extends EventTarget {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  frameCount: number;
  droppedFrames: number;
}

/**
 * Hook for monitoring performance and automatic optimization
 */
export const usePerformance = (
  targetFps: number = 60,
  optimizationThreshold: number = 0.8
): UsePerformanceReturn => {
  const [fps, setFps] = useState(targetFps);
  const [isVisible, setIsVisible] = useState(true);
  const [shouldOptimize, setShouldOptimize] = useState(false);
  
  // Performance tracking refs
  const metricsRef = useRef<PerformanceMetrics>({
    fps: targetFps,
    frameTime: 1000 / targetFps,
    averageFps: targetFps,
    minFps: targetFps,
    maxFps: targetFps,
    frameCount: 0,
    droppedFrames: 0
  });
  
  const lastFrameTimeRef = useRef<number>(0);
  const frameTimesRef = useRef<number[]>([]);
  const performanceCheckIntervalRef = useRef<number | null>(null);
  
  /**
   * Calculate FPS from frame time
   */
  const calculateFps = useCallback((frameTime: number): number => {
    return frameTime > 0 ? 1000 / frameTime : 0;
  }, []);
  
  /**
   * Update performance metrics with new frame time
   */
  const updateMetrics = useCallback((currentTime: number) => {
    const metrics = metricsRef.current;
    
    if (lastFrameTimeRef.current === 0) {
      lastFrameTimeRef.current = currentTime;
      return;
    }
    
    const frameTime = currentTime - lastFrameTimeRef.current;
    const currentFps = calculateFps(frameTime);
    
    // Update frame times buffer (keep last 60 frames)
    frameTimesRef.current.push(frameTime);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }
    
    // Calculate average FPS over recent frames
    const averageFrameTime = frameTimesRef.current.reduce((sum, time) => sum + time, 0) / frameTimesRef.current.length;
    const averageFps = calculateFps(averageFrameTime);
    
    // Update metrics
    metrics.fps = currentFps;
    metrics.frameTime = frameTime;
    metrics.averageFps = averageFps;
    metrics.minFps = Math.min(metrics.minFps, currentFps);
    metrics.maxFps = Math.max(metrics.maxFps, currentFps);
    metrics.frameCount++;
    
    // Count dropped frames (frames that took longer than target)
    const targetFrameTime = 1000 / targetFps;
    if (frameTime > targetFrameTime * 1.5) {
      metrics.droppedFrames++;
    }
    
    // Update state
    setFps(Math.round(averageFps));
    
    lastFrameTimeRef.current = currentTime;
  }, [calculateFps, targetFps]);
  
  /**
   * Check if optimization is needed based on performance metrics
   */
  const checkOptimizationNeeded = useCallback(() => {
    const metrics = metricsRef.current;
    const targetFrameRate = targetFps * optimizationThreshold;
    
    // Check if average FPS is below threshold
    const isBelowThreshold = metrics.averageFps < targetFrameRate;
    
    // Check if there are too many dropped frames
    const droppedFrameRatio = metrics.droppedFrames / Math.max(metrics.frameCount, 1);
    const tooManyDroppedFrames = droppedFrameRatio > 0.1; // More than 10% dropped frames
    
    // Check for consistent low performance
    const recentFrames = frameTimesRef.current.slice(-30); // Last 30 frames
    const recentLowFrames = recentFrames.filter(time => calculateFps(time) < targetFrameRate).length;
    const consistentLowPerformance = recentLowFrames / recentFrames.length > 0.5;
    
    const needsOptimization = isBelowThreshold || tooManyDroppedFrames || consistentLowPerformance;
    setShouldOptimize(needsOptimization);
    
    return needsOptimization;
  }, [targetFps, optimizationThreshold, calculateFps]);
  
  /**
   * Reset performance metrics
   */
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      fps: targetFps,
      frameTime: 1000 / targetFps,
      averageFps: targetFps,
      minFps: targetFps,
      maxFps: targetFps,
      frameCount: 0,
      droppedFrames: 0
    };
    
    frameTimesRef.current = [];
    lastFrameTimeRef.current = 0;
    setFps(targetFps);
    setShouldOptimize(false);
  }, [targetFps]);
  
  /**
   * Handle visibility change
   */
  const handleVisibilityChange = useCallback(() => {
    const isCurrentlyVisible = !document.hidden;
    setIsVisible(isCurrentlyVisible);
    
    // Reset metrics when becoming visible again
    if (isCurrentlyVisible && !isVisible) {
      resetMetrics();
    }
  }, [isVisible, resetMetrics]);
  
  /**
   * Handle page focus/blur
   */
  const handleFocusChange = useCallback(() => {
    const isFocused = document.hasFocus();
    
    // Treat focus loss similar to visibility change
    if (!isFocused && isVisible) {
      setIsVisible(false);
    } else if (isFocused && !isVisible) {
      setIsVisible(true);
      resetMetrics();
    }
  }, [isVisible, resetMetrics]);
  
  // Set up visibility and performance monitoring
  useEffect(() => {
    // Initial visibility state
    setIsVisible(!document.hidden && document.hasFocus());
    
    // Visibility change listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocusChange);
    window.addEventListener('blur', handleFocusChange);
    
    // Performance check interval
    performanceCheckIntervalRef.current = window.setInterval(() => {
      if (isVisible && frameTimesRef.current.length > 10) {
        checkOptimizationNeeded();
      }
    }, 2000); // Check every 2 seconds
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocusChange);
      window.removeEventListener('blur', handleFocusChange);
      
      if (performanceCheckIntervalRef.current) {
        clearInterval(performanceCheckIntervalRef.current);
      }
    };
  }, [handleVisibilityChange, handleFocusChange, isVisible, checkOptimizationNeeded]);
  
  // Expose update function for external use
  const recordFrame = useCallback((timestamp?: number) => {
    const currentTime = timestamp || performance.now();
    updateMetrics(currentTime);
  }, [updateMetrics]);
  
  return {
    fps,
    isVisible,
    shouldOptimize,
    recordFrame,
    resetMetrics,
    getMetrics: () => ({ ...metricsRef.current })
  };
};

/**
 * Hook for automatic quality adjustment based on performance
 */
export const useAutoQuality = (
  initialQuality: number = 1.0,
  performanceHook: UsePerformanceReturn
) => {
  const [quality, setQuality] = useState(initialQuality);
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  const lastAdjustmentRef = useRef<number>(0);
  const adjustmentCooldownRef = useRef<number>(5000); // 5 second cooldown
  
  /**
   * Adjust quality based on performance
   */
  const adjustQuality = useCallback(() => {
    const now = Date.now();
    
    // Respect cooldown period
    if (now - lastAdjustmentRef.current < adjustmentCooldownRef.current) {
      return;
    }
    
    const metrics = performanceHook.getMetrics();
    const currentQuality = quality;
    let newQuality = currentQuality;
    
    if (performanceHook.shouldOptimize) {
      // Reduce quality if performance is poor
      if (metrics.averageFps < 30) {
        newQuality = Math.max(0.25, currentQuality - 0.25);
      } else if (metrics.averageFps < 45) {
        newQuality = Math.max(0.5, currentQuality - 0.125);
      }
    } else if (metrics.averageFps > 55 && currentQuality < initialQuality) {
      // Increase quality if performance is good and we're below initial quality
      newQuality = Math.min(initialQuality, currentQuality + 0.125);
    }
    
    if (newQuality !== currentQuality) {
      setIsAdjusting(true);
      setQuality(newQuality);
      lastAdjustmentRef.current = now;
      
      // Reset adjusting flag after a delay
      setTimeout(() => setIsAdjusting(false), 1000);
      
      console.log(`Quality adjusted: ${currentQuality.toFixed(2)} → ${newQuality.toFixed(2)} (FPS: ${metrics.averageFps.toFixed(1)})`);
    }
  }, [quality, initialQuality, performanceHook]);
  
  // Monitor performance and adjust quality
  useEffect(() => {
    const interval = setInterval(() => {
      if (performanceHook.isVisible) {
        adjustQuality();
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [adjustQuality, performanceHook.isVisible]);
  
  return {
    quality,
    isAdjusting,
    setQuality,
    resetQuality: () => setQuality(initialQuality)
  };
};

/**
 * Hook for detecting reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);
  
  return prefersReducedMotion;
};

/**
 * Hook for battery status monitoring (when available)
 */
export const useBatteryStatus = () => {
  const [batteryInfo, setBatteryInfo] = useState({
    charging: true,
    level: 1,
    chargingTime: 0,
    dischargingTime: Infinity
  });
  
  const [isLowBattery, setIsLowBattery] = useState(false);
  
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return;
    }
    
    // @ts-expect-error - getBattery is not in TypeScript definitions
    navigator.getBattery?.().then((battery: BatteryManager) => {
      const updateBatteryInfo = () => {
        const info = {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
        
        setBatteryInfo(info);
        setIsLowBattery(!info.charging && info.level < 0.2); // Low battery if < 20% and not charging
      };
      
      updateBatteryInfo();
      
      battery.addEventListener('chargingchange', updateBatteryInfo);
      battery.addEventListener('levelchange', updateBatteryInfo);
      battery.addEventListener('chargingtimechange', updateBatteryInfo);
      battery.addEventListener('dischargingtimechange', updateBatteryInfo);
      
      return () => {
        battery.removeEventListener('chargingchange', updateBatteryInfo);
        battery.removeEventListener('levelchange', updateBatteryInfo);
        battery.removeEventListener('chargingtimechange', updateBatteryInfo);
        battery.removeEventListener('dischargingtimechange', updateBatteryInfo);
      };
    }).catch(() => {
      // Battery API not supported or permission denied
    });
  }, []);
  
  return {
    ...batteryInfo,
    isLowBattery
  };
};
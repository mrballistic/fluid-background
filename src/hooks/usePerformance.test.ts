import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePerformance, useAutoQuality, useReducedMotion, useBatteryStatus } from './usePerformance';

// Mock performance.now
const mockPerformanceNow = vi.fn();
Object.defineProperty(window, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

// Mock document properties
Object.defineProperty(document, 'hidden', {
  value: false,
  writable: true,
});

Object.defineProperty(document, 'hasFocus', {
  value: vi.fn(() => true),
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('usePerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    
    // Reset document properties
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
    });
    
    (document.hasFocus as any).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Frame Rate Monitoring', () => {
    it('should initialize with target FPS', () => {
      const { result } = renderHook(() => usePerformance(60));
      
      expect(result.current.fps).toBe(60);
      expect(result.current.isVisible).toBe(true);
      expect(result.current.shouldOptimize).toBe(false);
    });

    it('should calculate FPS correctly from frame times', () => {
      const { result } = renderHook(() => usePerformance(60));
      
      // Simulate 60 FPS (16.67ms per frame)
      mockPerformanceNow.mockReturnValueOnce(0);
      act(() => {
        result.current.recordFrame(0);
      });
      
      mockPerformanceNow.mockReturnValueOnce(16.67);
      act(() => {
        result.current.recordFrame(16.67);
      });
      
      // Should maintain close to 60 FPS
      expect(result.current.fps).toBeCloseTo(60, 0);
    });

    it('should track performance metrics correctly', () => {
      const { result } = renderHook(() => usePerformance(60));
      
      // Record several frames
      const frameTimes = [0, 16.67, 33.33, 50, 66.67];
      frameTimes.forEach((time, _index) => {
        mockPerformanceNow.mockReturnValueOnce(time);
        act(() => {
          result.current.recordFrame(time);
        });
      });
      
      const metrics = result.current.getMetrics();
      expect(metrics.frameCount).toBe(frameTimes.length - 1); // First frame doesn't count
      expect(metrics.averageFps).toBeGreaterThan(0);
    });

    it('should detect dropped frames', () => {
      const { result } = renderHook(() => usePerformance(60));
      
      // Simulate dropped frames (longer than 25ms for 60fps target)
      const frameTimes = [0, 16.67, 50, 100]; // 50ms and 100ms are dropped frames
      frameTimes.forEach(time => {
        mockPerformanceNow.mockReturnValueOnce(time);
        act(() => {
          result.current.recordFrame(time);
        });
      });
      
      const metrics = result.current.getMetrics();
      expect(metrics.droppedFrames).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    it('should trigger optimization when FPS drops below threshold', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => usePerformance(60, 0.8)); // 80% threshold = 48 FPS
      
      // Simulate consistently low FPS (30 FPS = 33.33ms per frame)
      const lowFpsFrames = Array.from({ length: 35 }, (_, i) => i * 33.33);
      lowFpsFrames.forEach(time => {
        mockPerformanceNow.mockReturnValueOnce(time);
        act(() => {
          result.current.recordFrame(time);
        });
      });
      
      // Wait for performance check interval
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(result.current.shouldOptimize).toBe(true);
      
      vi.useRealTimers();
    });

    it('should not optimize when performance is good', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => usePerformance(60, 0.8));
      
      // Simulate good FPS (60 FPS = 16.67ms per frame)
      const goodFpsFrames = Array.from({ length: 35 }, (_, i) => i * 16.67);
      goodFpsFrames.forEach(time => {
        mockPerformanceNow.mockReturnValueOnce(time);
        act(() => {
          result.current.recordFrame(time);
        });
      });
      
      // Wait for performance check interval
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(result.current.shouldOptimize).toBe(false);
      
      vi.useRealTimers();
    });

    it('should reset metrics correctly', () => {
      const { result } = renderHook(() => usePerformance(60));
      
      // Record some frames
      act(() => {
        result.current.recordFrame(0);
        result.current.recordFrame(16.67);
        result.current.recordFrame(33.33);
      });
      
      // Reset metrics
      act(() => {
        result.current.resetMetrics();
      });
      
      const metrics = result.current.getMetrics();
      expect(metrics.frameCount).toBe(0);
      expect(metrics.droppedFrames).toBe(0);
      expect(result.current.fps).toBe(60);
      expect(result.current.shouldOptimize).toBe(false);
    });
  });

  describe('Visibility-based Animation Pausing', () => {
    it('should detect when page becomes hidden', () => {
      const { result } = renderHook(() => usePerformance(60));
      
      expect(result.current.isVisible).toBe(true);
      
      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });
      
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      expect(result.current.isVisible).toBe(false);
    });

    it('should detect when page loses focus', () => {
      const { result } = renderHook(() => usePerformance(60));
      
      expect(result.current.isVisible).toBe(true);
      
      // Simulate page losing focus
      (document.hasFocus as jest.Mock).mockReturnValue(false);
      
      act(() => {
        window.dispatchEvent(new Event('blur'));
      });
      
      expect(result.current.isVisible).toBe(false);
    });

    it('should reset metrics when becoming visible again', () => {
      const { result } = renderHook(() => usePerformance(60));
      
      // Record some frames first
      act(() => {
        result.current.recordFrame(0);
        result.current.recordFrame(16.67);
      });
      
      // Make page hidden
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });
      
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      // Make page visible again
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
      });
      
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      // Metrics should be reset
      const metrics = result.current.getMetrics();
      expect(metrics.frameCount).toBe(0);
      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const windowRemoveEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => usePerformance(60));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    });
  });
});

describe('useAutoQuality', () => {
  let mockPerformanceHook: any;

  beforeEach(() => {
    mockPerformanceHook = {
      fps: 60,
      isVisible: true,
      shouldOptimize: false,
      getMetrics: vi.fn(() => ({
        fps: 60,
        frameTime: 16.67,
        averageFps: 60,
        minFps: 60,
        maxFps: 60,
        frameCount: 100,
        droppedFrames: 0
      }))
    };
  });

  it('should initialize with initial quality', () => {
    const { result } = renderHook(() => useAutoQuality(1.0, mockPerformanceHook));
    
    expect(result.current.quality).toBe(1.0);
    expect(result.current.isAdjusting).toBe(false);
  });

  it('should reduce quality when performance is poor', async () => {
    vi.useFakeTimers();
    
    mockPerformanceHook.shouldOptimize = true;
    mockPerformanceHook.getMetrics.mockReturnValue({
      fps: 25,
      frameTime: 40,
      averageFps: 25,
      minFps: 20,
      maxFps: 30,
      frameCount: 100,
      droppedFrames: 20
    });
    
    const { result } = renderHook(() => useAutoQuality(1.0, mockPerformanceHook));
    
    // Wait for quality adjustment interval
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(result.current.quality).toBeLessThan(1.0);
    
    vi.useRealTimers();
  });

  it('should increase quality when performance improves', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useAutoQuality(1.0, mockPerformanceHook));
    
    // Start with reduced quality
    act(() => {
      result.current.setQuality(0.5);
    });
    
    // Set good performance metrics
    mockPerformanceHook.shouldOptimize = false;
    mockPerformanceHook.getMetrics.mockReturnValue({
      fps: 58,
      frameTime: 17.2,
      averageFps: 58,
      minFps: 55,
      maxFps: 60,
      frameCount: 100,
      droppedFrames: 1
    });
    
    // Wait for quality adjustment interval
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(result.current.quality).toBeGreaterThan(0.5);
    
    vi.useRealTimers();
  });

  it('should respect cooldown period between adjustments', async () => {
    vi.useFakeTimers();
    
    mockPerformanceHook.shouldOptimize = true;
    mockPerformanceHook.getMetrics.mockReturnValue({
      fps: 25,
      frameTime: 40,
      averageFps: 25,
      minFps: 20,
      maxFps: 30,
      frameCount: 100,
      droppedFrames: 20
    });
    
    const { result } = renderHook(() => useAutoQuality(1.0, mockPerformanceHook));
    
    const initialQuality = result.current.quality;
    
    // First adjustment
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    const firstAdjustment = result.current.quality;
    expect(firstAdjustment).toBeLessThan(initialQuality);
    
    // Try to adjust again immediately (should be blocked by cooldown)
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(result.current.quality).toBe(firstAdjustment);
    
    vi.useRealTimers();
  });

  it('should reset quality to initial value', () => {
    const { result } = renderHook(() => useAutoQuality(1.0, mockPerformanceHook));
    
    act(() => {
      result.current.setQuality(0.5);
    });
    
    expect(result.current.quality).toBe(0.5);
    
    act(() => {
      result.current.resetQuality();
    });
    
    expect(result.current.quality).toBe(1.0);
  });
});

describe('useReducedMotion', () => {
  it('should detect reduced motion preference', () => {
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
    
    const { result } = renderHook(() => useReducedMotion());
    
    expect(result.current).toBe(true);
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should handle media query changes', () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;
    
    const mockMatchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
    
    const { result } = renderHook(() => useReducedMotion());
    
    expect(result.current).toBe(false);
    
    // Simulate media query change
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: true } as MediaQueryListEvent);
      });
    }
    
    expect(result.current).toBe(true);
  });

  it('should handle browsers without matchMedia', () => {
    const originalMatchMedia = window.matchMedia;
    
    // @ts-expect-error - intentionally setting to undefined
    delete window.matchMedia;
    
    const { result } = renderHook(() => useReducedMotion());
    
    expect(result.current).toBe(false);
    
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
  });
});

describe('useBatteryStatus', () => {
  it('should handle browsers without battery API', () => {
    Object.defineProperty(navigator, 'getBattery', {
      writable: true,
      value: undefined,
    });
    
    const { result } = renderHook(() => useBatteryStatus());
    
    expect(result.current.charging).toBe(true);
    expect(result.current.level).toBe(1);
    expect(result.current.isLowBattery).toBe(false);
  });

  it('should detect low battery status', async () => {
    const mockBattery = {
      charging: false,
      level: 0.15, // 15% battery
      chargingTime: 0,
      dischargingTime: 3600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    Object.defineProperty(navigator, 'getBattery', {
      writable: true,
      value: vi.fn().mockResolvedValue(mockBattery),
    });
    
    const { result } = renderHook(() => useBatteryStatus());
    
    // Wait for the battery promise to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.charging).toBe(false);
    expect(result.current.level).toBe(0.15);
    expect(result.current.isLowBattery).toBe(true);
  });

  it('should not show low battery when charging', async () => {
    const mockBattery = {
      charging: true,
      level: 0.15, // 15% battery but charging
      chargingTime: 1800,
      dischargingTime: Infinity,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    Object.defineProperty(navigator, 'getBattery', {
      writable: true,
      value: vi.fn().mockResolvedValue(mockBattery),
    });
    
    const { result } = renderHook(() => useBatteryStatus());
    
    // Wait for the battery promise to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.charging).toBe(true);
    expect(result.current.level).toBe(0.15);
    expect(result.current.isLowBattery).toBe(false);
  });

  it('should handle battery API errors gracefully', async () => {
    Object.defineProperty(navigator, 'getBattery', {
      writable: true,
      value: vi.fn().mockRejectedValue(new Error('Battery API not supported')),
    });
    
    const { result } = renderHook(() => useBatteryStatus());
    
    // Should not throw and should use default values
    expect(result.current.charging).toBe(true);
    expect(result.current.level).toBe(1);
    expect(result.current.isLowBattery).toBe(false);
  });
});
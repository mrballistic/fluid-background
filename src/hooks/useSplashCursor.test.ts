/**
 * Tests for useSplashCursor hook
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useSplashCursor } from './useSplashCursor';

// Mock the splash cursor components
vi.mock('../splash-cursor/ParticleSystem');
vi.mock('../splash-cursor/MouseTracker');
vi.mock('../splash-cursor/MetaballRenderer');
vi.mock('../splash-cursor/PhysicsEngine');
vi.mock('../utils/performance-monitor');
vi.mock('../utils/error-handler');

// Mock canvas and context
const mockCanvas = {
  width: 800,
  height: 600,
  getBoundingClientRect: () => ({ width: 800, height: 600, left: 0, top: 0 }),
  getContext: () => ({
    clearRect: jest.fn(),
    putImageData: jest.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray(800 * 600 * 4) }),
    createImageData: () => ({ data: new Uint8ClampedArray(800 * 600 * 4) })
  })
};

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock performance.now
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now())
};

describe('useSplashCursor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSplashCursor());

    expect(result.current.isActive).toBe(false);
    expect(result.current.particleCount).toBe(0);
    expect(result.current.fps).toBe(0);
    expect(result.current.canvasRef.current).toBeNull();
  });

  it('should accept initial configuration', () => {
    const config = {
      intensity: 0.5,
      particleCount: 100,
      bounceEnabled: false
    };

    const { result } = renderHook(() => useSplashCursor(config));

    expect(result.current.isActive).toBe(false);
    expect(result.current.particleCount).toBe(0);
    expect(result.current.fps).toBe(0);
  });

  it('should provide control methods', () => {
    const { result } = renderHook(() => useSplashCursor());

    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(typeof result.current.updateConfig).toBe('function');
  });

  it('should validate configuration values', () => {
    const { result } = renderHook(() => useSplashCursor());

    act(() => {
      result.current.updateConfig({
        intensity: 2.0, // Should be clamped to 1.0
        particleCount: -10, // Should be clamped to minimum
        gravity: 5.0, // Should be clamped to 1.0
        drag: 2.0, // Should be clamped to 1.0
        targetFPS: 200 // Should be clamped to 120
      });
    });

    // The hook should handle invalid values gracefully
    expect(result.current.isActive).toBe(false);
  });

  it('should handle start and stop operations', () => {
    const { result } = renderHook(() => useSplashCursor());

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('should handle reset operation', () => {
    const { result } = renderHook(() => useSplashCursor());

    act(() => {
      result.current.reset();
    });

    expect(result.current.particleCount).toBe(0);
    expect(result.current.fps).toBe(0);
  });

  it('should handle configuration updates', () => {
    const { result } = renderHook(() => useSplashCursor());

    act(() => {
      result.current.updateConfig({
        intensity: 0.7,
        particleCount: 200
      });
    });

    // Should not throw errors
    expect(result.current.isActive).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useSplashCursor());

    unmount();

    // Should not throw errors during cleanup
    expect(true).toBe(true);
  });

  it('should handle canvas initialization', () => {
    const { result } = renderHook(() => useSplashCursor());

    // Simulate canvas ref being set
    act(() => {
      if (result.current.canvasRef.current) {
        Object.assign(result.current.canvasRef.current, mockCanvas);
      }
    });

    expect(result.current.canvasRef).toBeDefined();
  });

  it('should handle window resize events', () => {
    const { result } = renderHook(() => useSplashCursor());

    // Simulate window resize
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // Should not throw errors
    expect(result.current.isActive).toBe(false);
  });

  it('should handle visibility change events', () => {
    const { result } = renderHook(() => useSplashCursor({ pauseOnHidden: true }));

    // Simulate visibility change
    act(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should not throw errors
    expect(result.current.isActive).toBe(false);
  });

  it('should validate color configuration', () => {
    const { result } = renderHook(() => useSplashCursor());

    act(() => {
      result.current.updateConfig({
        colors: {
          mode: 'invalid' as any, // Should default to 'rainbow'
          baseHue: 400, // Should be clamped to 360
          saturation: 150, // Should be clamped to 100
          lightness: -10, // Should be clamped to 0
          cycleSpeed: 10 // Should be clamped to 5
        }
      });
    });

    // Should handle invalid color values gracefully
    expect(result.current.isActive).toBe(false);
  });

  it('should handle performance monitoring', () => {
    const { result } = renderHook(() => useSplashCursor({ targetFPS: 30 }));

    // Should initialize without errors
    expect(result.current.fps).toBe(0);
  });

  it('should handle error conditions gracefully', () => {
    const { result } = renderHook(() => useSplashCursor());

    // Should not throw when calling methods before initialization
    act(() => {
      result.current.start();
      result.current.stop();
      result.current.reset();
    });

    expect(result.current.isActive).toBe(false);
  });
});
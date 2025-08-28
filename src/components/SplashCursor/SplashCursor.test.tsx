/**
 * Tests for SplashCursor React component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SplashCursor } from './SplashCursor';
import type { SplashCursorProps } from '../../types/splash-cursor';
import { useSplashCursor } from '../../hooks/useSplashCursor';

// Mock the useSplashCursor hook
vi.mock('../../hooks/useSplashCursor', () => ({
  useSplashCursor: vi.fn()
}));

// Mock canvas context
const mockCanvasContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  }))
};

// Mock HTMLCanvasElement.getContext
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => mockCanvasContext),
  writable: true
});

// Mock getBoundingClientRect
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    width: 1920,
    height: 1080,
    top: 0,
    left: 0,
    right: 1920,
    bottom: 1080,
    x: 0,
    y: 0
  })),
  writable: true
});

describe('SplashCursor Component', () => {
  const mockCanvasRef = { current: null };
  const defaultHookReturn = {
    canvasRef: mockCanvasRef,
    isActive: true,
    particleCount: 150,
    fps: 60,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    updateConfig: vi.fn()
  };

  beforeEach(() => {
    vi.mocked(useSplashCursor).mockReturnValue(defaultHookReturn);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render a canvas element', () => {
      render(<SplashCursor />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('should apply default props correctly', () => {
      render(<SplashCursor />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      
      // Check default styling
      expect(canvas).toHaveStyle({
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: '9999'
      });
      
      // Check default class
      expect(canvas).toHaveClass('splash-cursor-canvas');
      
      // Check accessibility attributes
      expect(canvas).toHaveAttribute('aria-hidden', 'true');
      expect(canvas).toHaveAttribute('role', 'presentation');
    });

    it('should pass correct config to useSplashCursor hook', () => {
      const props: SplashCursorProps = {
        intensity: 0.5,
        particleCount: 100,
        bounceEnabled: false,
        gravity: 0.02,
        drag: 0.99,
        targetFPS: 30,
        pauseOnHidden: false,
        colors: {
          mode: 'single',
          baseHue: 180,
          saturation: 90,
          lightness: 50,
          cycleSpeed: 2.0
        }
      };
      
      render(<SplashCursor {...props} />);
      
      expect(useSplashCursor).toHaveBeenCalledWith(
        expect.objectContaining({
          intensity: 0.5,
          particleCount: 100,
          bounceEnabled: false,
          gravity: 0.02,
          drag: 0.99,
          targetFPS: 30,
          pauseOnHidden: false,
          colors: {
            mode: 'single',
            baseHue: 180,
            saturation: 90,
            lightness: 50,
            cycleSpeed: 2.0
          }
        })
      );
    });
  });

  describe('Styling and Positioning', () => {
    it('should apply custom className', () => {
      render(<SplashCursor className="custom-splash" />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveClass('splash-cursor-canvas', 'custom-splash');
    });

    it('should apply custom styles', () => {
      const customStyle = {
        opacity: 0.8,
        filter: 'blur(1px)',
        backgroundColor: 'rgba(255, 0, 0, 0.1)'
      };
      
      render(<SplashCursor style={customStyle} />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveStyle(customStyle);
    });

    it('should apply custom zIndex', () => {
      render(<SplashCursor zIndex={5000} />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveStyle({ zIndex: '5000' });
    });

    it('should maintain fixed positioning for full-screen overlay', () => {
      render(<SplashCursor />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveStyle({
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh'
      });
    });

    it('should have pointer-events none for cursor interaction', () => {
      render(<SplashCursor />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveStyle({ pointerEvents: 'none' });
    });
  });

  describe('Data Attributes', () => {
    it('should set data attributes based on hook state', () => {
      const hookReturn = {
        ...defaultHookReturn,
        isActive: true,
        particleCount: 75,
        fps: 45
      };
      vi.mocked(useSplashCursor).mockReturnValue(hookReturn);
      
      render(<SplashCursor />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveAttribute('data-splash-cursor-active', 'true');
      expect(canvas).toHaveAttribute('data-particle-count', '75');
      expect(canvas).toHaveAttribute('data-fps', '45');
    });

    it('should update data attributes when hook state changes', () => {
      const { rerender } = render(<SplashCursor />);
      
      // Update hook return value
      const updatedHookReturn = {
        ...defaultHookReturn,
        isActive: false,
        particleCount: 0,
        fps: 0
      };
      vi.mocked(useSplashCursor).mockReturnValue(updatedHookReturn);
      
      rerender(<SplashCursor />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveAttribute('data-splash-cursor-active', 'false');
      expect(canvas).toHaveAttribute('data-particle-count', '0');
      expect(canvas).toHaveAttribute('data-fps', '0');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to canvas element', () => {
      const ref = React.createRef<HTMLCanvasElement>();
      render(<SplashCursor ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLCanvasElement);
      expect(ref.current?.tagName).toBe('CANVAS');
    });

    it('should work with callback refs', () => {
      let refElement: HTMLCanvasElement | null = null;
      const callbackRef = (element: HTMLCanvasElement | null) => {
        refElement = element;
      };
      
      render(<SplashCursor ref={callbackRef} />);
      
      expect(refElement).toBeInstanceOf(HTMLCanvasElement);
      expect(refElement?.tagName).toBe('CANVAS');
    });

    it('should set both hook ref and forwarded ref', () => {
      const forwardedRef = React.createRef<HTMLCanvasElement>();
      render(<SplashCursor ref={forwardedRef} />);
      
      // Both refs should point to the same element
      expect(forwardedRef.current).toBe(mockCanvasRef.current);
    });
  });

  describe('Props Validation', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Set NODE_ENV to development for validation
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      process.env.NODE_ENV = 'test';
    });

    it('should warn for invalid intensity values', () => {
      render(<SplashCursor intensity={-0.5} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: intensity should be between 0 and 1');
      
      render(<SplashCursor intensity={1.5} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: intensity should be between 0 and 1');
    });

    it('should warn for invalid particleCount values', () => {
      render(<SplashCursor particleCount={0} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: particleCount should be between 1 and 500');
      
      render(<SplashCursor particleCount={600} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: particleCount should be between 1 and 500');
    });

    it('should warn for invalid gravity values', () => {
      render(<SplashCursor gravity={-2} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: gravity should be between -1 and 1');
      
      render(<SplashCursor gravity={2} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: gravity should be between -1 and 1');
    });

    it('should warn for invalid drag values', () => {
      render(<SplashCursor drag={-0.1} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: drag should be between 0 and 1');
      
      render(<SplashCursor drag={1.1} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: drag should be between 0 and 1');
    });

    it('should warn for invalid targetFPS values', () => {
      render(<SplashCursor targetFPS={5} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: targetFPS should be between 10 and 120');
      
      render(<SplashCursor targetFPS={150} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: targetFPS should be between 10 and 120');
    });

    it('should warn for invalid zIndex values', () => {
      render(<SplashCursor zIndex={-100} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: zIndex should be a positive number');
    });

    it('should warn for invalid color configuration values', () => {
      render(<SplashCursor colors={{ mode: 'single', baseHue: -10 }} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: colors.baseHue should be between 0 and 360');
      
      render(<SplashCursor colors={{ mode: 'single', baseHue: 400 }} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: colors.baseHue should be between 0 and 360');
      
      render(<SplashCursor colors={{ mode: 'single', saturation: -10 }} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: colors.saturation should be between 0 and 100');
      
      render(<SplashCursor colors={{ mode: 'single', saturation: 150 }} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: colors.saturation should be between 0 and 100');
      
      render(<SplashCursor colors={{ mode: 'single', lightness: -10 }} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: colors.lightness should be between 0 and 100');
      
      render(<SplashCursor colors={{ mode: 'single', lightness: 150 }} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: colors.lightness should be between 0 and 100');
      
      render(<SplashCursor colors={{ mode: 'single', cycleSpeed: 0.05 }} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: colors.cycleSpeed should be between 0.1 and 5');
      
      render(<SplashCursor colors={{ mode: 'single', cycleSpeed: 10 }} />);
      expect(consoleSpy).toHaveBeenCalledWith('SplashCursor: colors.cycleSpeed should be between 0.1 and 5');
    });

    it('should not validate props in production', () => {
      process.env.NODE_ENV = 'production';
      
      render(<SplashCursor intensity={-0.5} />);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Component Updates', () => {
    it('should re-render when props change', () => {
      const { rerender } = render(<SplashCursor intensity={0.5} />);
      
      expect(useSplashCursor).toHaveBeenCalledWith(
        expect.objectContaining({ intensity: 0.5 })
      );
      
      rerender(<SplashCursor intensity={0.8} />);
      
      expect(useSplashCursor).toHaveBeenCalledWith(
        expect.objectContaining({ intensity: 0.8 })
      );
    });

    it('should memoize props to prevent unnecessary re-renders', () => {
      const props = { intensity: 0.5, particleCount: 100 };
      const { rerender } = render(<SplashCursor {...props} />);
      
      // Clear previous calls
      vi.mocked(useSplashCursor).mockClear();
      
      // Re-render with same props
      rerender(<SplashCursor {...props} />);
      
      // Hook should be called again but with memoized props
      expect(useSplashCursor).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SplashCursor />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveAttribute('aria-hidden', 'true');
      expect(canvas).toHaveAttribute('role', 'presentation');
    });

    it('should not interfere with pointer events', () => {
      render(<SplashCursor />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveStyle({ pointerEvents: 'none' });
    });
  });

  describe('Error Handling', () => {
    it('should handle hook errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock hook to throw error
      vi.mocked(useSplashCursor).mockImplementation(() => {
        throw new Error('Hook initialization failed');
      });
      
      expect(() => render(<SplashCursor />)).toThrow('Hook initialization failed');
      
      consoleSpy.mockRestore();
    });

    it('should render with inactive state when hook fails', () => {
      const inactiveHookReturn = {
        ...defaultHookReturn,
        isActive: false,
        particleCount: 0,
        fps: 0
      };
      vi.mocked(useSplashCursor).mockReturnValue(inactiveHookReturn);
      
      render(<SplashCursor />);
      
      const canvas = screen.getByTestId('splash-cursor-canvas');
      expect(canvas).toHaveAttribute('data-splash-cursor-active', 'false');
      expect(canvas).toHaveAttribute('data-particle-count', '0');
      expect(canvas).toHaveAttribute('data-fps', '0');
    });
  });
});
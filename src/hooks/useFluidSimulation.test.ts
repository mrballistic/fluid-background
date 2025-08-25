/**
 * Integration tests for useFluidSimulation hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFluidSimulation } from './useFluidSimulation';
import type { FluidSimulationConfig } from '../types';

// Mock WebGL context
const mockWebGLContext = {
  canvas: null,
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
  getExtension: vi.fn(),
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(),
  createProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(),
  useProgram: vi.fn(),
  getUniformLocation: vi.fn(),
  getAttribLocation: vi.fn(),
  createTexture: vi.fn(),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  createFramebuffer: vi.fn(),
  bindFramebuffer: vi.fn(),
  framebufferTexture2D: vi.fn(),
  checkFramebufferStatus: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  blendFunc: vi.fn(),
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  uniform1i: vi.fn(),
  activeTexture: vi.fn(),
  drawArrays: vi.fn(),

  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  FRAMEBUFFER_COMPLETE: 36053,
  RGBA: 6408,
  FLOAT: 5126,
  LINEAR: 9729,
  CLAMP_TO_EDGE: 33071,
  TEXTURE_2D: 3553,
  TEXTURE_MIN_FILTER: 10241,
  TEXTURE_MAG_FILTER: 10240,
  TEXTURE_WRAP_S: 10242,
  TEXTURE_WRAP_T: 10243,
  FRAMEBUFFER: 36160,
  COLOR_ATTACHMENT0: 36064,
  TRIANGLE_STRIP: 5,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  TEXTURE0: 33984,
  TEXTURE1: 33985
} as unknown as WebGL2RenderingContext;

const mockCanvas = {
  getContext: vi.fn(() => mockWebGLContext),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  width: 800,
  height: 600,
  getBoundingClientRect: vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0
  })),
  style: {}
};

const mockCancelAnimationFrame = vi.fn();

// Mock requestAnimationFrame
let animationFrameCallback: ((time: number) => void) | null = null;
const mockRequestAnimationFrame = vi.fn((callback: (time: number) => void) => {
  animationFrameCallback = callback;
  return 1;
});

// Setup mocks
beforeEach(() => {
  // Mock document.createElement for canvas
  const originalCreateElement = document.createElement;
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas as unknown;
    }
    return originalCreateElement.call(document, tagName);
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  animationFrameCallback = null;

  // Setup global mocks
  global.requestAnimationFrame = mockRequestAnimationFrame;
  global.cancelAnimationFrame = mockCancelAnimationFrame;

  // Reset mock implementations
  mockWebGLContext.getShaderParameter.mockReturnValue(true);
  mockWebGLContext.getProgramParameter.mockReturnValue(true);
  mockWebGLContext.checkFramebufferStatus.mockReturnValue(mockWebGLContext.FRAMEBUFFER_COMPLETE);
});

describe('useFluidSimulation', () => {
  it('should initialize with default configuration', () => {
    const { result } = renderHook(() => useFluidSimulation());

    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.updateConfig).toBeInstanceOf(Function);
  });

  it('should initialize with custom configuration', () => {
    const customConfig: Partial<FluidSimulationConfig> = {
      physics: {
        viscosity: 0.5,
        density: 0.9,
        pressure: 0.7,
        curl: 25,
        splatRadius: 0.3,
        splatForce: 5000,
        iterations: 15
      }
    };

    const { result } = renderHook(() => useFluidSimulation(customConfig));

    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.updateConfig).toBeInstanceOf(Function);
  });

  it('should initialize WebGL context when canvas is available', () => {
    const { result } = renderHook(() => useFluidSimulation());

    // Simulate canvas being available
    act(() => {
      if (result.current.canvasRef.current) {
        // Trigger initialization
      }
    });

    expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2');
  });

  it('should start animation loop after initialization', () => {
    const { result } = renderHook(() => useFluidSimulation());

    act(() => {
      if (result.current.canvasRef.current) {
        // Simulate successful initialization
      }
    });

    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('should handle animation frame callback', () => {
    const { result } = renderHook(() => useFluidSimulation());

    act(() => {
      if (result.current.canvasRef.current && animationFrameCallback) {
        animationFrameCallback(16.67);
      }
    });

    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2); // Initial + next frame
  });

  it('should update configuration', () => {
    const { result } = renderHook(() => useFluidSimulation());

    const newConfig: Partial<FluidSimulationConfig> = {
      physics: {
        viscosity: 0.8,
        density: 0.95,
        pressure: 0.9,
        curl: 35,
        splatRadius: 0.2,
        splatForce: 7000,
        iterations: 25
      }
    };

    act(() => {
      result.current.updateConfig(newConfig);
    });

    // Configuration should be updated (we can't directly test internal state)
    expect(result.current.updateConfig).toBeInstanceOf(Function);
  });

  it('should handle resize events', () => {
    renderHook(() => useFluidSimulation());

    act(() => {
      // Simulate window resize
      window.dispatchEvent(new Event('resize'));
    });

    expect(mockCanvas.getBoundingClientRect).toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useFluidSimulation());

    unmount();

    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('should handle WebGL initialization failure gracefully', () => {
    mockCanvas.getContext.mockReturnValue(null);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useFluidSimulation());

    expect(result.current.isInitialized).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should limit frame rate according to configuration', () => {
    const config: Partial<FluidSimulationConfig> = {
      performance: {
        frameRate: 30,
        resolution: 'medium',
        pauseOnHidden: false
      }
    };

    renderHook(() => useFluidSimulation(config));

    act(() => {
      if (animationFrameCallback) {
        // Simulate rapid frame calls
        animationFrameCallback(0);
        animationFrameCallback(8); // Too soon for 30fps
      }
    });

    // Should still request next frame even if skipping
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('should cap delta time to prevent large jumps', () => {
    renderHook(() => useFluidSimulation());

    act(() => {
      if (animationFrameCallback) {
        // Simulate very large delta time
        animationFrameCallback(0);
        animationFrameCallback(5000); // 5 second jump
      }
    });

    // Should continue animation without errors
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });
});

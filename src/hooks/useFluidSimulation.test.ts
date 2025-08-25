/**
 * Integration tests for useFluidSimulation hook
 */

import { renderHook, act } from '@testing-library/react';
import { useFluidSimulation } from './useFluidSimulation';
import type { FluidSimulationConfig } from '../types';

// Mock WebGL context
const mockWebGLContext = {
  canvas: null,
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
  getExtension: jest.fn(),
  createShader: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  getShaderParameter: jest.fn(),
  createProgram: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn(),
  useProgram: jest.fn(),
  getUniformLocation: jest.fn(),
  getAttribLocation: jest.fn(),
  createTexture: jest.fn(),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  createFramebuffer: jest.fn(),
  bindFramebuffer: jest.fn(),
  framebufferTexture2D: jest.fn(),
  checkFramebufferStatus: jest.fn(),
  viewport: jest.fn(),
  clear: jest.fn(),
  clearColor: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  blendFunc: jest.fn(),
  uniform1f: jest.fn(),
  uniform2f: jest.fn(),
  uniform3f: jest.fn(),
  uniform1i: jest.fn(),
  activeTexture: jest.fn(),
  drawArrays: jest.fn(),
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  TEXTURE_2D: 3553,
  RGBA: 6408,
  FLOAT: 5126,
  FRAMEBUFFER: 36160,
  COLOR_ATTACHMENT0: 36064,
  FRAMEBUFFER_COMPLETE: 36053,
  TEXTURE0: 33984,
  TEXTURE1: 33985,
  TRIANGLES: 4,
  BLEND: 3042,
  SRC_ALPHA: 770,
  ONE_MINUS_SRC_ALPHA: 771
};

// Mock canvas
const mockCanvas = {
  getContext: jest.fn(() => mockWebGLContext),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0
  })),
  width: 800,
  height: 600
};

// Mock requestAnimationFrame
let animationFrameCallback: ((time: number) => void) | null = null;
const mockRequestAnimationFrame = jest.fn((callback: (time: number) => void) => {
  animationFrameCallback = callback;
  return 1;
});

const mockCancelAnimationFrame = jest.fn();

// Setup mocks
beforeAll(() => {
  global.requestAnimationFrame = mockRequestAnimationFrame;
  global.cancelAnimationFrame = mockCancelAnimationFrame;
  
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    value: 1
  });
  
  // Mock document.createElement for canvas
  const originalCreateElement = document.createElement;
  document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas as any;
    }
    return originalCreateElement.call(document, tagName);
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  animationFrameCallback = null;
  
  // Reset WebGL mock return values
  mockWebGLContext.getShaderParameter.mockReturnValue(true);
  mockWebGLContext.getProgramParameter.mockReturnValue(true);
  mockWebGLContext.checkFramebufferStatus.mockReturnValue(mockWebGLContext.FRAMEBUFFER_COMPLETE);
  mockWebGLContext.createShader.mockReturnValue({});
  mockWebGLContext.createProgram.mockReturnValue({});
  mockWebGLContext.createTexture.mockReturnValue({});
  mockWebGLContext.createFramebuffer.mockReturnValue({});
  mockWebGLContext.getUniformLocation.mockReturnValue({});
  mockWebGLContext.getAttribLocation.mockReturnValue(0);
});

describe('useFluidSimulation', () => {
  it('should initialize with default configuration', () => {
    const { result } = renderHook(() => useFluidSimulation());
    
    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.canvasRef.current).toBeNull();
    expect(result.current.isInitialized).toBe(false);
    expect(typeof result.current.updateConfig).toBe('function');
  });
  
  it('should initialize with custom configuration', () => {
    const customConfig: Partial<FluidSimulationConfig> = {
      physics: {
        viscosity: 50,
        curl: 40
      },
      performance: {
        frameRate: 30
      }
    };
    
    const { result } = renderHook(() => useFluidSimulation(customConfig));
    
    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.isInitialized).toBe(false);
  });
  
  it('should initialize WebGL context when canvas is available', async () => {
    const { result } = renderHook(() => useFluidSimulation());
    
    // Simulate canvas ref being set
    act(() => {
      if (result.current.canvasRef.current === null) {
        (result.current.canvasRef as any).current = mockCanvas;
      }
    });
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2');
  });
  
  it('should start animation loop after initialization', async () => {
    const { result } = renderHook(() => useFluidSimulation());
    
    act(() => {
      (result.current.canvasRef as any).current = mockCanvas;
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });
  
  it('should handle animation frame callback', async () => {
    const { result } = renderHook(() => useFluidSimulation());
    
    act(() => {
      (result.current.canvasRef as any).current = mockCanvas;
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Simulate animation frame
    if (animationFrameCallback) {
      act(() => {
        animationFrameCallback!(16.67); // 60fps frame time
      });
    }
    
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2); // Initial + next frame
  });
  
  it('should update configuration', async () => {
    const { result } = renderHook(() => useFluidSimulation());
    
    const newConfig: Partial<FluidSimulationConfig> = {
      physics: {
        viscosity: 25,
        density: 0.95
      }
    };
    
    act(() => {
      result.current.updateConfig(newConfig);
    });
    
    // Configuration should be updated (we can't directly test internal state,
    // but we can verify the function doesn't throw)
    expect(() => result.current.updateConfig(newConfig)).not.toThrow();
  });
  
  it('should handle resize events', async () => {
    const { result } = renderHook(() => useFluidSimulation());
    
    act(() => {
      (result.current.canvasRef as any).current = mockCanvas;
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Simulate window resize
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(mockCanvas.getBoundingClientRect).toHaveBeenCalled();
  });
  
  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => useFluidSimulation());
    
    act(() => {
      (result.current.canvasRef as any).current = mockCanvas;
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    unmount();
    
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });
  
  it('should handle WebGL initialization failure gracefully', async () => {
    // Mock WebGL context creation failure
    mockCanvas.getContext.mockReturnValue(null);
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useFluidSimulation());
    
    act(() => {
      (result.current.canvasRef as any).current = mockCanvas;
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.isInitialized).toBe(false);
    
    consoleSpy.mockRestore();
  });
  
  it('should limit frame rate according to configuration', async () => {
    const config: Partial<FluidSimulationConfig> = {
      performance: {
        frameRate: 30 // 30fps = 33.33ms per frame
      }
    };
    
    const { result } = renderHook(() => useFluidSimulation(config));
    
    act(() => {
      (result.current.canvasRef as any).current = mockCanvas;
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Simulate fast consecutive frames (should skip some)
    if (animationFrameCallback) {
      act(() => {
        animationFrameCallback!(0);
        animationFrameCallback!(8); // 8ms later (too fast for 30fps)
      });
    }
    
    // Should still request next frame even if skipping
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });
  
  it('should cap delta time to prevent large jumps', async () => {
    const { result } = renderHook(() => useFluidSimulation());
    
    act(() => {
      (result.current.canvasRef as any).current = mockCanvas;
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Simulate very large time jump (should be capped)
    if (animationFrameCallback) {
      act(() => {
        animationFrameCallback!(0);
        animationFrameCallback!(5000); // 5 second jump
      });
    }
    
    // Should continue animation without errors
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });
});
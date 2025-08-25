/**
 * Unit tests for useResponsive hook
 */

import { renderHook, act } from '@testing-library/react';
import { useResponsive, useCanvasDimensions, useDeviceInfo } from './useResponsive';

// Mock window properties
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  matchMedia: jest.fn(),
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    maxTouchPoints: 0
  }
};

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  setTimeout(callback, 16);
  return 1;
});

beforeAll(() => {
  // Setup global mocks
  global.window = mockWindow as any;
  global.ResizeObserver = MockResizeObserver as any;
  global.requestAnimationFrame = mockRequestAnimationFrame;
  
  // Mock matchMedia
  mockWindow.matchMedia.mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn()
  }));
});

beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset window dimensions
  mockWindow.innerWidth = 1024;
  mockWindow.innerHeight = 768;
  mockWindow.devicePixelRatio = 1;
});

describe('useResponsive', () => {
  it('should return initial dimensions and device pixel ratio', () => {
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.dimensions).toEqual({
      width: 1024,
      height: 768
    });
    expect(result.current.devicePixelRatio).toBe(1);
  });
  
  it('should update dimensions on window resize', async () => {
    const { result } = renderHook(() => useResponsive());
    
    // Simulate window resize
    act(() => {
      mockWindow.innerWidth = 1200;
      mockWindow.innerHeight = 800;
      
      // Trigger resize event
      const resizeHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'resize')?.[1];
      
      if (resizeHandler) {
        resizeHandler();
      }
    });
    
    // Wait for requestAnimationFrame
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    expect(result.current.dimensions).toEqual({
      width: 1200,
      height: 800
    });
  });
  
  it('should update device pixel ratio', async () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindow.devicePixelRatio = 2;
      
      // Trigger resize to update pixel ratio
      const resizeHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'resize')?.[1];
      
      if (resizeHandler) {
        resizeHandler();
      }
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    expect(result.current.devicePixelRatio).toBe(2);
  });
  
  it('should handle orientation change', async () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindow.innerWidth = 768;
      mockWindow.innerHeight = 1024;
      
      // Trigger orientation change event
      const orientationHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'orientationchange')?.[1];
      
      if (orientationHandler) {
        orientationHandler();
      }
    });
    
    // Wait for timeout and requestAnimationFrame
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 120));
    });
    
    expect(result.current.dimensions).toEqual({
      width: 768,
      height: 1024
    });
  });
  
  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useResponsive());
    
    unmount();
    
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });
  
  it('should handle SSR (no window)', () => {
    const originalWindow = global.window;
    delete (global as any).window;
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.dimensions).toEqual({
      width: 800,
      height: 600
    });
    expect(result.current.devicePixelRatio).toBe(1);
    
    global.window = originalWindow;
  });
});

describe('useCanvasDimensions', () => {
  it('should calculate canvas dimensions based on container', () => {
    const mockContainer = {
      getBoundingClientRect: jest.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      }))
    };
    
    const containerRef = { current: mockContainer as any };
    
    const { result } = renderHook(() => 
      useCanvasDimensions(containerRef, 1)
    );
    
    expect(result.current).toEqual({
      width: 800,
      height: 600,
      displayWidth: 800,
      displayHeight: 600
    });
  });
  
  it('should apply resolution multiplier', () => {
    const mockContainer = {
      getBoundingClientRect: jest.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      }))
    };
    
    const containerRef = { current: mockContainer as any };
    
    const { result } = renderHook(() => 
      useCanvasDimensions(containerRef, 0.5)
    );
    
    expect(result.current).toEqual({
      width: 400,
      height: 300,
      displayWidth: 800,
      displayHeight: 600
    });
  });
  
  it('should handle high device pixel ratio', () => {
    mockWindow.devicePixelRatio = 3;
    
    const mockContainer = {
      getBoundingClientRect: jest.fn(() => ({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        right: 400,
        bottom: 300
      }))
    };
    
    const containerRef = { current: mockContainer as any };
    
    const { result } = renderHook(() => 
      useCanvasDimensions(containerRef, 1)
    );
    
    expect(result.current).toEqual({
      width: 1200,
      height: 900,
      displayWidth: 400,
      displayHeight: 300
    });
  });
  
  it('should use ResizeObserver when available', () => {
    const mockContainer = {
      getBoundingClientRect: jest.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      }))
    };
    
    const containerRef = { current: mockContainer as any };
    
    renderHook(() => useCanvasDimensions(containerRef, 1));
    
    expect(MockResizeObserver.prototype.observe).toHaveBeenCalledWith(mockContainer);
  });
  
  it('should fallback to window resize when ResizeObserver is not available', () => {
    const originalResizeObserver = global.ResizeObserver;
    delete (global as any).ResizeObserver;
    
    const mockContainer = {
      getBoundingClientRect: jest.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      }))
    };
    
    const containerRef = { current: mockContainer as any };
    
    renderHook(() => useCanvasDimensions(containerRef, 1));
    
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    
    global.ResizeObserver = originalResizeObserver;
  });
});

describe('useDeviceInfo', () => {
  it('should detect desktop device', () => {
    mockWindow.innerWidth = 1024;
    mockWindow.innerHeight = 768;
    mockWindow.navigator.maxTouchPoints = 0;
    
    const { result } = renderHook(() => useDeviceInfo());
    
    expect(result.current).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasTouch: false,
      orientation: 'landscape',
      screenSize: 'large'
    });
  });
  
  it('should detect mobile device in portrait', () => {
    mockWindow.innerWidth = 375;
    mockWindow.innerHeight = 667;
    mockWindow.navigator.maxTouchPoints = 5;
    mockWindow.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
    
    const { result } = renderHook(() => useDeviceInfo());
    
    expect(result.current.orientation).toBe('portrait');
    expect(result.current.hasTouch).toBe(true);
    expect(result.current.screenSize).toBe('small');
  });
  
  it('should detect tablet device', () => {
    mockWindow.innerWidth = 768;
    mockWindow.innerHeight = 1024;
    mockWindow.navigator.maxTouchPoints = 10;
    
    const { result } = renderHook(() => useDeviceInfo());
    
    expect(result.current.isTablet).toBe(true);
    expect(result.current.hasTouch).toBe(true);
    expect(result.current.screenSize).toBe('large');
  });
  
  it('should update on resize', async () => {
    const { result } = renderHook(() => useDeviceInfo());
    
    act(() => {
      mockWindow.innerWidth = 480;
      mockWindow.innerHeight = 800;
      
      const resizeHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'resize')?.[1];
      
      if (resizeHandler) {
        resizeHandler();
      }
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    expect(result.current.orientation).toBe('portrait');
    expect(result.current.screenSize).toBe('medium');
  });
  
  it('should handle SSR gracefully', () => {
    const originalWindow = global.window;
    delete (global as any).window;
    
    const { result } = renderHook(() => useDeviceInfo());
    
    expect(result.current).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasTouch: false,
      orientation: 'landscape',
      screenSize: 'large'
    });
    
    global.window = originalWindow;
  });
});
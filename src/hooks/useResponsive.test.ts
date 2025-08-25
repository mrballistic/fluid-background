/**
 * Unit tests for useResponsive hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useResponsive, useCanvasDimensions, useDeviceInfo } from './useResponsive';

// Mock window properties
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  matchMedia: vi.fn(),
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
  
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

// Mock requestAnimationFrame
// const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
//   setTimeout(callback, 16);
//   return 1;
// });

// Setup global mocks
beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset window dimensions
  mockWindow.innerWidth = 1024;
  mockWindow.innerHeight = 768;
  mockWindow.devicePixelRatio = 1;
  
  // Mock window object
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: mockWindow.innerWidth
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: mockWindow.innerHeight
  });
  
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: mockWindow.devicePixelRatio
  });
  
  // Mock matchMedia
  window.matchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
});

describe('useResponsive', () => {
  it('should return initial dimensions and device pixel ratio', () => {
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.dimensions.width).toBe(1024);
    expect(result.current.dimensions.height).toBe(768);
    expect(result.current.devicePixelRatio).toBe(1);
  });

  it('should update dimensions on window resize', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindow.innerWidth = 1920;
      mockWindow.innerHeight = 1080;
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      Object.defineProperty(window, 'innerHeight', { value: 1080 });
      
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(result.current.dimensions.width).toBe(1920);
    expect(result.current.dimensions.height).toBe(1080);
  });

  it('should update device pixel ratio', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindow.devicePixelRatio = 2;
      Object.defineProperty(window, 'devicePixelRatio', { value: 2 });
      
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(result.current.devicePixelRatio).toBe(2);
  });

  it('should handle orientation change', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      mockWindow.innerWidth = 768;
      mockWindow.innerHeight = 1024;
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      
      window.dispatchEvent(new Event('orientationchange'));
    });
    
    expect(result.current.dimensions.width).toBe(768);
    expect(result.current.dimensions.height).toBe(1024);
  });

  it('should cleanup event listeners on unmount', () => {
    vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => useResponsive());
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  it('should handle SSR (no window)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - intentionally setting to undefined
    delete global.window;
    
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.dimensions.width).toBe(800);
    expect(result.current.dimensions.height).toBe(600);
    expect(result.current.devicePixelRatio).toBe(1);
    
    global.window = originalWindow;
  });
});

describe('useCanvasDimensions', () => {
  it('should calculate canvas dimensions based on container', () => {
    const mockContainer = {
      getBoundingClientRect: vi.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0
      }))
    };

    const { result } = renderHook(() => 
      useCanvasDimensions(mockContainer as any, 1.0)
    );
    
    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
  });

  it('should apply resolution multiplier', () => {
    const mockContainer = {
      getBoundingClientRect: vi.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0
      }))
    };

    const { result } = renderHook(() => 
      useCanvasDimensions(mockContainer as any, 0.5)
    );
    
    expect(result.current.width).toBe(400);
    expect(result.current.height).toBe(300);
  });

  it('should handle high device pixel ratio', () => {
    mockWindow.devicePixelRatio = 3;
    
    const mockContainer = {
      getBoundingClientRect: vi.fn(() => ({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        right: 400,
        bottom: 300,
        x: 0,
        y: 0
      }))
    };

    const { result } = renderHook(() => 
      useCanvasDimensions(mockContainer as any, 1.0)
    );
    
    expect(result.current.width).toBe(1200); // 400 * 3
    expect(result.current.height).toBe(900); // 300 * 3
  });

  it('should use ResizeObserver when available', () => {
    global.ResizeObserver = MockResizeObserver as any;
    
    const mockContainer = {
      getBoundingClientRect: vi.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0
      }))
    };

    renderHook(() => useCanvasDimensions(mockContainer as any, 1.0));
    
    expect(MockResizeObserver.prototype.observe).toHaveBeenCalled();
  });

  it('should fallback to window resize when ResizeObserver is not available', () => {
    const originalResizeObserver = global.ResizeObserver;
    // @ts-expect-error - intentionally setting to undefined
    delete global.ResizeObserver;
    
    const mockContainer = {
      getBoundingClientRect: vi.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0
      }))
    };

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    renderHook(() => useCanvasDimensions(mockContainer as any, 1.0));
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    
    global.ResizeObserver = originalResizeObserver;
  });
});

describe('useDeviceInfo', () => {
  it('should detect desktop device', () => {
    mockWindow.innerWidth = 1920;
    mockWindow.innerHeight = 1080;
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    Object.defineProperty(window, 'innerHeight', { value: 1080 });
    
    const { result } = renderHook(() => useDeviceInfo());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  it('should detect mobile device in portrait', () => {
    mockWindow.innerWidth = 375;
    mockWindow.innerHeight = 667;
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    });
    
    const { result } = renderHook(() => useDeviceInfo());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.orientation).toBe('portrait');
  });

  it('should detect tablet device', () => {
    mockWindow.innerWidth = 768;
    mockWindow.innerHeight = 1024;
    Object.defineProperty(window, 'innerWidth', { value: 768 });
    Object.defineProperty(window, 'innerHeight', { value: 1024 });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'
    });
    
    const { result } = renderHook(() => useDeviceInfo());
    
    expect(result.current.isTablet).toBe(true);
  });

  it('should update on resize', () => {
    const { result } = renderHook(() => useDeviceInfo());
    
    act(() => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 667;
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(result.current.isMobile).toBe(true);
  });

  it('should handle SSR gracefully', () => {
    const originalWindow = global.window;
    const originalNavigator = global.navigator;
    
    // @ts-expect-error - intentionally setting to undefined
    delete global.window;
    // @ts-expect-error - intentionally setting to undefined  
    delete global.navigator;
    
    const { result } = renderHook(() => useDeviceInfo());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });
});
/**
 * Integration tests for SplashCursorVanilla
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SplashCursorVanilla, createSplashCursor } from '../SplashCursorVanilla';

// Mock DOM environment
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn((cb) => setTimeout(cb, 16))
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn()
});

Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1
});

// Mock canvas
const mockCanvas = {
  getContext: vi.fn(() => ({
    scale: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillStyle: ''
  })),
  getBoundingClientRect: vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0
  })),
  width: 800,
  height: 600,
  style: {},
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn(() => mockCanvas)
});

Object.defineProperty(document, 'body', {
  writable: true,
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
});

describe('SplashCursorVanilla', () => {
  let splashCursor: SplashCursorVanilla;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (splashCursor) {
      splashCursor.destroy();
    }
  });  it
('should create instance with default options', () => {
    splashCursor = new SplashCursorVanilla();
    
    expect(splashCursor).toBeInstanceOf(SplashCursorVanilla);
    expect(splashCursor.isActive()).toBe(false);
    expect(splashCursor.getParticleCount()).toBe(0);
    expect(splashCursor.getFPS()).toBe(0);
  });

  it('should create instance with custom options', () => {
    const options = {
      intensity: 0.5,
      particleCount: 100,
      gravity: 0.02
    };
    
    splashCursor = new SplashCursorVanilla(options);
    const config = splashCursor.getConfig();
    
    expect(config.intensity).toBe(0.5);
    expect(config.particleCount).toBe(100);
    expect(config.gravity).toBe(0.02);
  });

  it('should start and stop animation', () => {
    splashCursor = new SplashCursorVanilla();
    
    expect(splashCursor.isActive()).toBe(false);
    
    splashCursor.start();
    expect(splashCursor.isActive()).toBe(true);
    
    splashCursor.stop();
    expect(splashCursor.isActive()).toBe(false);
  });

  it('should update configuration', () => {
    splashCursor = new SplashCursorVanilla();
    
    const newConfig = {
      intensity: 0.9,
      particleCount: 200
    };
    
    splashCursor.updateConfig(newConfig);
    const config = splashCursor.getConfig();
    
    expect(config.intensity).toBe(0.9);
    expect(config.particleCount).toBe(200);
  });

  it('should reset system state', () => {
    splashCursor = new SplashCursorVanilla();
    
    splashCursor.start();
    splashCursor.reset();
    
    expect(splashCursor.getParticleCount()).toBe(0);
    expect(splashCursor.getFPS()).toBe(0);
  });

  it('should handle canvas creation', () => {
    splashCursor = new SplashCursorVanilla();
    
    expect(document.createElement).toHaveBeenCalledWith('canvas');
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it('should use provided canvas', () => {
    const customCanvas = mockCanvas as any;
    splashCursor = new SplashCursorVanilla({ canvas: customCanvas });
    
    expect(splashCursor.getCanvas()).toBe(customCanvas);
  });

  it('should register event callbacks', () => {
    splashCursor = new SplashCursorVanilla();
    
    const performanceCallback = vi.fn();
    const qualityCallback = vi.fn();
    const errorCallback = vi.fn();
    
    const unsubscribePerf = splashCursor.onPerformanceUpdate(performanceCallback);
    const unsubscribeQuality = splashCursor.onQualityChange(qualityCallback);
    const unsubscribeError = splashCursor.onError(errorCallback);
    
    expect(typeof unsubscribePerf).toBe('function');
    expect(typeof unsubscribeQuality).toBe('function');
    expect(typeof unsubscribeError).toBe('function');
  });

  it('should clean up on destroy', () => {
    splashCursor = new SplashCursorVanilla();
    
    splashCursor.start();
    expect(splashCursor.isActive()).toBe(true);
    
    splashCursor.destroy();
    
    expect(splashCursor.isActive()).toBe(false);
    expect(splashCursor.getCanvas()).toBe(null);
  });
});

describe('createSplashCursor factory function', () => {
  it('should create SplashCursorVanilla instance', () => {
    const instance = createSplashCursor();
    
    expect(instance).toBeInstanceOf(SplashCursorVanilla);
    
    instance.destroy();
  });

  it('should pass options to constructor', () => {
    const options = {
      intensity: 0.7,
      particleCount: 80
    };
    
    const instance = createSplashCursor(options);
    const config = instance.getConfig();
    
    expect(config.intensity).toBe(0.7);
    expect(config.particleCount).toBe(80);
    
    instance.destroy();
  });
});
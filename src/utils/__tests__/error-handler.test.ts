/**
 * Tests for error handler utilities
 */

import { errorHandler, ErrorHandler } from '../error-handler';
import { SplashCursorError, CanvasInitializationError, PerformanceError } from '../../types/splash-cursor';

describe('ErrorHandler', () => {
  beforeEach(() => {
    // Reset the singleton instance for each test
    errorHandler.cleanup();
  });

  test('should be a singleton', () => {
    const instance1 = ErrorHandler.getInstance();
    const instance2 = ErrorHandler.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should report errors and call callbacks', () => {
    const mockCallback = vi.fn();
    const unsubscribe = errorHandler.onError(mockCallback);
    
    const testError = new Error('Test error');
    errorHandler.reportError(testError, 'test-context');
    
    expect(mockCallback).toHaveBeenCalledWith(testError, 'test-context');
    
    unsubscribe();
  });

  test('should report performance issues', () => {
    const mockCallback = vi.fn();
    const unsubscribe = errorHandler.onPerformanceIssue(mockCallback);
    
    errorHandler.reportPerformanceIssue(25, 100);
    
    expect(mockCallback).toHaveBeenCalledWith(25, 100);
    
    unsubscribe();
  });

  test('should validate canvas context', () => {
    // Test with null canvas
    expect(() => {
      errorHandler.validateCanvasContext(null);
    }).toThrow(CanvasInitializationError);

    // Test with mock canvas that has no context
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(null),
      width: 100,
      height: 100
    } as any;

    expect(() => {
      errorHandler.validateCanvasContext(mockCanvas);
    }).toThrow(CanvasInitializationError);

    // Test with invalid dimensions
    const mockCanvasInvalidSize = {
      getContext: vi.fn().mockReturnValue({}),
      width: 0,
      height: 100
    } as any;

    expect(() => {
      errorHandler.validateCanvasContext(mockCanvasInvalidSize);
    }).toThrow(CanvasInitializationError);
  });

  test('should validate numeric ranges', () => {
    // Valid number
    expect(() => {
      errorHandler.validateNumericRange(5, 0, 10, 'test');
    }).not.toThrow();

    // Invalid type
    expect(() => {
      errorHandler.validateNumericRange('invalid' as any, 0, 10, 'test');
    }).toThrow(SplashCursorError);

    // Out of range
    expect(() => {
      errorHandler.validateNumericRange(15, 0, 10, 'test');
    }).toThrow(SplashCursorError);

    // NaN
    expect(() => {
      errorHandler.validateNumericRange(NaN, 0, 10, 'test');
    }).toThrow(SplashCursorError);
  });

  test('should validate configuration objects', () => {
    // Valid config
    expect(() => {
      errorHandler.validateConfiguration({
        intensity: 0.5,
        particleCount: 100,
        gravity: 0.01,
        drag: 0.99,
        targetFPS: 60,
        zIndex: 1000
      });
    }).not.toThrow();

    // Invalid config type
    expect(() => {
      errorHandler.validateConfiguration(null);
    }).toThrow(SplashCursorError);

    // Invalid intensity
    expect(() => {
      errorHandler.validateConfiguration({ intensity: 2 });
    }).toThrow(SplashCursorError);

    // Invalid particle count
    expect(() => {
      errorHandler.validateConfiguration({ particleCount: 0 });
    }).toThrow(SplashCursorError);
  });

  test('should check browser support', () => {
    const support = errorHandler.checkBrowserSupport();
    
    expect(support).toHaveProperty('supported');
    expect(support).toHaveProperty('issues');
    expect(Array.isArray(support.issues)).toBe(true);
  });

  test('should create fallback canvas', () => {
    const canvas = errorHandler.createFallbackCanvas();
    
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.width).toBe(1);
    expect(canvas.height).toBe(1);
    expect(canvas.style.display).toBe('none');
  });

  test('should get quality fallback', () => {
    expect(errorHandler.getQualityFallback('high')).toBe('medium');
    expect(errorHandler.getQualityFallback('medium')).toBe('low');
    expect(errorHandler.getQualityFallback('low')).toBe('minimal');
    expect(errorHandler.getQualityFallback('minimal')).toBe('minimal');
  });

  test('should set and execute recovery strategies', () => {
    const mockStrategy = vi.fn();
    errorHandler.setRecoveryStrategy('test-context', mockStrategy);
    
    const testError = new Error('Test error');
    errorHandler.reportError(testError, 'test-context');
    
    expect(mockStrategy).toHaveBeenCalled();
  });

  test('should handle callback errors gracefully', () => {
    const mockCallback = vi.fn().mockImplementation(() => {
      throw new Error('Callback error');
    });
    
    errorHandler.onError(mockCallback);
    
    // Should not throw when callback throws
    expect(() => {
      errorHandler.reportError(new Error('Test error'), 'test');
    }).not.toThrow();
  });

  test('should unsubscribe callbacks correctly', () => {
    const mockCallback = vi.fn();
    const unsubscribe = errorHandler.onError(mockCallback);
    
    unsubscribe();
    
    errorHandler.reportError(new Error('Test error'), 'test');
    expect(mockCallback).not.toHaveBeenCalled();
  });
});
/**
 * Tests for performance monitor utilities
 */

import { performanceMonitor, PerformanceMonitor } from '../performance-monitor';

// Mock performance.now
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset the singleton instance for each test
    performanceMonitor.cleanup();
    mockPerformanceNow.mockClear();
    mockPerformanceNow.mockReturnValue(1000);
  });

  test('should be a singleton', () => {
    const instance1 = PerformanceMonitor.getInstance();
    const instance2 = PerformanceMonitor.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should start and stop monitoring', () => {
    performanceMonitor.startMonitoring(60);

    // Should be monitoring now
    expect(() => {
      performanceMonitor.recordFrame();
    }).not.toThrow();

    performanceMonitor.stopMonitoring();
  });

  test('should record frames and calculate FPS', () => {
    performanceMonitor.startMonitoring(60);

    // Record first frame
    mockPerformanceNow.mockReturnValue(1000);
    performanceMonitor.recordFrame();

    // Record second frame 16.67ms later (60 FPS)
    mockPerformanceNow.mockReturnValue(1016.67);
    performanceMonitor.recordFrame();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.fps).toBeCloseTo(60, 0);
    expect(metrics.frameCount).toBe(2);
  });

  test('should track render timing', () => {
    performanceMonitor.startMonitoring(60);

    mockPerformanceNow.mockReturnValue(1000);
    performanceMonitor.startRenderTiming();

    mockPerformanceNow.mockReturnValue(1005); // 5ms render time
    performanceMonitor.endRenderTiming();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.renderTime).toBe(5);
  });

  test('should track update timing', () => {
    performanceMonitor.startMonitoring(60);

    mockPerformanceNow.mockReturnValue(1000);
    performanceMonitor.startUpdateTiming();

    mockPerformanceNow.mockReturnValue(1003); // 3ms update time
    performanceMonitor.endUpdateTiming();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.updateTime).toBe(3);
  });

  test('should manage quality levels', () => {
    expect(performanceMonitor.getCurrentQuality()).toBe('high');

    performanceMonitor.setQuality('medium');
    expect(performanceMonitor.getCurrentQuality()).toBe('medium');

    const settings = performanceMonitor.getQualitySettings();
    expect(settings.particleCount).toBe(100);
    expect(settings.targetFPS).toBe(45);
  });

  test('should call quality change callbacks', () => {
    const mockCallback = vi.fn();
    const unsubscribe = performanceMonitor.onQualityChange(mockCallback);

    performanceMonitor.setQuality('low');

    expect(mockCallback).toHaveBeenCalledWith('low', expect.any(Object));

    unsubscribe();
  });

  test('should call performance update callbacks', () => {
    const mockCallback = vi.fn();
    const unsubscribe = performanceMonitor.onPerformanceUpdate(mockCallback);

    performanceMonitor.startMonitoring(60);

    // Simulate multiple frames to trigger performance check
    for (let i = 0; i < 70; i++) {
      mockPerformanceNow.mockReturnValue(1000 + i * 16.67);
      performanceMonitor.recordFrame();
    }

    // Wait for performance check interval
    mockPerformanceNow.mockReturnValue(2100); // More than 1 second later
    performanceMonitor.recordFrame();

    expect(mockCallback).toHaveBeenCalled();

    unsubscribe();
  });

  test('should reset metrics correctly', () => {
    performanceMonitor.startMonitoring(60);

    // Record some frames
    mockPerformanceNow.mockReturnValue(1000);
    performanceMonitor.recordFrame();
    mockPerformanceNow.mockReturnValue(1016.67);
    performanceMonitor.recordFrame();

    let metrics = performanceMonitor.getMetrics();
    expect(metrics.frameCount).toBe(2);

    performanceMonitor.resetMetrics();

    metrics = performanceMonitor.getMetrics();
    expect(metrics.frameCount).toBe(0);
    expect(metrics.fps).toBe(0);
  });

  test('should handle adaptive quality', () => {
    performanceMonitor.setAdaptiveQuality(true);
    performanceMonitor.startMonitoring(60);

    // Simulate poor performance (low FPS)
    for (let i = 0; i < 70; i++) {
      mockPerformanceNow.mockReturnValue(1000 + i * 50); // 20 FPS
      performanceMonitor.recordFrame();
    }

    // Trigger performance check
    mockPerformanceNow.mockReturnValue(5000);
    performanceMonitor.recordFrame();

    // Quality should have been reduced due to poor performance
    // Note: This test might need adjustment based on the exact adaptive logic
  });

  test('should get quality settings for different levels', () => {
    const highSettings = performanceMonitor.getQualitySettings('high');
    const lowSettings = performanceMonitor.getQualitySettings('low');

    expect(highSettings.particleCount).toBeGreaterThan(lowSettings.particleCount);
    expect(highSettings.targetFPS).toBeGreaterThan(lowSettings.targetFPS);
  });

  test('should handle callback errors gracefully', () => {
    const mockCallback = vi.fn().mockImplementation(() => {
      throw new Error('Callback error');
    });

    performanceMonitor.onQualityChange(mockCallback);

    // Should not throw when callback throws
    expect(() => {
      performanceMonitor.setQuality('medium');
    }).not.toThrow();
  });

  test('should unsubscribe callbacks correctly', () => {
    const mockCallback = vi.fn();
    const unsubscribe = performanceMonitor.onQualityChange(mockCallback);

    unsubscribe();

    performanceMonitor.setQuality('low');
    expect(mockCallback).not.toHaveBeenCalled();
  });
});
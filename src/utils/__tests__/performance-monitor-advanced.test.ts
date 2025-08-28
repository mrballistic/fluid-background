/**
 * Advanced performance monitor tests for adaptive quality system
 */

import { performanceMonitor } from '../performance-monitor';
import { QualityLevel } from '../../types/splash-cursor';

import { vi } from 'vitest';

// Mock high-resolution time
const mockPerformanceNow = vi.fn();
Object.defineProperty(window, 'performance', {
  value: {
    now: mockPerformanceNow
  }
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn();
Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame
});

describe('PerformanceMonitor - Adaptive Quality System', () => {
  let currentTime = 0;

  beforeEach(() => {
    currentTime = 0;
    mockPerformanceNow.mockImplementation(() => currentTime);
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(() => callback(currentTime), 16);
      return 1;
    });
    
    performanceMonitor.cleanup();
    performanceMonitor.resetMetrics();
  });

  afterEach(() => {
    performanceMonitor.cleanup();
    vi.clearAllMocks();
  });

  describe('FPS Monitoring and Quality Adjustment', () => {
    it('should start monitoring with correct target FPS', () => {
      performanceMonitor.startMonitoring(60);
      
      expect(performanceMonitor.getCurrentQuality()).toBe('high');
    });

    it('should reduce quality when FPS drops below threshold', async () => {
      performanceMonitor.startMonitoring(60);
      performanceMonitor.enableAdaptiveQuality({
        warningThreshold: 0.8,
        criticalThreshold: 0.6,
        cooldownMs: 100
      });

      let qualityChanged = false;
      let newQuality: QualityLevel = 'high';

      performanceMonitor.onQualityChange((quality) => {
        qualityChanged = true;
        newQuality = quality;
      });

      // Simulate poor performance (30 FPS when target is 60)
      for (let i = 0; i < 70; i++) {
        currentTime += 33.33; // 30 FPS
        performanceMonitor.recordFrame(currentTime);
      }

      // Wait for quality adjustment
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(qualityChanged).toBe(true);
      expect(newQuality).not.toBe('high');
    });

    it('should increase quality when performance improves', async () => {
      performanceMonitor.startMonitoring(60);
      performanceMonitor.setQuality('low');
      performanceMonitor.enableAdaptiveQuality({
        excellentThreshold: 1.1,
        cooldownMs: 100
      });

      let qualityChanged = false;
      let newQuality: QualityLevel = 'low';

      performanceMonitor.onQualityChange((quality) => {
        qualityChanged = true;
        newQuality = quality;
      });

      // Simulate excellent performance (70 FPS when target is 30 for low quality)
      for (let i = 0; i < 70; i++) {
        currentTime += 14.3; // ~70 FPS
        performanceMonitor.recordFrame(currentTime);
      }

      // Wait for quality adjustment
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(qualityChanged).toBe(true);
      expect(['medium', 'high']).toContain(newQuality);
    });

    it('should respect cooldown period for quality adjustments', async () => {
      performanceMonitor.startMonitoring(60);
      performanceMonitor.enableAdaptiveQuality({
        warningThreshold: 0.8,
        cooldownMs: 1000
      });

      let adjustmentCount = 0;
      performanceMonitor.onQualityChange(() => {
        adjustmentCount++;
      });

      // First adjustment - should trigger
      for (let i = 0; i < 70; i++) {
        currentTime += 33.33; // 30 FPS
        performanceMonitor.recordFrame(currentTime);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // Second adjustment attempt - should be blocked by cooldown
      for (let i = 0; i < 70; i++) {
        currentTime += 50; // 20 FPS
        performanceMonitor.recordFrame(currentTime);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(adjustmentCount).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Benchmarking', () => {
    it('should create and execute performance benchmarks', () => {
      const benchmark = performanceMonitor.createPerformanceBenchmark();
      
      currentTime = 1000;
      benchmark.start();
      
      // Simulate some frames
      for (let i = 0; i < 60; i++) {
        currentTime += 16.67; // 60 FPS
        performanceMonitor.recordFrame(currentTime);
      }
      
      const result = benchmark.end();
      
      expect(result.duration).toBeGreaterThan(0);
      expect(result.fps).toBeGreaterThan(0);
      expect(result.quality).toBeDefined();
    });

    it('should profile function execution time', () => {
      const testFunction = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = performanceMonitor.profileFunction(testFunction, 'test-function');
      
      expect(result).toBe(499500); // Sum of 0 to 999
    });

    it('should handle benchmark timing correctly', () => {
      performanceMonitor.startBenchmark('test-operation');
      
      currentTime += 100; // Simulate 100ms operation
      
      const duration = performanceMonitor.endBenchmark('test-operation');
      
      expect(duration).toBe(100);
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should return null when memory API is not available', () => {
      const memoryUsage = performanceMonitor.getMemoryUsage();
      expect(memoryUsage).toBeNull();
    });

    it('should return memory usage when API is available', () => {
      // Mock memory API
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000
        },
        configurable: true
      });

      const memoryUsage = performanceMonitor.getMemoryUsage();
      
      expect(memoryUsage).toEqual({
        used: 1000000,
        total: 2000000,
        percentage: 50
      });

      // Clean up
      delete (performance as any).memory;
    });
  });

  describe('Performance Testing', () => {
    it('should run performance test for specified duration', async () => {
      performanceMonitor.startMonitoring(60);
      
      // Mock requestAnimationFrame to resolve immediately
      mockRequestAnimationFrame.mockImplementation((callback) => {
        callback(currentTime);
        return 1;
      });

      // Simulate frames during test
      const testPromise = performanceMonitor.runPerformanceTest(100);
      
      // Advance time and add frames
      for (let i = 0; i < 10; i++) {
        currentTime += 16.67;
        performanceMonitor.recordFrame(currentTime);
      }
      
      currentTime += 100; // Complete the test duration
      
      const result = await testPromise;
      
      expect(result).toHaveProperty('averageFps');
      expect(result).toHaveProperty('minFps');
      expect(result).toHaveProperty('maxFps');
      expect(result).toHaveProperty('frameDrops');
      expect(result).toHaveProperty('averageFrameTime');
      expect(result).toHaveProperty('renderTime');
      expect(result).toHaveProperty('updateTime');
    });
  });

  describe('Quality Level Management', () => {
    it('should provide correct quality settings for each level', () => {
      const highSettings = performanceMonitor.getQualitySettings('high');
      const lowSettings = performanceMonitor.getQualitySettings('low');
      
      expect(highSettings.particleCount).toBeGreaterThan(lowSettings.particleCount);
      expect(highSettings.targetFPS).toBeGreaterThan(lowSettings.targetFPS);
      expect(highSettings.skipPixels).toBeLessThan(lowSettings.skipPixels);
    });

    it('should notify callbacks when quality changes', () => {
      let callbackCalled = false;
      let receivedQuality: QualityLevel = 'high';
      
      const unsubscribe = performanceMonitor.onQualityChange((quality) => {
        callbackCalled = true;
        receivedQuality = quality;
      });
      
      performanceMonitor.setQuality('medium');
      
      expect(callbackCalled).toBe(true);
      expect(receivedQuality).toBe('medium');
      
      unsubscribe();
    });

    it('should handle quality callback errors gracefully', () => {
      const errorCallback = () => {
        throw new Error('Callback error');
      };
      
      performanceMonitor.onQualityChange(errorCallback);
      
      // Should not throw
      expect(() => {
        performanceMonitor.setQuality('low');
      }).not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate accurate performance metrics', () => {
      performanceMonitor.startMonitoring(60);
      
      // Add some frame data
      const frameTimes = [16.67, 16.67, 33.33, 16.67, 16.67]; // Mix of 60fps and 30fps
      
      frameTimes.forEach(frameTime => {
        currentTime += frameTime;
        performanceMonitor.recordFrame(currentTime);
      });
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.frameCount).toBe(frameTimes.length);
      expect(metrics.averageFps).toBeGreaterThan(0);
      expect(metrics.minFps).toBeGreaterThan(0);
      expect(metrics.maxFps).toBeGreaterThan(0);
    });

    it('should track render and update timing separately', () => {
      performanceMonitor.startRenderTiming();
      currentTime += 5; // 5ms render time
      performanceMonitor.endRenderTiming();
      
      performanceMonitor.startUpdateTiming();
      currentTime += 3; // 3ms update time
      performanceMonitor.endUpdateTiming();
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.renderTime).toBe(5);
      expect(metrics.updateTime).toBe(3);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle performance callback errors', () => {
      const errorCallback = () => {
        throw new Error('Performance callback error');
      };
      
      performanceMonitor.onPerformanceUpdate(errorCallback);
      
      // Should not throw when performance check runs
      expect(() => {
        performanceMonitor.startMonitoring(60);
        
        for (let i = 0; i < 70; i++) {
          currentTime += 16.67;
          performanceMonitor.recordFrame(currentTime);
        }
      }).not.toThrow();
    });

    it('should clean up properly', () => {
      performanceMonitor.startMonitoring(60);
      performanceMonitor.onQualityChange(() => {});
      performanceMonitor.onPerformanceUpdate(() => {});
      
      performanceMonitor.cleanup();
      
      expect(performanceMonitor.getCurrentQuality()).toBe('high');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.frameCount).toBe(0);
    });
  });
});
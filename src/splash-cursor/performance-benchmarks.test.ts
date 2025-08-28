/**
 * Performance benchmark tests for splash cursor system
 * Tests performance characteristics and optimization effectiveness
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ParticleSystem } from './ParticleSystem';
import { PhysicsEngine } from './PhysicsEngine';
import { MetaballRenderer } from './MetaballRenderer';
import { MouseTracker } from './MouseTracker';
import { ParticleSystemConfig, PhysicsConfig, MetaballRendererConfig } from '../types/splash-cursor';

// Mock canvas and context for benchmarks
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  imageSmoothingEnabled: boolean = true;
  imageSmoothingQuality: ImageSmoothingQuality = 'high';
  filter: string = 'none';
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  globalAlpha: number = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  save(): void {}
  restore(): void {}
  createImageData(width: number, height: number): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    return { data, width, height, colorSpace: 'srgb' } as ImageData;
  }
  putImageData(imageData: ImageData, dx: number, dy: number): void {}
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    const data = new Uint8ClampedArray(sw * sh * 4);
    return { data, width: sw, height: sh, colorSpace: 'srgb' } as ImageData;
  }
  clearRect(x: number, y: number, w: number, h: number): void {}
}

class MockHTMLCanvasElement {
  width: number = 800;
  height: number = 600;
  private context: MockCanvasRenderingContext2D;

  constructor() {
    this.context = new MockCanvasRenderingContext2D(this as any);
  }

  getContext(contextId: '2d'): MockCanvasRenderingContext2D | null {
    if (contextId === '2d') {
      return this.context;
    }
    return null;
  }

  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      width: this.width,
      height: this.height,
      right: this.width,
      bottom: this.height,
      x: 0,
      y: 0
    };
  }
}

// Performance measurement utilities
class PerformanceMeasurer {
  private measurements: Map<string, number[]> = new Map();

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    return result;
  }

  getStats(name: string) {
    const measurements = this.measurements.get(name) || [];
    if (measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length };
  }

  reset() {
    this.measurements.clear();
  }
}

describe('Splash Cursor Performance Benchmarks', () => {
  let particleSystem: ParticleSystem;
  let physicsEngine: PhysicsEngine;
  let renderer: MetaballRenderer;
  let mouseTracker: MouseTracker;
  let canvas: MockHTMLCanvasElement;
  let measurer: PerformanceMeasurer;

  beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);

    canvas = new MockHTMLCanvasElement();
    measurer = new PerformanceMeasurer();

    const particleConfig: ParticleSystemConfig = {
      maxParticles: 150,
      emissionRate: 60,
      particleLifetime: 2000,
      initialSize: 8,
      sizeVariation: 3
    };

    const physicsConfig: PhysicsConfig = {
      bounds: { x: 0, y: 0, width: 800, height: 600 },
      gravity: { x: 0, y: 30 },
      drag: 0.97,
      bounceEnabled: true,
      bounceDamping: 0.8
    };

    const rendererConfig: MetaballRendererConfig = {
      threshold: 0.5,
      blurAmount: 2,
      qualityLevel: 'high',
      maxInfluenceDistance: 100,
      skipPixels: 1
    };

    particleSystem = new ParticleSystem(particleConfig);
    physicsEngine = new PhysicsEngine(physicsConfig);
    renderer = new MetaballRenderer(canvas as any, rendererConfig);
    mouseTracker = new MouseTracker({
      velocitySmoothing: 0.7,
      maxVelocity: 500
    });
  });

  afterEach(() => {
    particleSystem.cleanup();
    mouseTracker.stopTracking();
    vi.restoreAllMocks();
  });

  describe('Particle System Performance', () => {
    it('should handle particle creation efficiently', () => {
      const particleCounts = [10, 50, 100, 150];
      
      particleCounts.forEach(count => {
        measurer.measure(`create-${count}-particles`, () => {
          for (let i = 0; i < count; i++) {
            particleSystem.forceEmit(
              { x: 100 + i * 2, y: 100 + i },
              1,
              1.0
            );
          }
        });
        
        particleSystem.cleanup();
      });

      // Performance should scale reasonably
      const stats10 = measurer.getStats('create-10-particles');
      const stats150 = measurer.getStats('create-150-particles');
      
      expect(stats10.avg).toBeGreaterThan(0);
      expect(stats150.avg).toBeGreaterThan(0);
      
      // 150 particles shouldn't take more than 15x the time of 10 particles
      expect(stats150.avg).toBeLessThan(stats10.avg * 15);
    });

    it('should update particles efficiently', () => {
      // Create maximum particles
      for (let i = 0; i < 150; i++) {
        particleSystem.forceEmit({ x: 100 + i, y: 100 }, 1, 1.0);
      }

      // Measure update performance
      for (let frame = 0; frame < 60; frame++) {
        measurer.measure('particle-update', () => {
          particleSystem.update(16, { x: 200, y: 200 }, { x: 0, y: 0 });
        });
      }

      const updateStats = measurer.getStats('particle-update');
      expect(updateStats.avg).toBeLessThan(5); // Should take less than 5ms on average
      expect(updateStats.max).toBeLessThan(20); // Max should be under 20ms
    });

    it('should handle particle pool operations efficiently', () => {
      // Measure pool allocation/deallocation cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        measurer.measure('pool-cycle', () => {
          // Allocate particles
          for (let i = 0; i < 50; i++) {
            particleSystem.forceEmit({ x: 100 + i, y: 100 }, 1, 1.0);
          }
          
          // Let them die quickly
          particleSystem.update(3000, { x: 200, y: 200 }, { x: 0, y: 0 });
        });
      }

      const poolStats = measurer.getStats('pool-cycle');
      expect(poolStats.avg).toBeLessThan(10); // Pool operations should be fast
    });
  });

  describe('Physics Engine Performance', () => {
    it('should update physics efficiently for many particles', () => {
      // Create particles with various properties
      const particles = [];
      for (let i = 0; i < 100; i++) {
        particles.push({
          position: { x: 100 + i * 2, y: 100 + i },
          velocity: { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 },
          life: Math.random(),
          maxLife: 1.0,
          size: 5 + Math.random() * 10,
          color: { h: Math.random() * 360, s: 80, l: 50, a: 1.0 },
          createdAt: 0
        });
      }

      // Measure physics update performance
      for (let frame = 0; frame < 60; frame++) {
        measurer.measure('physics-update', () => {
          particles.forEach(particle => {
            physicsEngine.updateParticle(particle, 16 / 1000);
          });
        });
      }

      const physicsStats = measurer.getStats('physics-update');
      expect(physicsStats.avg).toBeLessThan(3); // Should be very fast
      expect(physicsStats.max).toBeLessThan(10);
    });

    it('should handle collision detection efficiently', () => {
      // Create particles near boundaries
      const edgeParticles = [
        { position: { x: 5, y: 300 }, velocity: { x: -50, y: 0 } },
        { position: { x: 795, y: 300 }, velocity: { x: 50, y: 0 } },
        { position: { x: 400, y: 5 }, velocity: { x: 0, y: -50 } },
        { position: { x: 400, y: 595 }, velocity: { x: 0, y: 50 } }
      ].map(p => ({
        ...p,
        life: 0.5,
        maxLife: 1.0,
        size: 10,
        color: { h: 180, s: 80, l: 50, a: 1.0 },
        createdAt: 0
      }));

      // Measure collision detection performance
      for (let frame = 0; frame < 100; frame++) {
        measurer.measure('collision-detection', () => {
          edgeParticles.forEach(particle => {
            physicsEngine.handleBoundaryCollision(particle);
          });
        });
      }

      const collisionStats = measurer.getStats('collision-detection');
      expect(collisionStats.avg).toBeLessThan(1); // Collision detection should be very fast
    });
  });

  describe('Renderer Performance', () => {
    it('should render particles efficiently at different quality levels', () => {
      const particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          position: { x: 100 + i * 10, y: 100 + i * 5 },
          velocity: { x: 0, y: 0 },
          life: Math.random(),
          maxLife: 1.0,
          size: 8 + Math.random() * 8,
          color: { h: i * 7, s: 80, l: 50, a: 0.8 },
          createdAt: 0
        });
      }

      const qualityLevels = ['low', 'medium', 'high'] as const;
      
      qualityLevels.forEach(quality => {
        renderer.setQualityLevel(quality);
        
        for (let frame = 0; frame < 30; frame++) {
          measurer.measure(`render-${quality}`, () => {
            renderer.render(particles);
          });
        }
      });

      // High quality should be slower than low quality
      const lowStats = measurer.getStats('render-low');
      const highStats = measurer.getStats('render-high');
      
      expect(lowStats.avg).toBeGreaterThan(0);
      expect(highStats.avg).toBeGreaterThan(0);
      expect(highStats.avg).toBeGreaterThanOrEqual(lowStats.avg);
    });

    it('should handle skip pixels optimization effectively', () => {
      const particles = [];
      for (let i = 0; i < 30; i++) {
        particles.push({
          position: { x: 200 + i * 15, y: 200 + i * 10 },
          velocity: { x: 0, y: 0 },
          life: 0.7,
          maxLife: 1.0,
          size: 12,
          color: { h: 180, s: 90, l: 60, a: 0.9 },
          createdAt: 0
        });
      }

      const skipPixelValues = [1, 2, 3, 4];
      
      skipPixelValues.forEach(skipPixels => {
        renderer.setSkipPixels(skipPixels);
        
        for (let frame = 0; frame < 20; frame++) {
          measurer.measure(`skip-${skipPixels}`, () => {
            renderer.render(particles);
          });
        }
      });

      // Higher skip pixels should be faster
      const skip1Stats = measurer.getStats('skip-1');
      const skip4Stats = measurer.getStats('skip-4');
      
      expect(skip1Stats.avg).toBeGreaterThan(0);
      expect(skip4Stats.avg).toBeGreaterThan(0);
      expect(skip4Stats.avg).toBeLessThanOrEqual(skip1Stats.avg);
    });

    it('should handle large particle counts with reasonable performance', () => {
      const largeCounts = [50, 100, 150];
      
      largeCounts.forEach(count => {
        const particles = [];
        for (let i = 0; i < count; i++) {
          particles.push({
            position: { x: Math.random() * 800, y: Math.random() * 600 },
            velocity: { x: 0, y: 0 },
            life: Math.random(),
            maxLife: 1.0,
            size: 5 + Math.random() * 10,
            color: { h: Math.random() * 360, s: 80, l: 50, a: Math.random() },
            createdAt: 0
          });
        }

        measurer.measure(`render-${count}-particles`, () => {
          renderer.render(particles);
        });
      });

      // Performance should scale reasonably with particle count
      const stats50 = measurer.getStats('render-50-particles');
      const stats150 = measurer.getStats('render-150-particles');
      
      expect(stats50.avg).toBeGreaterThan(0);
      expect(stats150.avg).toBeGreaterThan(0);
      
      // 150 particles shouldn't take more than 5x the time of 50 particles
      expect(stats150.avg).toBeLessThan(stats50.avg * 5);
    });
  });

  describe('Mouse Tracker Performance', () => {
    it('should handle high-frequency mouse events efficiently', () => {
      const mockCanvas = new MockHTMLCanvasElement();
      mouseTracker.startTracking(mockCanvas as any);

      // Mock document event listeners
      vi.spyOn(document, 'addEventListener');
      vi.spyOn(document, 'removeEventListener');

      // Simulate rapid mouse movement
      for (let i = 0; i < 1000; i++) {
        measurer.measure('mouse-event', () => {
          const moveEvent = new MouseEvent('mousemove', {
            clientX: 100 + i % 700,
            clientY: 100 + (i * 2) % 500
          });
          document.dispatchEvent(moveEvent);
        });
      }

      const mouseStats = measurer.getStats('mouse-event');
      expect(mouseStats.avg).toBeLessThan(0.5); // Mouse events should be very fast
      expect(mouseStats.max).toBeLessThan(2);
    });

    it('should calculate velocity efficiently', () => {
      const mockCanvas = new MockHTMLCanvasElement();
      mouseTracker.startTracking(mockCanvas as any);

      // Create mouse movement sequence
      for (let i = 0; i < 100; i++) {
        vi.spyOn(performance, 'now').mockReturnValue(1000 + i * 16);
        
        const moveEvent = new MouseEvent('mousemove', {
          clientX: 100 + i * 5,
          clientY: 100 + i * 3
        });
        document.dispatchEvent(moveEvent);

        measurer.measure('velocity-calculation', () => {
          mouseTracker.getVelocityMagnitude();
          mouseTracker.getMouseState();
        });
      }

      const velocityStats = measurer.getStats('velocity-calculation');
      expect(velocityStats.avg).toBeLessThan(0.1); // Velocity calculation should be very fast
    });
  });

  describe('Full System Performance', () => {
    it('should maintain target frame rate under normal load', () => {
      const mockCanvas = new MockHTMLCanvasElement();
      mouseTracker.startTracking(mockCanvas as any);

      // Simulate normal usage pattern
      const targetFrameTime = 16.67; // 60 FPS
      let totalFrameTime = 0;
      const frameCount = 60;

      for (let frame = 0; frame < frameCount; frame++) {
        const frameStart = performance.now();
        
        // Simulate mouse movement
        vi.spyOn(performance, 'now').mockReturnValue(1000 + frame * 16);
        const moveEvent = new MouseEvent('mousemove', {
          clientX: 200 + Math.sin(frame * 0.1) * 100,
          clientY: 200 + Math.cos(frame * 0.1) * 100
        });
        document.dispatchEvent(moveEvent);

        // Update systems
        const mouseState = mouseTracker.getMouseState();
        particleSystem.updateWithMouseState(16, mouseState);
        
        const particles = particleSystem.getParticles();
        particles.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        
        renderer.render(particles);

        const frameEnd = performance.now();
        totalFrameTime += (frameEnd - frameStart);
      }

      const avgFrameTime = totalFrameTime / frameCount;
      
      // Average frame time should be reasonable for 60 FPS
      expect(avgFrameTime).toBeLessThan(targetFrameTime * 2); // Allow 2x target for test environment
    });

    it('should handle stress test scenarios', () => {
      // Stress test: maximum particles, rapid movement, high quality rendering
      particleSystem.updateConfig({ maxParticles: 150 });
      renderer.setQualityLevel('high');
      renderer.setSkipPixels(1);

      const stressFrames = 30;
      let maxFrameTime = 0;
      let totalTime = 0;

      for (let frame = 0; frame < stressFrames; frame++) {
        const frameStart = performance.now();

        // Create maximum particles
        for (let i = 0; i < 5; i++) {
          particleSystem.forceEmit(
            { x: 200 + i * 20, y: 200 + frame * 2 },
            1,
            1.0
          );
        }

        // Update all systems
        const particles = particleSystem.getParticles();
        particles.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        
        particleSystem.update(16, { x: 200, y: 200 }, { x: 50, y: 30 });
        renderer.render(particles);

        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        maxFrameTime = Math.max(maxFrameTime, frameTime);
        totalTime += frameTime;
      }

      const avgFrameTime = totalTime / stressFrames;

      // Even under stress, performance should be reasonable
      expect(avgFrameTime).toBeLessThan(50); // 50ms average (20 FPS minimum)
      expect(maxFrameTime).toBeLessThan(100); // No single frame over 100ms
    });

    it('should demonstrate optimization effectiveness', () => {
      // Test with optimizations disabled
      renderer.setOptimizationsEnabled(false);
      renderer.setSpatialPartitioningEnabled(false);
      renderer.setDirtyRectanglesEnabled(false);

      const particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          position: { x: 100 + i * 10, y: 100 + i * 5 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 10,
          color: { h: i * 7, s: 80, l: 50, a: 0.8 },
          createdAt: 0
        });
      }

      // Measure without optimizations
      for (let frame = 0; frame < 20; frame++) {
        measurer.measure('no-optimizations', () => {
          renderer.render(particles);
        });
      }

      // Enable optimizations
      renderer.setOptimizationsEnabled(true);
      renderer.setSpatialPartitioningEnabled(true);
      renderer.setDirtyRectanglesEnabled(true);

      // Measure with optimizations
      for (let frame = 0; frame < 20; frame++) {
        measurer.measure('with-optimizations', () => {
          renderer.render(particles);
        });
      }

      const noOptStats = measurer.getStats('no-optimizations');
      const withOptStats = measurer.getStats('with-optimizations');

      // Optimizations should improve performance or at least not make it worse
      expect(withOptStats.avg).toBeLessThanOrEqual(noOptStats.avg * 1.1); // Allow 10% margin
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during normal operation', () => {
      const initialStats = particleSystem.getPoolStats();
      
      // Simulate extended usage
      for (let cycle = 0; cycle < 20; cycle++) {
        // Create particles
        for (let i = 0; i < 10; i++) {
          particleSystem.forceEmit({ x: 100 + i * 20, y: 100 }, 1, 1.0);
        }

        // Process several frames
        for (let frame = 0; frame < 10; frame++) {
          const particles = particleSystem.getParticles();
          particles.forEach(particle => {
            physicsEngine.updateParticle(particle, 16 / 1000);
          });
          
          particleSystem.update(16, { x: 200, y: 200 }, { x: 0, y: 0 });
          renderer.render(particles);
        }

        // Let particles die
        particleSystem.update(3000, { x: 200, y: 200 }, { x: 0, y: 0 });
      }

      const finalStats = particleSystem.getPoolStats();
      
      // Pool should be intact (no memory leaks)
      expect(finalStats.total).toBe(initialStats.total);
      expect(finalStats.active).toBe(0);
      expect(finalStats.pooled).toBe(initialStats.total);
    });

    it('should handle rapid allocation/deallocation efficiently', () => {
      const cycles = 100;
      
      measurer.measure('memory-stress', () => {
        for (let cycle = 0; cycle < cycles; cycle++) {
          // Rapid allocation
          for (let i = 0; i < 20; i++) {
            particleSystem.forceEmit({ x: 100 + i, y: 100 }, 1, 1.0);
          }
          
          // Immediate deallocation
          particleSystem.update(5000, { x: 200, y: 200 }, { x: 0, y: 0 });
        }
      });

      const memoryStats = measurer.getStats('memory-stress');
      expect(memoryStats.avg).toBeLessThan(100); // Should complete quickly

      // Pool should be stable
      const finalStats = particleSystem.getPoolStats();
      expect(finalStats.active).toBe(0);
      expect(finalStats.total).toBe(150);
    });
  });
});
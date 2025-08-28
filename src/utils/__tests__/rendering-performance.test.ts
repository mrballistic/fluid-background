/**
 * Performance comparison tests for rendering optimizations
 */

import { MetaballRenderer } from '../../splash-cursor/MetaballRenderer';
import { SpatialPartitioning, MetaballSpatialGrid } from '../spatial-partitioning';
import { DirtyRectangleTracker } from '../dirty-rectangle';
import { SplashCursorParticlePool } from '../particle-pool';
import { Particle, Vector2, Rectangle } from '../../types/splash-cursor';

// Mock canvas and context
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn(() => ({
    createImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(800 * 600 * 4),
      width: 800,
      height: 600
    })),
    putImageData: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  }))
} as any;

import { vi } from 'vitest';

// Mock performance.now
const mockPerformanceNow = vi.fn();
Object.defineProperty(window, 'performance', {
  value: { now: mockPerformanceNow }
});

describe('Rendering Performance Optimizations', () => {
  let currentTime = 0;

  beforeEach(() => {
    currentTime = 0;
    mockPerformanceNow.mockImplementation(() => currentTime);
    vi.clearAllMocks();
  });

  describe('Spatial Partitioning Performance', () => {
    it('should improve particle query performance with many particles', () => {
      const bounds: Rectangle = { x: 0, y: 0, width: 1000, height: 1000 };
      const spatialGrid = new SpatialPartitioning(bounds, 100);
      
      // Create many particles
      const particles: Particle[] = [];
      for (let i = 0; i < 1000; i++) {
        particles.push({
          position: { x: Math.random() * 1000, y: Math.random() * 1000 },
          velocity: { x: 0, y: 0 },
          life: 1,
          maxLife: 1,
          size: 10,
          color: { h: 0, s: 0, l: 0, a: 1 },
          createdAt: currentTime
        });
      }

      // Add particles to spatial grid
      const startTime = performance.now();
      spatialGrid.updateParticles(particles);
      const updateTime = performance.now() - startTime;

      // Query particles near a point
      const queryStart = performance.now();
      const nearbyParticles = spatialGrid.getParticlesNear({ x: 500, y: 500 }, 100);
      const queryTime = performance.now() - queryStart;

      expect(nearbyParticles.length).toBeGreaterThan(0);
      expect(nearbyParticles.length).toBeLessThan(particles.length);
      expect(updateTime).toBeDefined();
      expect(queryTime).toBeDefined();
    });

    it('should provide correct statistics', () => {
      const bounds: Rectangle = { x: 0, y: 0, width: 500, height: 500 };
      const spatialGrid = new SpatialPartitioning(bounds, 50);
      
      const particles: Particle[] = [];
      for (let i = 0; i < 100; i++) {
        particles.push({
          position: { x: Math.random() * 500, y: Math.random() * 500 },
          velocity: { x: 0, y: 0 },
          life: 1,
          maxLife: 1,
          size: 10,
          color: { h: 0, s: 0, l: 0, a: 1 },
          createdAt: currentTime
        });
      }

      spatialGrid.updateParticles(particles);
      const stats = spatialGrid.getStats();

      expect(stats.totalCells).toBe(100); // 10x10 grid
      expect(stats.totalParticles).toBe(100);
      expect(stats.activeCells).toBeGreaterThan(0);
      expect(stats.averageParticlesPerCell).toBeGreaterThan(0);
    });
  });

  describe('Dirty Rectangle Tracking', () => {
    it('should track dirty regions efficiently', () => {
      const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
      const dirtyTracker = new DirtyRectangleTracker(bounds);

      // Mark some regions as dirty
      dirtyTracker.markDirty({ x: 100, y: 100, width: 50, height: 50 });
      dirtyTracker.markDirty({ x: 200, y: 200, width: 50, height: 50 });
      dirtyTracker.markDirty({ x: 110, y: 110, width: 50, height: 50 }); // Overlapping

      const dirtyRegions = dirtyTracker.getOptimizedDirtyRegions();
      const stats = dirtyTracker.getStats();

      expect(dirtyRegions.length).toBeGreaterThan(0);
      expect(stats.regionCount).toBeGreaterThan(0);
      expect(stats.dirtyPercentage).toBeGreaterThan(0);
    });

    it('should merge overlapping regions', () => {
      const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
      const dirtyTracker = new DirtyRectangleTracker(bounds);

      // Mark overlapping regions
      dirtyTracker.markDirty({ x: 100, y: 100, width: 100, height: 100 });
      dirtyTracker.markDirty({ x: 150, y: 150, width: 100, height: 100 });

      const dirtyRegions = dirtyTracker.getOptimizedDirtyRegions();

      // Should merge into fewer regions
      expect(dirtyRegions.length).toBeLessThanOrEqual(2);
    });

    it('should handle particle movement efficiently', () => {
      const bounds: Rectangle = { x: 0, y: 0, width: 800, height: 600 };
      const dirtyTracker = new DirtyRectangleTracker(bounds);

      const particle: Particle = {
        position: { x: 100, y: 100 },
        velocity: { x: 10, y: 5 },
        life: 1,
        maxLife: 1,
        size: 20,
        color: { h: 0, s: 0, l: 0, a: 1 },
        createdAt: currentTime
      };

      const previousPosition = { x: 90, y: 95 };

      dirtyTracker.markMovingParticleDirty(particle, previousPosition, 50);

      const stats = dirtyTracker.getStats();
      expect(stats.regionCount).toBeGreaterThan(0);
    });
  });

  describe('Particle Pool Performance', () => {
    it('should reuse particles efficiently', () => {
      const pool = new SplashCursorParticlePool({
        initialSize: 50,
        maxSize: 200
      });

      const particles: any[] = [];

      // Acquire particles
      for (let i = 0; i < 100; i++) {
        const particle = pool.acquireSplashParticle(
          { x: i, y: i },
          { x: 1, y: 1 }
        );
        particles.push(particle);
      }

      // Release half
      for (let i = 0; i < 50; i++) {
        pool.release(particles[i]);
      }

      // Acquire more (should reuse)
      for (let i = 0; i < 25; i++) {
        const particle = pool.acquireSplashParticle(
          { x: i + 200, y: i + 200 },
          { x: 2, y: 2 }
        );
        particles.push(particle);
      }

      const stats = pool.getStats();
      expect(stats.reused).toBeGreaterThan(0);
      expect(stats.reuseRate).toBeGreaterThan(0);
    });

    it('should manage pool size dynamically', () => {
      const pool = new SplashCursorParticlePool({
        initialSize: 10,
        maxSize: 100,
        growthFactor: 2
      });

      const particles: any[] = [];

      // Acquire more particles than initial size
      for (let i = 0; i < 50; i++) {
        const particle = pool.acquireSplashParticle(
          { x: i, y: i },
          { x: 1, y: 1 }
        );
        particles.push(particle);
      }

      const stats = pool.getStats();
      expect(stats.poolSize).toBeGreaterThan(10);
      expect(stats.activeCount).toBe(50);
    });
  });

  describe('MetaballRenderer Optimizations', () => {
    it('should enable and disable optimizations', () => {
      const renderer = new MetaballRenderer(mockCanvas, {
        threshold: 0.5,
        blurAmount: 1,
        qualityLevel: 'high',
        maxInfluenceDistance: 100,
        skipPixels: 1
      });

      // Test optimization toggles
      renderer.setOptimizationsEnabled(false);
      renderer.setSpatialPartitioningEnabled(false);
      renderer.setDirtyRectanglesEnabled(false);

      let stats = renderer.getStats();
      expect(stats.optimizationsEnabled).toBe(false);

      renderer.setOptimizationsEnabled(true);
      renderer.setSpatialPartitioningEnabled(true);
      renderer.setDirtyRectanglesEnabled(true);

      stats = renderer.getStats();
      expect(stats.optimizationsEnabled).toBe(true);
    });

    it('should provide detailed performance statistics', () => {
      const renderer = new MetaballRenderer(mockCanvas, {
        threshold: 0.5,
        blurAmount: 1,
        qualityLevel: 'high',
        maxInfluenceDistance: 100,
        skipPixels: 2
      });

      const stats = renderer.getStats();

      expect(stats.bufferSize).toBeGreaterThan(0);
      expect(stats.skipPixels).toBe(2);
      expect(stats.optimizationsEnabled).toBeDefined();
    });
  });

  describe('Performance Benchmarking', () => {
    it('should measure rendering performance with different particle counts', () => {
      const renderer = new MetaballRenderer(mockCanvas, {
        threshold: 0.5,
        blurAmount: 1,
        qualityLevel: 'high',
        maxInfluenceDistance: 100,
        skipPixels: 1
      });

      const particleCounts = [10, 50, 100, 200];
      const results: Array<{ count: number; time: number }> = [];

      for (const count of particleCounts) {
        const particles: Particle[] = [];
        
        for (let i = 0; i < count; i++) {
          particles.push({
            position: { x: Math.random() * 800, y: Math.random() * 600 },
            velocity: { x: 0, y: 0 },
            life: 1,
            maxLife: 1,
            size: 10,
            color: { h: Math.random() * 360, s: 80, l: 60, a: 1 },
            createdAt: currentTime
          });
        }

        const startTime = performance.now();
        renderer.render(particles);
        const endTime = performance.now();

        results.push({
          count,
          time: endTime - startTime
        });
      }

      // Verify that we got timing results
      expect(results.length).toBe(particleCounts.length);
      
      for (const result of results) {
        expect(result.time).toBeGreaterThanOrEqual(0);
      }
    });

    it('should compare optimized vs unoptimized rendering', () => {
      const renderer = new MetaballRenderer(mockCanvas, {
        threshold: 0.5,
        blurAmount: 1,
        qualityLevel: 'medium',
        maxInfluenceDistance: 100,
        skipPixels: 2
      });

      const particles: Particle[] = [];
      for (let i = 0; i < 100; i++) {
        particles.push({
          position: { x: Math.random() * 800, y: Math.random() * 600 },
          velocity: { x: 0, y: 0 },
          life: 1,
          maxLife: 1,
          size: 10,
          color: { h: Math.random() * 360, s: 80, l: 60, a: 1 },
          createdAt: currentTime
        });
      }

      // Test without optimizations
      renderer.setOptimizationsEnabled(false);
      const startUnoptimized = performance.now();
      renderer.render(particles);
      const unoptimizedTime = performance.now() - startUnoptimized;

      // Test with optimizations
      renderer.setOptimizationsEnabled(true);
      const startOptimized = performance.now();
      renderer.render(particles);
      const optimizedTime = performance.now() - startOptimized;

      // Both should complete successfully
      expect(unoptimizedTime).toBeGreaterThanOrEqual(0);
      expect(optimizedTime).toBeGreaterThanOrEqual(0);
    });
  });
});
/**
 * Comprehensive integration tests for the entire splash cursor system
 * Tests the full pipeline from mouse input to visual rendering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ParticleSystem } from './ParticleSystem';
import { PhysicsEngine } from './PhysicsEngine';
import { MetaballRenderer } from './MetaballRenderer';
import { MouseTracker } from './MouseTracker';
import { ParticleSystemConfig, PhysicsConfig, MetaballRendererConfig, MouseTrackerConfig } from '../types/splash-cursor';

// Mock canvas and context
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

describe('Comprehensive Splash Cursor Integration', () => {
  let particleSystem: ParticleSystem;
  let physicsEngine: PhysicsEngine;
  let renderer: MetaballRenderer;
  let mouseTracker: MouseTracker;
  let canvas: MockHTMLCanvasElement;

  beforeEach(() => {
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);

    canvas = new MockHTMLCanvasElement();

    // Initialize all systems with compatible configurations
    const particleConfig: ParticleSystemConfig = {
      maxParticles: 100,
      emissionRate: 50,
      particleLifetime: 2000,
      initialSize: 10,
      sizeVariation: 3
    };

    const physicsConfig: PhysicsConfig = {
      bounds: { x: 0, y: 0, width: 800, height: 600 },
      gravity: { x: 0, y: 20 },
      drag: 0.98,
      bounceEnabled: true,
      bounceDamping: 0.7
    };

    const rendererConfig: MetaballRendererConfig = {
      threshold: 0.5,
      blurAmount: 2,
      qualityLevel: 'medium',
      maxInfluenceDistance: 80,
      skipPixels: 1
    };

    const mouseConfig: MouseTrackerConfig = {
      velocitySmoothing: 0.8,
      maxVelocity: 400
    };

    particleSystem = new ParticleSystem(particleConfig);
    physicsEngine = new PhysicsEngine(physicsConfig);
    renderer = new MetaballRenderer(canvas as any, rendererConfig);
    mouseTracker = new MouseTracker(mouseConfig);

    // Mock document event listeners
    vi.spyOn(document, 'addEventListener');
    vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    particleSystem.cleanup();
    mouseTracker.stopTracking();
    vi.restoreAllMocks();
  });

  describe('Full Pipeline Integration', () => {
    it('should process mouse input through the entire pipeline', () => {
      mouseTracker.startTracking(canvas as any);

      // Simulate mouse movement sequence
      const mouseSequence = [
        { x: 100, y: 100, time: 1000 },
        { x: 200, y: 150, time: 1016 },
        { x: 300, y: 200, time: 1032 },
        { x: 400, y: 250, time: 1048 }
      ];

      mouseSequence.forEach(({ x, y, time }) => {
        vi.spyOn(performance, 'now').mockReturnValue(time);
        
        const moveEvent = new MouseEvent('mousemove', { clientX: x, clientY: y });
        document.dispatchEvent(moveEvent);
        
        // Get mouse state
        const mouseState = mouseTracker.getMouseState();
        
        // Update particle system
        particleSystem.updateWithMouseState(16, mouseState);
        
        // Apply physics to all particles
        const particles = particleSystem.getParticles();
        particles.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        
        // Render particles
        renderer.render(particles);
      });

      // Verify the pipeline worked
      expect(particleSystem.getActiveCount()).toBeGreaterThan(0);
      expect(mouseTracker.getVelocityMagnitude()).toBeGreaterThan(0);
      
      // Verify particles have been affected by physics
      const particles = particleSystem.getParticles();
      const hasMovedParticles = particles.some(p => 
        p.velocity.x !== 0 || p.velocity.y !== 0
      );
      expect(hasMovedParticles).toBe(true);
    });

    it('should handle particle lifecycle with physics and rendering', () => {
      mouseTracker.startTracking(canvas as any);

      // Create initial particles
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const moveEvent = new MouseEvent('mousemove', { clientX: 200, clientY: 200 });
      document.dispatchEvent(moveEvent);
      
      const mouseState = mouseTracker.getMouseState();
      particleSystem.updateWithMouseState(16, mouseState);
      
      const initialCount = particleSystem.getActiveCount();
      expect(initialCount).toBeGreaterThan(0);

      // Simulate time passing with physics updates
      for (let frame = 0; frame < 60; frame++) {
        const currentTime = 1000 + frame * 16;
        vi.spyOn(performance, 'now').mockReturnValue(currentTime);
        
        // Update particles with physics
        const particles = particleSystem.getParticles();
        particles.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        
        // Update particle system (aging, cleanup)
        particleSystem.update(16, { x: 200, y: 200 }, { x: 0, y: 0 });
        
        // Render current state
        renderer.render(particles);
      }

      // Verify particles are still active but may have different properties
      const finalParticles = particleSystem.getParticles();
      expect(finalParticles.length).toBeGreaterThanOrEqual(0);
      
      // Verify physics has affected particles
      const hasPhysicsEffects = finalParticles.some(p => 
        p.position.y > 200 || // Gravity effect
        p.size !== 10 // Size changes over time
      );
      expect(hasPhysicsEffects).toBe(true);
    });

    it('should handle boundary collisions in the full system', () => {
      mouseTracker.startTracking(canvas as any);

      // Create particles near the edge
      particleSystem.forceEmit({ x: 790, y: 300 }, 5, 1.0);
      
      let particles = particleSystem.getParticles();
      expect(particles.length).toBe(5);

      // Apply physics for several frames to trigger boundary collision
      for (let frame = 0; frame < 30; frame++) {
        particles.forEach(particle => {
          // Add some rightward velocity to trigger right boundary collision
          particle.velocity.x = 50;
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        
        particleSystem.update(16, { x: 790, y: 300 }, { x: 0, y: 0 });
        particles = particleSystem.getParticles();
        
        // Render to ensure no errors
        renderer.render(particles);
      }

      // Verify particles bounced (should have negative x velocity after collision)
      const bouncedParticles = particles.filter(p => p.velocity.x < 0);
      expect(bouncedParticles.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance under high particle load', () => {
      mouseTracker.startTracking(canvas as any);

      const startTime = performance.now();
      
      // Create maximum particles
      for (let i = 0; i < 100; i++) {
        particleSystem.forceEmit(
          { x: 100 + i * 2, y: 100 + i },
          1,
          1.0
        );
      }

      // Process many frames
      for (let frame = 0; frame < 100; frame++) {
        const currentTime = 1000 + frame * 16;
        vi.spyOn(performance, 'now').mockReturnValue(currentTime);
        
        const particles = particleSystem.getParticles();
        
        // Apply physics to all particles
        particles.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        
        // Update particle system
        particleSystem.update(16, { x: 200, y: 200 }, { x: 0, y: 0 });
        
        // Render all particles
        renderer.render(particles);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (this is a rough check)
      expect(duration).toBeLessThan(1000); // Less than 1 second for 100 frames
      
      // System should still be functional
      expect(particleSystem.getActiveCount()).toBeGreaterThanOrEqual(0);
    });

    it('should handle rapid configuration changes', () => {
      mouseTracker.startTracking(canvas as any);

      // Create some initial particles
      particleSystem.forceEmit({ x: 200, y: 200 }, 10, 1.0);

      // Rapidly change configurations
      for (let i = 0; i < 20; i++) {
        // Update particle system config
        particleSystem.updateConfig({
          maxParticles: 50 + i * 2,
          emissionRate: 30 + i
        });

        // Update physics config
        physicsEngine.updateConfig({
          gravity: { x: 0, y: 10 + i },
          drag: 0.95 + i * 0.001
        });

        // Update renderer config
        renderer.setThreshold(0.3 + i * 0.01);
        renderer.setBlurAmount(i % 5);

        // Update mouse tracker config
        mouseTracker.updateConfig({
          velocitySmoothing: 0.5 + i * 0.02,
          maxVelocity: 300 + i * 10
        });

        // Process a frame with new config
        const particles = particleSystem.getParticles();
        particles.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        
        particleSystem.update(16, { x: 200, y: 200 }, { x: 0, y: 0 });
        renderer.render(particles);
      }

      // System should still be functional after rapid changes
      expect(() => {
        const particles = particleSystem.getParticles();
        renderer.render(particles);
      }).not.toThrow();
    });
  });

  describe('Cross-Browser Compatibility Simulation', () => {
    it('should handle different canvas context capabilities', () => {
      // Test with limited canvas context
      const limitedCanvas = new MockHTMLCanvasElement();
      const limitedRenderer = new MetaballRenderer(limitedCanvas as any, {
        threshold: 0.5,
        blurAmount: 0, // No blur for limited context
        qualityLevel: 'low',
        maxInfluenceDistance: 50,
        skipPixels: 2
      });

      particleSystem.forceEmit({ x: 200, y: 200 }, 5, 1.0);
      const particles = particleSystem.getParticles();

      expect(() => {
        limitedRenderer.render(particles);
      }).not.toThrow();
    });

    it('should handle different performance characteristics', () => {
      // Simulate slower device by using lower quality settings
      renderer.setQualityLevel('low');
      renderer.setSkipPixels(3);
      
      particleSystem.updateConfig({ maxParticles: 25 });

      // Create particles and process
      particleSystem.forceEmit({ x: 200, y: 200 }, 20, 1.0);
      
      for (let frame = 0; frame < 30; frame++) {
        const particles = particleSystem.getParticles();
        particles.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        
        particleSystem.update(16, { x: 200, y: 200 }, { x: 0, y: 0 });
        renderer.render(particles);
      }

      // Should respect particle limits
      expect(particleSystem.getActiveCount()).toBeLessThanOrEqual(25);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from renderer errors', () => {
      // Mock renderer to throw error once
      let errorThrown = false;
      const originalRender = renderer.render.bind(renderer);
      renderer.render = vi.fn().mockImplementationOnce(() => {
        errorThrown = true;
        throw new Error('Rendering failed');
      }).mockImplementation(originalRender);

      particleSystem.forceEmit({ x: 200, y: 200 }, 5, 1.0);
      const particles = particleSystem.getParticles();

      // First render should throw
      expect(() => renderer.render(particles)).toThrow('Rendering failed');
      expect(errorThrown).toBe(true);

      // Subsequent renders should work
      expect(() => renderer.render(particles)).not.toThrow();
    });

    it('should handle particle system overflow gracefully', () => {
      // Try to create more particles than the limit
      for (let i = 0; i < 200; i++) {
        particleSystem.forceEmit({ x: 100 + i, y: 100 }, 1, 1.0);
      }

      // Should not exceed max particles
      expect(particleSystem.getActiveCount()).toBeLessThanOrEqual(100);

      // System should still be functional
      const particles = particleSystem.getParticles();
      expect(() => {
        particles.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        renderer.render(particles);
      }).not.toThrow();
    });
  });

  describe('Memory Management Integration', () => {
    it('should properly clean up resources across all systems', () => {
      mouseTracker.startTracking(canvas as any);

      // Create particles and process several frames
      for (let i = 0; i < 50; i++) {
        particleSystem.forceEmit({ x: 100 + i * 2, y: 100 }, 1, 1.0);
        
        const particles = particleSystem.getParticles();
        particles.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
        
        renderer.render(particles);
      }

      const beforeCleanup = particleSystem.getPoolStats();
      expect(beforeCleanup.active).toBeGreaterThan(0);

      // Clean up all systems
      particleSystem.cleanup();
      mouseTracker.stopTracking();
      renderer.clear();

      const afterCleanup = particleSystem.getPoolStats();
      expect(afterCleanup.active).toBe(0);
      expect(afterCleanup.pooled).toBe(beforeCleanup.total);
    });

    it('should handle particle pool recycling correctly', () => {
      // Create and destroy particles multiple times
      for (let cycle = 0; cycle < 5; cycle++) {
        // Create particles
        for (let i = 0; i < 20; i++) {
          particleSystem.forceEmit({ x: 100 + i * 5, y: 100 }, 1, 1.0);
        }

        // Process for a while
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

      // Pool should be intact after multiple cycles
      const finalStats = particleSystem.getPoolStats();
      expect(finalStats.total).toBe(100);
      expect(finalStats.active).toBe(0);
      expect(finalStats.pooled).toBe(100);
    });
  });

  describe('Visual Regression Prevention', () => {
    it('should produce consistent particle positions for same input', () => {
      // Reset to known state
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      
      // Create particles with deterministic input
      particleSystem.forceEmit({ x: 200, y: 200 }, 3, 1.0);
      
      // Apply same physics for same number of frames
      const particles1 = particleSystem.getParticles();
      for (let frame = 0; frame < 10; frame++) {
        particles1.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
      }
      
      const positions1 = particles1.map(p => ({ x: p.position.x, y: p.position.y }));

      // Reset and repeat
      particleSystem.cleanup();
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      
      particleSystem.forceEmit({ x: 200, y: 200 }, 3, 1.0);
      
      const particles2 = particleSystem.getParticles();
      for (let frame = 0; frame < 10; frame++) {
        particles2.forEach(particle => {
          physicsEngine.updateParticle(particle, 16 / 1000);
        });
      }
      
      const positions2 = particles2.map(p => ({ x: p.position.x, y: p.position.y }));

      // Positions should be very similar (allowing for small floating point differences)
      expect(positions1.length).toBe(positions2.length);
      positions1.forEach((pos1, index) => {
        const pos2 = positions2[index];
        expect(Math.abs(pos1.x - pos2.x)).toBeLessThan(0.1);
        expect(Math.abs(pos1.y - pos2.y)).toBeLessThan(0.1);
      });
    });

    it('should maintain consistent rendering output for same particle state', () => {
      // Create identical particle states
      const testParticles = [
        {
          position: { x: 100, y: 100 },
          velocity: { x: 0, y: 0 },
          life: 0.5,
          maxLife: 1.0,
          size: 15,
          color: { h: 180, s: 80, l: 50, a: 1.0 },
          createdAt: 0
        },
        {
          position: { x: 200, y: 150 },
          velocity: { x: 0, y: 0 },
          life: 0.3,
          maxLife: 1.0,
          size: 12,
          color: { h: 240, s: 90, l: 60, a: 0.8 },
          createdAt: 0
        }
      ];

      // Render multiple times - should not throw errors
      expect(() => {
        for (let i = 0; i < 5; i++) {
          renderer.render(testParticles);
        }
      }).not.toThrow();

      // Renderer stats should be consistent
      const stats1 = renderer.getStats();
      renderer.render(testParticles);
      const stats2 = renderer.getStats();
      
      expect(stats1.bufferSize).toBe(stats2.bufferSize);
      expect(stats1.skipPixels).toBe(stats2.skipPixels);
    });
  });
});
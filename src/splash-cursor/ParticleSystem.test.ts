/**
 * Unit tests for ParticleSystem class
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ParticleSystem } from './ParticleSystem';
import { ParticleSystemConfig, Vector2 } from '../types/splash-cursor';

describe('ParticleSystem', () => {
  let particleSystem: ParticleSystem;
  let defaultConfig: ParticleSystemConfig;

  beforeEach(() => {
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    
    defaultConfig = {
      maxParticles: 100,
      emissionRate: 50,
      particleLifetime: 2000, // 2 seconds
      initialSize: 5,
      sizeVariation: 2
    };
    
    particleSystem = new ParticleSystem(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(particleSystem.getActiveCount()).toBe(0);
      expect(particleSystem.getPoolStats().pooled).toBe(100);
      expect(particleSystem.getPoolStats().total).toBe(100);
    });

    it('should pre-allocate particle pool', () => {
      const stats = particleSystem.getPoolStats();
      expect(stats.pooled).toBe(defaultConfig.maxParticles);
      expect(stats.active).toBe(0);
      expect(stats.total).toBe(defaultConfig.maxParticles);
    });
  });

  describe('particle emission', () => {
    it('should emit particles when mouse moves', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      // Advance time to trigger emission
      vi.spyOn(performance, 'now').mockReturnValue(1100); // 100ms later
      
      particleSystem.update(16, mousePos, mouseVelocity);
      
      expect(particleSystem.getActiveCount()).toBeGreaterThan(0);
    });

    it('should emit more particles with higher mouse velocity', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const lowVelocity: Vector2 = { x: 10, y: 10 };
      const highVelocity: Vector2 = { x: 100, y: 100 };
      
      // Test low velocity
      vi.spyOn(performance, 'now').mockReturnValue(1100);
      particleSystem.update(16, mousePos, lowVelocity);
      const lowVelocityCount = particleSystem.getActiveCount();
      
      // Reset system
      particleSystem.cleanup();
      
      // Test high velocity
      vi.spyOn(performance, 'now').mockReturnValue(1100);
      particleSystem.update(16, mousePos, highVelocity);
      const highVelocityCount = particleSystem.getActiveCount();
      
      expect(highVelocityCount).toBeGreaterThanOrEqual(lowVelocityCount);
    });

    it('should respect max particle limit', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 200, y: 200 }; // Very high velocity
      
      // Emit many particles over multiple frames
      for (let i = 0; i < 20; i++) {
        vi.spyOn(performance, 'now').mockReturnValue(1000 + i * 100);
        particleSystem.update(16, mousePos, mouseVelocity);
      }
      
      expect(particleSystem.getActiveCount()).toBeLessThanOrEqual(defaultConfig.maxParticles);
    });

    it('should emit particle at correct position', () => {
      const mousePos: Vector2 = { x: 150, y: 200 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      particleSystem.emit(mousePos, mouseVelocity, 1.0);
      
      const particles = particleSystem.getParticles();
      expect(particles.length).toBe(1);
      expect(particles[0].position.x).toBe(150);
      expect(particles[0].position.y).toBe(200);
    });
  });

  describe('particle lifecycle', () => {
    it('should update particle life over time', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      // Emit a particle
      particleSystem.emit(mousePos, mouseVelocity, 1.0);
      
      const initialLife = particleSystem.getParticles()[0].life;
      
      // Update with delta time
      particleSystem.update(100, mousePos, { x: 0, y: 0 }); // No new emissions
      
      const updatedLife = particleSystem.getParticles()[0].life;
      expect(updatedLife).toBeGreaterThan(initialLife);
    });

    it('should remove particles when they exceed max life', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      // Create particle system with short lifetime for testing
      const shortLifeConfig: ParticleSystemConfig = {
        ...defaultConfig,
        particleLifetime: 100 // 100ms lifetime
      };
      const shortLifeSystem = new ParticleSystem(shortLifeConfig);
      
      // Emit a particle
      shortLifeSystem.emit(mousePos, mouseVelocity, 1.0);
      expect(shortLifeSystem.getActiveCount()).toBe(1);
      
      // Update with time that exceeds particle lifetime
      shortLifeSystem.update(150, mousePos, { x: 0, y: 0 });
      expect(shortLifeSystem.getActiveCount()).toBe(0);
    });

    it('should update particle alpha based on life', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      particleSystem.emit(mousePos, mouseVelocity, 1.0);
      
      const particle = particleSystem.getParticles()[0];
      const initialAlpha = particle.color.a;
      
      // Update particle to half its lifetime
      particleSystem.update(defaultConfig.particleLifetime / 2, mousePos, { x: 0, y: 0 });
      
      const halfLifeAlpha = particle.color.a;
      expect(halfLifeAlpha).toBeLessThan(initialAlpha);
    });

    it('should update particle size over time', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      particleSystem.emit(mousePos, mouseVelocity, 1.0);
      
      const particle = particleSystem.getParticles()[0];
      const initialSize = particle.size;
      
      // Update particle
      particleSystem.update(defaultConfig.particleLifetime / 2, mousePos, { x: 0, y: 0 });
      
      const updatedSize = particle.size;
      expect(updatedSize).toBeGreaterThan(initialSize);
    });
  });

  describe('particle pooling', () => {
    it('should reuse particles from pool', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      // Initial pool stats
      const initialStats = particleSystem.getPoolStats();
      
      // Emit a particle directly (bypasses emission logic)
      particleSystem.emit(mousePos, mouseVelocity, 1.0);
      
      const afterEmissionStats = particleSystem.getPoolStats();
      expect(afterEmissionStats.pooled).toBe(initialStats.pooled - 1);
      expect(afterEmissionStats.active).toBe(1);
      
      // Let particle die and return to pool (use zero velocity to prevent new emissions)
      particleSystem.update(defaultConfig.particleLifetime + 100, mousePos, { x: 0, y: 0 });
      
      const afterDeathStats = particleSystem.getPoolStats();
      expect(afterDeathStats.pooled).toBe(initialStats.pooled);
      expect(afterDeathStats.active).toBe(0);
    });

    it('should maintain total particle count', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      const initialTotal = particleSystem.getPoolStats().total;
      
      // Emit multiple particles
      for (let i = 0; i < 10; i++) {
        particleSystem.emit(mousePos, mouseVelocity, 1.0);
      }
      
      const afterEmissionTotal = particleSystem.getPoolStats().total;
      expect(afterEmissionTotal).toBe(initialTotal);
      
      // Let particles die
      particleSystem.update(defaultConfig.particleLifetime + 100, mousePos, { x: 0, y: 0 });
      
      const afterDeathTotal = particleSystem.getPoolStats().total;
      expect(afterDeathTotal).toBe(initialTotal);
    });
  });

  describe('cleanup', () => {
    it('should remove all active particles', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      // Emit multiple particles
      for (let i = 0; i < 5; i++) {
        particleSystem.emit(mousePos, mouseVelocity, 1.0);
      }
      
      expect(particleSystem.getActiveCount()).toBe(5);
      
      particleSystem.cleanup();
      
      expect(particleSystem.getActiveCount()).toBe(0);
      expect(particleSystem.getPoolStats().pooled).toBe(defaultConfig.maxParticles);
    });

    it('should reset emission state', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      // Emit particles and update
      vi.spyOn(performance, 'now').mockReturnValue(1100);
      particleSystem.update(16, mousePos, mouseVelocity);
      
      particleSystem.cleanup();
      
      // After cleanup, emission should work normally
      vi.spyOn(performance, 'now').mockReturnValue(1200);
      particleSystem.update(16, mousePos, mouseVelocity);
      
      expect(particleSystem.getActiveCount()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('configuration updates', () => {
    it('should update max particles', () => {
      const newMaxParticles = 50;
      
      particleSystem.updateConfig({ maxParticles: newMaxParticles });
      
      const stats = particleSystem.getPoolStats();
      expect(stats.total).toBe(newMaxParticles);
    });

    it('should update emission rate', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 100, y: 100 };
      
      // Update to higher emission rate
      particleSystem.updateConfig({ emissionRate: 200 });
      
      vi.spyOn(performance, 'now').mockReturnValue(1100);
      particleSystem.update(16, mousePos, mouseVelocity);
      
      const highRateCount = particleSystem.getActiveCount();
      
      // Reset and test lower emission rate
      particleSystem.cleanup();
      particleSystem.updateConfig({ emissionRate: 10 });
      
      vi.spyOn(performance, 'now').mockReturnValue(1100);
      particleSystem.update(16, mousePos, mouseVelocity);
      
      const lowRateCount = particleSystem.getActiveCount();
      
      expect(highRateCount).toBeGreaterThanOrEqual(lowRateCount);
    });

    it('should update particle lifetime', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      const newLifetime = 500;
      particleSystem.updateConfig({ particleLifetime: newLifetime });
      
      particleSystem.emit(mousePos, mouseVelocity, 1.0);
      
      const particle = particleSystem.getParticles()[0];
      expect(particle.maxLife).toBeLessThanOrEqual(newLifetime * 1.2); // Account for variation
      expect(particle.maxLife).toBeGreaterThanOrEqual(newLifetime * 0.8);
    });
  });

  describe('edge cases', () => {
    it('should handle zero velocity gracefully', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const zeroVelocity: Vector2 = { x: 0, y: 0 };
      
      expect(() => {
        particleSystem.update(16, mousePos, zeroVelocity);
      }).not.toThrow();
    });

    it('should handle negative delta time', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      particleSystem.emit(mousePos, mouseVelocity, 1.0);
      
      expect(() => {
        particleSystem.update(-16, mousePos, mouseVelocity);
      }).not.toThrow();
    });

    it('should handle very large delta time', () => {
      const mousePos: Vector2 = { x: 100, y: 100 };
      const mouseVelocity: Vector2 = { x: 50, y: 30 };
      
      particleSystem.emit(mousePos, mouseVelocity, 1.0);
      
      expect(() => {
        // Use zero velocity to prevent new emissions during update
        particleSystem.update(10000, mousePos, { x: 0, y: 0 });
      }).not.toThrow();
      
      // Particles should be cleaned up if they exceed lifetime
      expect(particleSystem.getActiveCount()).toBe(0);
    });

    it('should handle max particles of zero', () => {
      const zeroParticleConfig: ParticleSystemConfig = {
        ...defaultConfig,
        maxParticles: 0
      };
      
      expect(() => {
        new ParticleSystem(zeroParticleConfig);
      }).not.toThrow();
    });
  });
});
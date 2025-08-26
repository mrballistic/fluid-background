/**
 * Integration tests for ParticleSystem and MouseTracker working together
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ParticleSystem } from './ParticleSystem';
import { MouseTracker } from './MouseTracker';
import { ParticleSystemConfig } from '../types/splash-cursor';

// Mock HTMLCanvasElement
class MockCanvas {
  width = 800;
  height = 600;
  
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

describe('ParticleSystem + MouseTracker Integration', () => {
  let particleSystem: ParticleSystem;
  let mouseTracker: MouseTracker;
  let mockCanvas: MockCanvas;
  let defaultConfig: ParticleSystemConfig;

  beforeEach(() => {
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    
    defaultConfig = {
      maxParticles: 50,
      emissionRate: 30,
      particleLifetime: 1000,
      initialSize: 5,
      sizeVariation: 2
    };
    
    particleSystem = new ParticleSystem(defaultConfig);
    mouseTracker = new MouseTracker({
      velocitySmoothing: 0.5,
      maxVelocity: 500
    });
    
    mockCanvas = new MockCanvas();
    
    // Mock document event listeners
    vi.spyOn(document, 'addEventListener');
    vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    mouseTracker.stopTracking();
    particleSystem.cleanup();
    vi.restoreAllMocks();
  });

  describe('basic integration', () => {
    it('should emit particles based on mouse movement', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Simulate mouse movement
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const moveEvent1 = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(moveEvent1);
      
      vi.spyOn(performance, 'now').mockReturnValue(1016); // 16ms later
      const moveEvent2 = new MouseEvent('mousemove', { clientX: 200, clientY: 150 });
      document.dispatchEvent(moveEvent2);
      
      // Update particle system with mouse state
      const mouseState = mouseTracker.getMouseState();
      particleSystem.updateWithMouseState(16, mouseState);
      
      expect(particleSystem.getActiveCount()).toBeGreaterThan(0);
    });

    it('should not emit particles when mouse is stationary', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Simulate stationary mouse
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(moveEvent);
      
      // Update multiple times with same position
      for (let i = 0; i < 5; i++) {
        vi.spyOn(performance, 'now').mockReturnValue(1000 + i * 16);
        const mouseState = mouseTracker.getMouseState();
        particleSystem.updateWithMouseState(16, mouseState);
      }
      
      expect(particleSystem.getActiveCount()).toBe(0);
    });

    it('should emit more particles with faster mouse movement', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Test slow movement
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const slowMove1 = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(slowMove1);
      
      vi.spyOn(performance, 'now').mockReturnValue(1100); // 100ms later
      const slowMove2 = new MouseEvent('mousemove', { clientX: 110, clientY: 110 });
      document.dispatchEvent(slowMove2);
      
      const slowMouseState = mouseTracker.getMouseState();
      particleSystem.updateWithMouseState(16, slowMouseState);
      const slowParticleCount = particleSystem.getActiveCount();
      
      // Reset system
      particleSystem.cleanup();
      mouseTracker.reset();
      
      // Test fast movement
      vi.spyOn(performance, 'now').mockReturnValue(2000);
      const fastMove1 = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(fastMove1);
      
      vi.spyOn(performance, 'now').mockReturnValue(2016); // 16ms later
      const fastMove2 = new MouseEvent('mousemove', { clientX: 200, clientY: 200 });
      document.dispatchEvent(fastMove2);
      
      const fastMouseState = mouseTracker.getMouseState();
      particleSystem.updateWithMouseState(16, fastMouseState);
      const fastParticleCount = particleSystem.getActiveCount();
      
      expect(fastParticleCount).toBeGreaterThanOrEqual(slowParticleCount);
    });
  });

  describe('mouse click integration', () => {
    it('should emit particles on mouse click', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Simulate mouse click
      const clickEvent = new MouseEvent('mousedown', { clientX: 150, clientY: 200 });
      document.dispatchEvent(clickEvent);
      
      const mouseState = mouseTracker.getMouseState();
      
      // Force emit particles at click position
      particleSystem.forceEmit(mouseState.position, 5, 1.0);
      
      expect(particleSystem.getActiveCount()).toBe(5);
      
      // Check that particles are at the correct position
      const particles = particleSystem.getParticles();
      particles.forEach(particle => {
        expect(particle.position.x).toBe(150);
        expect(particle.position.y).toBe(200);
      });
    });

    it('should track mouse down state correctly', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      expect(mouseTracker.getMouseState().isDown).toBe(false);
      
      const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      document.dispatchEvent(mouseDownEvent);
      
      expect(mouseTracker.getMouseState().isDown).toBe(true);
      
      const mouseUpEvent = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });
      document.dispatchEvent(mouseUpEvent);
      
      expect(mouseTracker.getMouseState().isDown).toBe(false);
    });
  });

  describe('touch integration', () => {
    it('should handle touch events and emit particles', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Simulate touch start
      const touchStart = new TouchEvent('touchstart', {
        touches: [{
          clientX: 100,
          clientY: 100,
          identifier: 0
        } as Touch]
      });
      document.dispatchEvent(touchStart);
      
      // Simulate touch move
      vi.spyOn(performance, 'now').mockReturnValue(1016);
      const touchMove = new TouchEvent('touchmove', {
        touches: [{
          clientX: 200,
          clientY: 200,
          identifier: 0
        } as Touch]
      });
      document.dispatchEvent(touchMove);
      
      const mouseState = mouseTracker.getMouseState();
      particleSystem.updateWithMouseState(16, mouseState);
      
      expect(particleSystem.getActiveCount()).toBeGreaterThan(0);
      expect(mouseState.isDown).toBe(true);
    });
  });

  describe('performance integration', () => {
    it('should handle high-frequency updates efficiently', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Simulate rapid mouse movement
      for (let i = 0; i < 100; i++) {
        vi.spyOn(performance, 'now').mockReturnValue(1000 + i * 16);
        
        const moveEvent = new MouseEvent('mousemove', {
          clientX: 100 + i * 2,
          clientY: 100 + i
        });
        document.dispatchEvent(moveEvent);
        
        const mouseState = mouseTracker.getMouseState();
        particleSystem.updateWithMouseState(16, mouseState);
      }
      
      // Should not exceed max particles
      expect(particleSystem.getActiveCount()).toBeLessThanOrEqual(defaultConfig.maxParticles);
      
      // Should have reasonable performance (no crashes)
      expect(() => {
        const debugInfo = mouseTracker.getDebugInfo();
        const poolStats = particleSystem.getPoolStats();
        expect(debugInfo).toBeDefined();
        expect(poolStats).toBeDefined();
      }).not.toThrow();
    });

    it('should maintain particle pool integrity under stress', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Create and destroy many particles
      for (let cycle = 0; cycle < 10; cycle++) {
        // Emit particles
        for (let i = 0; i < 20; i++) {
          vi.spyOn(performance, 'now').mockReturnValue(1000 + cycle * 1000 + i * 16);
          
          const moveEvent = new MouseEvent('mousemove', {
            clientX: 100 + i * 10,
            clientY: 100 + i * 5
          });
          document.dispatchEvent(moveEvent);
          
          const mouseState = mouseTracker.getMouseState();
          particleSystem.updateWithMouseState(16, mouseState);
        }
        
        // Let particles die
        vi.spyOn(performance, 'now').mockReturnValue(1000 + cycle * 1000 + 2000);
        const mouseState = mouseTracker.getMouseState();
        particleSystem.updateWithMouseState(2000, { ...mouseState, velocity: { x: 0, y: 0 } });
      }
      
      // Pool should be intact
      const finalStats = particleSystem.getPoolStats();
      expect(finalStats.total).toBe(defaultConfig.maxParticles);
      expect(finalStats.active).toBe(0);
      expect(finalStats.pooled).toBe(defaultConfig.maxParticles);
    });
  });

  describe('configuration integration', () => {
    it('should handle dynamic configuration changes', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Update mouse tracker config
      mouseTracker.updateConfig({
        velocitySmoothing: 0.9,
        maxVelocity: 200
      });
      
      // Update particle system config
      particleSystem.updateConfig({
        maxParticles: 25,
        emissionRate: 60
      });
      
      // Test with new configuration
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const moveEvent1 = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(moveEvent1);
      
      vi.spyOn(performance, 'now').mockReturnValue(1016);
      const moveEvent2 = new MouseEvent('mousemove', { clientX: 300, clientY: 300 });
      document.dispatchEvent(moveEvent2);
      
      const mouseState = mouseTracker.getMouseState();
      particleSystem.updateWithMouseState(16, mouseState);
      
      // Should respect new max particles
      expect(particleSystem.getActiveCount()).toBeLessThanOrEqual(25);
      
      // Should respect new max velocity
      expect(mouseTracker.getVelocityMagnitude()).toBeLessThanOrEqual(200);
    });
  });

  describe('cleanup integration', () => {
    it('should clean up both systems properly', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Create some state
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(moveEvent);
      
      const mouseState = mouseTracker.getMouseState();
      particleSystem.forceEmit(mouseState.position, 10);
      
      expect(particleSystem.getActiveCount()).toBe(10);
      expect(mouseTracker.getVelocityMagnitude()).toBeGreaterThanOrEqual(0);
      
      // Clean up
      particleSystem.cleanup();
      mouseTracker.reset();
      mouseTracker.stopTracking();
      
      expect(particleSystem.getActiveCount()).toBe(0);
      expect(mouseTracker.getMouseState().velocity.x).toBe(0);
      expect(mouseTracker.getMouseState().velocity.y).toBe(0);
    });
  });
});
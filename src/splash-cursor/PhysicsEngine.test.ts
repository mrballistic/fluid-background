/**
 * Unit tests for PhysicsEngine class
 * Tests particle physics, collision detection, and force application
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsEngine } from './PhysicsEngine';
import { Particle, PhysicsConfig, Vector2, Rectangle } from '../types/splash-cursor';

describe('PhysicsEngine', () => {
  let physicsEngine: PhysicsEngine;
  let defaultConfig: PhysicsConfig;
  let testParticle: Particle;

  beforeEach(() => {
    defaultConfig = {
      bounds: { x: 0, y: 0, width: 800, height: 600 },
      gravity: { x: 0, y: 50 }, // Downward gravity
      drag: 0.99,
      bounceEnabled: true,
      bounceDamping: 0.8
    };

    physicsEngine = new PhysicsEngine(defaultConfig);

    testParticle = {
      position: { x: 400, y: 300 },
      velocity: { x: 100, y: -50 },
      life: 0,
      maxLife: 1000,
      size: 10,
      color: { h: 180, s: 100, l: 50, a: 1 },
      createdAt: 0
    };
  });

  describe('constructor', () => {
    it('should initialize with provided configuration', () => {
      const config = physicsEngine.getConfig();
      expect(config.bounds).toEqual(defaultConfig.bounds);
      expect(config.gravity).toEqual(defaultConfig.gravity);
      expect(config.drag).toBe(defaultConfig.drag);
      expect(config.bounceEnabled).toBe(defaultConfig.bounceEnabled);
      expect(config.bounceDamping).toBe(defaultConfig.bounceDamping);
    });
  });

  describe('applyForces', () => {
    it('should apply gravity to particle velocity', () => {
      const initialVelocity = { ...testParticle.velocity };
      const deltaTime = 1/60; // 60fps

      physicsEngine.applyForces(testParticle, deltaTime);

      // Both X and Y velocities are affected by drag
      const expectedDragFactor = Math.pow(defaultConfig.drag, deltaTime * 60);
      expect(testParticle.velocity.x).toBeCloseTo(initialVelocity.x * expectedDragFactor);
      expect(testParticle.velocity.y).toBeCloseTo((initialVelocity.y + defaultConfig.gravity.y * deltaTime) * expectedDragFactor);
    });

    it('should apply drag to reduce velocity', () => {
      testParticle.velocity = { x: 100, y: 100 };
      const deltaTime = 1/60;

      physicsEngine.applyForces(testParticle, deltaTime);

      // Velocity should be reduced due to drag
      expect(testParticle.velocity.x).toBeLessThan(100);
      expect(testParticle.velocity.y).toBeLessThan(100 + defaultConfig.gravity.y * deltaTime);
    });

    it('should handle zero gravity correctly', () => {
      physicsEngine.setGravity({ x: 0, y: 0 });
      const initialVelocity = { ...testParticle.velocity };
      const deltaTime = 1/60;

      physicsEngine.applyForces(testParticle, deltaTime);

      // Only drag should affect velocity
      const expectedDragFactor = Math.pow(defaultConfig.drag, deltaTime * 60);
      expect(testParticle.velocity.x).toBeCloseTo(initialVelocity.x * expectedDragFactor);
      expect(testParticle.velocity.y).toBeCloseTo(initialVelocity.y * expectedDragFactor);
    });

    it('should handle horizontal gravity', () => {
      physicsEngine.setGravity({ x: 30, y: 0 });
      const initialVelocity = { ...testParticle.velocity };
      const deltaTime = 1/60;

      physicsEngine.applyForces(testParticle, deltaTime);

      expect(testParticle.velocity.x).toBeCloseTo(initialVelocity.x * Math.pow(defaultConfig.drag, deltaTime * 60) + 30 * deltaTime);
      expect(testParticle.velocity.y).toBeCloseTo(initialVelocity.y * Math.pow(defaultConfig.drag, deltaTime * 60));
    });
  });

  describe('updateParticle', () => {
    it('should update particle position based on velocity', () => {
      const initialPosition = { ...testParticle.position };
      const deltaTime = 1/60;

      physicsEngine.updateParticle(testParticle, deltaTime);

      expect(testParticle.position.x).toBeCloseTo(initialPosition.x + testParticle.velocity.x * deltaTime, 5);
      expect(testParticle.position.y).toBeCloseTo(initialPosition.y + testParticle.velocity.y * deltaTime, 5);
    });

    it('should apply forces and update position in correct order', () => {
      testParticle.position = { x: 400, y: 300 };
      testParticle.velocity = { x: 0, y: 0 };
      const deltaTime = 1/60;

      physicsEngine.updateParticle(testParticle, deltaTime);

      // Position should change due to gravity affecting velocity
      expect(testParticle.position.y).toBeGreaterThan(300);
    });
  });

  describe('handleBoundaryCollision', () => {
    it('should bounce particle off left boundary', () => {
      testParticle.position = { x: -5, y: 300 }; // Outside left boundary
      testParticle.velocity = { x: -50, y: 0 };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(true);
      expect(testParticle.position.x).toBeGreaterThanOrEqual(testParticle.size * 0.5);
      expect(testParticle.velocity.x).toBeGreaterThan(0); // Should bounce right
      // Velocity should be reduced due to damping and effects, but in the right direction
      expect(testParticle.velocity.x).toBeLessThan(50); // Should be less than original speed
      expect(testParticle.velocity.x).toBeGreaterThan(30); // But not too small
    });

    it('should bounce particle off right boundary', () => {
      testParticle.position = { x: 805, y: 300 }; // Outside right boundary
      testParticle.velocity = { x: 50, y: 0 };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(true);
      expect(testParticle.position.x).toBeLessThanOrEqual(defaultConfig.bounds.width - testParticle.size * 0.5);
      expect(testParticle.velocity.x).toBeLessThan(0); // Should bounce left
      // Velocity should be reduced due to damping and effects, but in the right direction
      expect(testParticle.velocity.x).toBeGreaterThan(-50); // Should be less than original speed
      expect(testParticle.velocity.x).toBeLessThan(-30); // But not too small
    });

    it('should bounce particle off top boundary', () => {
      testParticle.position = { x: 400, y: -5 }; // Outside top boundary
      testParticle.velocity = { x: 0, y: -50 };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(true);
      expect(testParticle.position.y).toBeGreaterThanOrEqual(testParticle.size * 0.5);
      expect(testParticle.velocity.y).toBeGreaterThan(0); // Should bounce down
      // Velocity should be reduced due to damping and effects, but in the right direction
      expect(testParticle.velocity.y).toBeLessThan(50); // Should be less than original speed
      expect(testParticle.velocity.y).toBeGreaterThan(30); // But not too small
    });

    it('should bounce particle off bottom boundary', () => {
      testParticle.position = { x: 400, y: 605 }; // Outside bottom boundary
      testParticle.velocity = { x: 0, y: 50 };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(true);
      expect(testParticle.position.y).toBeLessThanOrEqual(defaultConfig.bounds.height - testParticle.size * 0.5);
      expect(testParticle.velocity.y).toBeLessThan(0); // Should bounce up
      // Velocity should be reduced due to damping and effects, but in the right direction
      expect(testParticle.velocity.y).toBeGreaterThan(-50); // Should be less than original speed
      expect(testParticle.velocity.y).toBeLessThan(-30); // But not too small
    });

    it('should handle corner collisions correctly', () => {
      testParticle.position = { x: -5, y: -5 }; // Outside top-left corner
      testParticle.velocity = { x: -50, y: -50 };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(true);
      expect(testParticle.velocity.x).toBeGreaterThan(0); // Should bounce right
      expect(testParticle.velocity.y).toBeGreaterThan(0); // Should bounce down
    });

    it('should not affect particles inside boundaries', () => {
      testParticle.position = { x: 400, y: 300 }; // Inside boundaries
      testParticle.velocity = { x: 50, y: 50 };
      const originalVelocity = { ...testParticle.velocity };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(false);
      expect(testParticle.velocity).toEqual(originalVelocity);
    });

    it('should respect bounce damping factor', () => {
      physicsEngine.setBounceDamping(0.5);
      testParticle.position = { x: -5, y: 300 };
      testParticle.velocity = { x: -100, y: 0 };

      physicsEngine.handleBoundaryCollision(testParticle);

      // Should be approximately 50% of original speed, with some variation from realistic effects
      expect(testParticle.velocity.x).toBeGreaterThan(0); // Should bounce right
      expect(testParticle.velocity.x).toBeLessThan(60); // Should be significantly reduced
      expect(testParticle.velocity.x).toBeGreaterThan(40); // But not too small
    });

    it('should not bounce when bouncing is disabled', () => {
      physicsEngine.setBounceEnabled(false);
      testParticle.position = { x: -5, y: 300 };
      testParticle.velocity = { x: -50, y: 0 };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(false);
      expect(testParticle.velocity.x).toBe(-50); // Velocity unchanged
    });
  });

  describe('configuration methods', () => {
    it('should update bounds correctly', () => {
      const newBounds: Rectangle = { x: 10, y: 10, width: 1000, height: 800 };
      physicsEngine.setBounds(newBounds);

      const config = physicsEngine.getConfig();
      expect(config.bounds).toEqual(newBounds);
    });

    it('should update gravity correctly', () => {
      const newGravity: Vector2 = { x: 10, y: -20 };
      physicsEngine.setGravity(newGravity);

      const config = physicsEngine.getConfig();
      expect(config.gravity).toEqual(newGravity);
    });

    it('should clamp drag values between 0 and 1', () => {
      physicsEngine.setDrag(-0.5);
      expect(physicsEngine.getConfig().drag).toBe(0);

      physicsEngine.setDrag(1.5);
      expect(physicsEngine.getConfig().drag).toBe(1);

      physicsEngine.setDrag(0.95);
      expect(physicsEngine.getConfig().drag).toBe(0.95);
    });

    it('should clamp bounce damping values between 0 and 1', () => {
      physicsEngine.setBounceDamping(-0.5);
      expect(physicsEngine.getConfig().bounceDamping).toBe(0);

      physicsEngine.setBounceDamping(1.5);
      expect(physicsEngine.getConfig().bounceDamping).toBe(1);

      physicsEngine.setBounceDamping(0.7);
      expect(physicsEngine.getConfig().bounceDamping).toBe(0.7);
    });

    it('should update configuration via updateConfig method', () => {
      const newConfig: Partial<PhysicsConfig> = {
        gravity: { x: 5, y: 10 },
        drag: 0.95,
        bounceEnabled: false
      };

      physicsEngine.updateConfig(newConfig);

      const config = physicsEngine.getConfig();
      expect(config.gravity).toEqual(newConfig.gravity);
      expect(config.drag).toBe(newConfig.drag);
      expect(config.bounceEnabled).toBe(newConfig.bounceEnabled);
    });
  });

  describe('energy calculations', () => {
    it('should calculate kinetic energy correctly', () => {
      testParticle.velocity = { x: 3, y: 4 }; // Magnitude = 5

      const kineticEnergy = physicsEngine.calculateKineticEnergy(testParticle);

      expect(kineticEnergy).toBe(12.5); // 0.5 * (3² + 4²) = 0.5 * 25 = 12.5
    });

    it('should calculate total kinetic energy for multiple particles', () => {
      const particles: Particle[] = [
        { ...testParticle, velocity: { x: 3, y: 4 } }, // KE = 12.5
        { ...testParticle, velocity: { x: 0, y: 0 } }, // KE = 0
        { ...testParticle, velocity: { x: 1, y: 1 } }  // KE = 1
      ];

      const totalEnergy = physicsEngine.getTotalKineticEnergy(particles);

      expect(totalEnergy).toBe(13.5); // 12.5 + 0 + 1
    });

    it('should handle zero velocity particles', () => {
      testParticle.velocity = { x: 0, y: 0 };

      const kineticEnergy = physicsEngine.calculateKineticEnergy(testParticle);

      expect(kineticEnergy).toBe(0);
    });
  });

  describe('frame rate independence', () => {
    it('should produce consistent results across different frame rates', () => {
      // Test with different delta times
      const particle1 = { ...testParticle };
      const particle2 = { ...testParticle };

      // Simulate 60fps (1/60 second per frame)
      for (let i = 0; i < 60; i++) {
        physicsEngine.updateParticle(particle1, 1/60);
      }

      // Simulate 30fps (1/30 second per frame)
      for (let i = 0; i < 30; i++) {
        physicsEngine.updateParticle(particle2, 1/30);
      }

      // Results should be approximately the same (within tolerance for numerical precision)
      expect(particle1.position.x).toBeCloseTo(particle2.position.x, 1);
      expect(particle1.position.y).toBeCloseTo(particle2.position.y, 1);
      expect(particle1.velocity.x).toBeCloseTo(particle2.velocity.x, 1);
      expect(particle1.velocity.y).toBeCloseTo(particle2.velocity.y, 1);
    });
  });

  describe('enhanced collision effects', () => {
    it('should apply friction effects on bounce', () => {
      testParticle.position = { x: -5, y: 300 };
      testParticle.velocity = { x: -100, y: 50 }; // Moving left with some vertical velocity

      const initialVerticalVelocity = testParticle.velocity.y;
      physicsEngine.handleBoundaryCollision(testParticle);

      // Vertical velocity should be reduced due to friction
      expect(Math.abs(testParticle.velocity.y)).toBeLessThan(Math.abs(initialVerticalVelocity));
    });

    it('should reduce particle size on bounce', () => {
      const initialSize = testParticle.size;
      testParticle.position = { x: -5, y: 300 };
      testParticle.velocity = { x: -50, y: 0 };

      physicsEngine.handleBoundaryCollision(testParticle);

      expect(testParticle.size).toBeLessThan(initialSize);
    });

    it('should add random variation to prevent stuck patterns', () => {
      testParticle.position = { x: -5, y: 300 };
      testParticle.velocity = { x: -100, y: 100 };

      const velocities: Vector2[] = [];
      
      // Perform multiple bounces and collect velocities
      for (let i = 0; i < 10; i++) {
        const particle = { ...testParticle };
        physicsEngine.handleBoundaryCollision(particle);
        velocities.push({ ...particle.velocity });
      }

      // Check that velocities have some variation (not all identical)
      const uniqueVelocities = velocities.filter((v, index, arr) => 
        !arr.slice(0, index).some(prev => 
          Math.abs(prev.x - v.x) < 0.001 && Math.abs(prev.y - v.y) < 0.001
        )
      );
      
      expect(uniqueVelocities.length).toBeGreaterThan(1);
    });
  });

  describe('boundary detection utilities', () => {
    it('should detect when particle is near boundary', () => {
      testParticle.position = { x: 15, y: 300 }; // 15 pixels from left edge
      
      expect(physicsEngine.isNearBoundary(testParticle, 20)).toBe(true);
      expect(physicsEngine.isNearBoundary(testParticle, 5)).toBe(false);
    });

    it('should calculate distance to nearest boundary correctly', () => {
      testParticle.position = { x: 50, y: 300 }; // 50 pixels from left, accounting for radius
      testParticle.size = 20; // radius = 10
      
      const distance = physicsEngine.getDistanceToBoundary(testParticle);
      
      expect(distance).toBe(40); // 50 - 10 (radius) = 40 pixels from left boundary
    });

    it('should find closest boundary when particle is in corner', () => {
      testParticle.position = { x: 20, y: 20 }; // Near top-left corner
      testParticle.size = 10; // radius = 5
      
      const distance = physicsEngine.getDistanceToBoundary(testParticle);
      
      expect(distance).toBe(15); // min(20-5, 20-5) = 15 pixels
    });

    it('should handle particles at center correctly', () => {
      testParticle.position = { x: 400, y: 300 }; // Center of 800x600 bounds
      testParticle.size = 10; // radius = 5
      
      const distance = physicsEngine.getDistanceToBoundary(testParticle);
      
      expect(distance).toBe(295); // min(395, 395, 295, 295) = 295 pixels
    });
  });

  describe('edge cases', () => {
    it('should handle particles exactly on boundaries', () => {
      testParticle.position = { x: testParticle.size * 0.5, y: 300 }; // Exactly on left boundary
      testParticle.velocity = { x: -10, y: 0 };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(true);
      expect(testParticle.velocity.x).toBeGreaterThan(0);
    });

    it('should handle very small particles', () => {
      testParticle.size = 0.1;
      testParticle.position = { x: -1, y: 300 };
      testParticle.velocity = { x: -50, y: 0 };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(true);
      expect(testParticle.position.x).toBeGreaterThanOrEqual(testParticle.size * 0.5);
    });

    it('should handle very large particles', () => {
      testParticle.size = 100;
      testParticle.position = { x: 50, y: 300 }; // Large particle near left edge
      testParticle.velocity = { x: -10, y: 0 };

      const collisionOccurred = physicsEngine.handleBoundaryCollision(testParticle);

      expect(collisionOccurred).toBe(true);
      expect(testParticle.position.x).toBeGreaterThanOrEqual(testParticle.size * 0.5);
    });

    it('should handle multiple rapid bounces', () => {
      testParticle.position = { x: 5, y: 5 }; // Near corner
      testParticle.velocity = { x: -100, y: -100 };
      testParticle.size = 10;

      let bounceCount = 0;
      for (let i = 0; i < 10; i++) {
        if (physicsEngine.handleBoundaryCollision(testParticle)) {
          bounceCount++;
        }
        // Simulate a small time step
        testParticle.position.x += testParticle.velocity.x * 0.001;
        testParticle.position.y += testParticle.velocity.y * 0.001;
      }

      expect(bounceCount).toBeGreaterThan(0);
      expect(testParticle.size).toBeLessThan(10); // Size should decrease with bounces
    });
  });
});
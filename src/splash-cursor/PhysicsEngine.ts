/**
 * PhysicsEngine class for handling particle physics including movement, forces, and collisions
 * Provides frame-rate independent physics with boundary collision detection
 */

import { 
  Particle, 
  PhysicsConfig, 
  Vector2, 
  Rectangle 
} from '../types/splash-cursor';

export class PhysicsEngine {
  private bounds: Rectangle;
  private gravity: Vector2;
  private drag: number;
  private bounceEnabled: boolean;
  private bounceDamping: number;

  constructor(config: PhysicsConfig) {
    this.bounds = { ...config.bounds };
    this.gravity = { ...config.gravity };
    this.drag = config.drag;
    this.bounceEnabled = config.bounceEnabled;
    this.bounceDamping = config.bounceDamping;
  }

  /**
   * Update a single particle's physics for one frame
   * Applies forces, updates position, and handles boundary collisions
   */
  updateParticle(particle: Particle, deltaTime: number): void {
    // Apply forces to the particle
    this.applyForces(particle, deltaTime);
    
    // Update position based on velocity
    particle.position.x += particle.velocity.x * deltaTime;
    particle.position.y += particle.velocity.y * deltaTime;
    
    // Handle boundary collisions if enabled
    if (this.bounceEnabled) {
      this.handleBoundaryCollision(particle);
    }
  }

  /**
   * Apply physics forces to a particle
   * Includes gravity and drag forces
   */
  applyForces(particle: Particle, deltaTime: number): void {
    // Apply gravity force
    particle.velocity.x += this.gravity.x * deltaTime;
    particle.velocity.y += this.gravity.y * deltaTime;
    
    // Apply drag force (air resistance)
    // Drag is applied as a multiplier each frame for exponential decay
    const dragFactor = Math.pow(this.drag, deltaTime * 60); // Normalize for 60fps
    particle.velocity.x *= dragFactor;
    particle.velocity.y *= dragFactor;
  }

  /**
   * Handle collision with screen boundaries
   * Returns true if a collision occurred
   */
  handleBoundaryCollision(particle: Particle): boolean {
    if (!this.bounceEnabled) {
      return false;
    }

    let collisionOccurred = false;
    const particleRadius = particle.size * 0.5;

    // Left boundary
    if (particle.position.x - particleRadius <= this.bounds.x) {
      particle.position.x = this.bounds.x + particleRadius;
      particle.velocity.x = Math.abs(particle.velocity.x) * this.bounceDamping;
      this.applyBounceEffects(particle, 'vertical');
      collisionOccurred = true;
    }
    
    // Right boundary
    else if (particle.position.x + particleRadius >= this.bounds.x + this.bounds.width) {
      particle.position.x = this.bounds.x + this.bounds.width - particleRadius;
      particle.velocity.x = -Math.abs(particle.velocity.x) * this.bounceDamping;
      this.applyBounceEffects(particle, 'vertical');
      collisionOccurred = true;
    }

    // Top boundary
    if (particle.position.y - particleRadius <= this.bounds.y) {
      particle.position.y = this.bounds.y + particleRadius;
      particle.velocity.y = Math.abs(particle.velocity.y) * this.bounceDamping;
      this.applyBounceEffects(particle, 'horizontal');
      collisionOccurred = true;
    }
    
    // Bottom boundary
    else if (particle.position.y + particleRadius >= this.bounds.y + this.bounds.height) {
      particle.position.y = this.bounds.y + this.bounds.height - particleRadius;
      particle.velocity.y = -Math.abs(particle.velocity.y) * this.bounceDamping;
      this.applyBounceEffects(particle, 'horizontal');
      collisionOccurred = true;
    }

    return collisionOccurred;
  }

  /**
   * Apply additional effects when a particle bounces
   * Includes energy loss and realistic physics behavior
   */
  private applyBounceEffects(particle: Particle, wallType: 'horizontal' | 'vertical'): void {
    // Apply additional energy loss to the perpendicular velocity component
    // This simulates friction and makes bounces more realistic
    const frictionDamping = 0.95;
    
    if (wallType === 'horizontal') {
      // Bouncing off top/bottom walls affects horizontal velocity due to friction
      particle.velocity.x *= frictionDamping;
    } else {
      // Bouncing off left/right walls affects vertical velocity due to friction
      particle.velocity.y *= frictionDamping;
    }

    // Add slight random variation to prevent particles from getting stuck in patterns
    const randomFactor = 0.98 + Math.random() * 0.04; // 0.98 to 1.02
    particle.velocity.x *= randomFactor;
    particle.velocity.y *= randomFactor;

    // Reduce particle size slightly on each bounce to simulate energy loss
    particle.size *= 0.995;
  }

  /**
   * Check if a particle is near a boundary (useful for predictive collision detection)
   */
  isNearBoundary(particle: Particle, threshold: number = 10): boolean {
    const particleRadius = particle.size * 0.5;
    
    return (
      particle.position.x - particleRadius <= this.bounds.x + threshold ||
      particle.position.x + particleRadius >= this.bounds.x + this.bounds.width - threshold ||
      particle.position.y - particleRadius <= this.bounds.y + threshold ||
      particle.position.y + particleRadius >= this.bounds.y + this.bounds.height - threshold
    );
  }

  /**
   * Get the distance to the nearest boundary
   */
  getDistanceToBoundary(particle: Particle): number {
    const particleRadius = particle.size * 0.5;
    
    const distanceToLeft = particle.position.x - particleRadius - this.bounds.x;
    const distanceToRight = this.bounds.x + this.bounds.width - (particle.position.x + particleRadius);
    const distanceToTop = particle.position.y - particleRadius - this.bounds.y;
    const distanceToBottom = this.bounds.y + this.bounds.height - (particle.position.y + particleRadius);
    
    return Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
  }

  /**
   * Set the physics boundaries
   */
  setBounds(bounds: Rectangle): void {
    this.bounds = { ...bounds };
  }

  /**
   * Set the gravity vector
   */
  setGravity(gravity: Vector2): void {
    this.gravity = { ...gravity };
  }

  /**
   * Set the drag coefficient
   */
  setDrag(drag: number): void {
    this.drag = Math.max(0, Math.min(1, drag)); // Clamp between 0 and 1
  }

  /**
   * Enable or disable boundary bouncing
   */
  setBounceEnabled(enabled: boolean): void {
    this.bounceEnabled = enabled;
  }

  /**
   * Set the bounce damping factor
   */
  setBounceDamping(damping: number): void {
    this.bounceDamping = Math.max(0, Math.min(1, damping)); // Clamp between 0 and 1
  }

  /**
   * Update multiple configuration values at once
   */
  updateConfig(config: Partial<PhysicsConfig>): void {
    if (config.bounds) {
      this.setBounds(config.bounds);
    }
    
    if (config.gravity) {
      this.setGravity(config.gravity);
    }
    
    if (config.drag !== undefined) {
      this.setDrag(config.drag);
    }
    
    if (config.bounceEnabled !== undefined) {
      this.setBounceEnabled(config.bounceEnabled);
    }
    
    if (config.bounceDamping !== undefined) {
      this.setBounceDamping(config.bounceDamping);
    }
  }

  /**
   * Get current physics configuration
   */
  getConfig(): PhysicsConfig {
    return {
      bounds: { ...this.bounds },
      gravity: { ...this.gravity },
      drag: this.drag,
      bounceEnabled: this.bounceEnabled,
      bounceDamping: this.bounceDamping
    };
  }

  /**
   * Calculate the kinetic energy of a particle (for debugging/monitoring)
   */
  calculateKineticEnergy(particle: Particle): number {
    const velocitySquared = particle.velocity.x * particle.velocity.x + 
                           particle.velocity.y * particle.velocity.y;
    return 0.5 * velocitySquared; // Assuming unit mass
  }

  /**
   * Get the total kinetic energy of all particles (for system monitoring)
   */
  getTotalKineticEnergy(particles: ReadonlyArray<Particle>): number {
    return particles.reduce((total, particle) => {
      return total + this.calculateKineticEnergy(particle);
    }, 0);
  }
}
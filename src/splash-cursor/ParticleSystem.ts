/**
 * ParticleSystem class for managing particle lifecycle and physics
 * Implements particle pooling for memory efficiency
 */

import { 
  Particle, 
  ParticleSystemConfig, 
  Vector2, 
  HSLColor 
} from '../types/splash-cursor';

export class ParticleSystem {
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private maxParticles: number;
  private emissionRate: number;
  private particleLifetime: number;
  private initialSize: number;
  private sizeVariation: number;
  private lastEmissionTime: number = 0;
  private emissionAccumulator: number = 0;

  constructor(config: ParticleSystemConfig) {
    this.maxParticles = config.maxParticles;
    this.emissionRate = config.emissionRate;
    this.particleLifetime = config.particleLifetime;
    this.initialSize = config.initialSize;
    this.sizeVariation = config.sizeVariation;
    
    // Pre-allocate particle pool for memory efficiency
    this.initializeParticlePool();
  }

  /**
   * Pre-allocate particles to avoid garbage collection during runtime
   */
  private initializeParticlePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(this.createParticle());
    }
  }

  /**
   * Create a new particle with default values
   */
  private createParticle(): Particle {
    return {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      life: 0,
      maxLife: this.particleLifetime,
      size: this.initialSize,
      color: { h: 0, s: 100, l: 50, a: 1 },
      createdAt: 0
    };
  }

  /**
   * Get a particle from the pool or create a new one if pool is empty
   */
  private getParticleFromPool(): Particle | null {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop()!;
    }
    
    // If we've reached max particles, don't create more
    if (this.particles.length >= this.maxParticles) {
      return null;
    }
    
    return this.createParticle();
  }

  /**
   * Return a particle to the pool for reuse
   */
  private returnParticleToPool(particle: Particle): void {
    // Reset particle properties
    particle.life = 0;
    particle.position.x = 0;
    particle.position.y = 0;
    particle.velocity.x = 0;
    particle.velocity.y = 0;
    particle.createdAt = 0;
    
    this.particlePool.push(particle);
  }

  /**
   * Update all particles and handle lifecycle
   */
  update(deltaTime: number, mousePos: Vector2, mouseVelocity: Vector2): void {
    const currentTime = performance.now();
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update particle life
      particle.life += deltaTime;
      
      // Remove dead particles
      if (particle.life >= particle.maxLife) {
        this.particles.splice(i, 1);
        this.returnParticleToPool(particle);
        continue;
      }
      
      // Update particle properties based on life
      this.updateParticle(particle, deltaTime);
    }
    
    // Handle particle emission based on mouse movement
    this.handleEmission(currentTime, mousePos, mouseVelocity);
  }

  /**
   * Update particles with mouse state from MouseTracker
   */
  updateWithMouseState(deltaTime: number, mouseState: { position: Vector2; velocity: Vector2; isDown: boolean }): void {
    this.update(deltaTime, mouseState.position, mouseState.velocity);
  }

  /**
   * Force emit particles at position (useful for click events)
   */
  forceEmit(position: Vector2, count: number = 1, intensity: number = 1.0): void {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      // Create random velocity for forced emission
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      const velocity: Vector2 = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      
      this.emitParticle(position, velocity, intensity);
    }
  }

  /**
   * Update individual particle properties
   */
  private updateParticle(particle: Particle, deltaTime: number): void {
    // Calculate life ratio (0 to 1)
    const lifeRatio = particle.life / particle.maxLife;
    
    // Update alpha based on life (fade out over time)
    particle.color.a = Math.max(0, 1 - lifeRatio);
    
    // Update size (can grow or shrink over time)
    const sizeMultiplier = 1 + (lifeRatio * 0.5); // Grow slightly over time
    particle.size = this.initialSize * sizeMultiplier;
  }

  /**
   * Handle particle emission based on mouse movement
   */
  private handleEmission(currentTime: number, mousePos: Vector2, mouseVelocity: Vector2): void {
    // Calculate time since last emission
    const timeSinceLastEmission = currentTime - this.lastEmissionTime;
    
    // Calculate emission intensity based on mouse velocity
    const velocityMagnitude = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y);
    const intensity = Math.min(1, velocityMagnitude / 200); // Normalize velocity to 0-1 (adjusted threshold)
    
    // Only emit if there's significant movement
    if (intensity > 0.01) {
      // Calculate how many particles to emit this frame
      const emissionRate = this.emissionRate * intensity;
      this.emissionAccumulator += emissionRate * (timeSinceLastEmission / 1000);
      
      // Emit particles if we've accumulated enough
      while (this.emissionAccumulator >= 1 && this.particles.length < this.maxParticles) {
        this.emitParticle(mousePos, mouseVelocity, intensity);
        this.emissionAccumulator -= 1;
      }
    }
    
    this.lastEmissionTime = currentTime;
  }

  /**
   * Emit a single particle at the given position with velocity
   */
  emit(position: Vector2, velocity: Vector2, intensity: number): void {
    this.emitParticle(position, velocity, intensity);
  }

  /**
   * Internal method to emit a particle
   */
  private emitParticle(position: Vector2, velocity: Vector2, intensity: number): void {
    const particle = this.getParticleFromPool();
    if (!particle) return;
    
    // Set particle position
    particle.position.x = position.x;
    particle.position.y = position.y;
    
    // Set particle velocity with some randomness
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.5 + Math.random() * 0.5) * intensity * 50; // Random speed based on intensity
    
    particle.velocity.x = velocity.x * 0.3 + Math.cos(angle) * speed;
    particle.velocity.y = velocity.y * 0.3 + Math.sin(angle) * speed;
    
    // Set particle properties
    particle.life = 0;
    particle.maxLife = this.particleLifetime * (0.8 + Math.random() * 0.4); // Vary lifetime
    particle.size = this.initialSize + (Math.random() - 0.5) * this.sizeVariation;
    particle.createdAt = performance.now();
    
    // Set particle color (will be updated by color system later)
    particle.color = {
      h: Math.random() * 360, // Random hue for now
      s: 80 + Math.random() * 20, // High saturation
      l: 50 + Math.random() * 20, // Medium lightness
      a: 1
    };
    
    this.particles.push(particle);
  }

  /**
   * Clean up all particles and reset system
   */
  cleanup(): void {
    // Return all active particles to pool
    while (this.particles.length > 0) {
      const particle = this.particles.pop()!;
      this.returnParticleToPool(particle);
    }
    
    this.emissionAccumulator = 0;
    this.lastEmissionTime = 0;
  }

  /**
   * Get read-only access to active particles
   */
  getParticles(): ReadonlyArray<Particle> {
    return this.particles;
  }

  /**
   * Get current active particle count
   */
  getActiveCount(): number {
    return this.particles.length;
  }

  /**
   * Get pool statistics for debugging
   */
  getPoolStats(): { active: number; pooled: number; total: number } {
    return {
      active: this.particles.length,
      pooled: this.particlePool.length,
      total: this.particles.length + this.particlePool.length
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ParticleSystemConfig>): void {
    if (config.maxParticles !== undefined) {
      this.maxParticles = config.maxParticles;
      // Adjust pool size if needed
      this.adjustPoolSize();
    }
    
    if (config.emissionRate !== undefined) {
      this.emissionRate = config.emissionRate;
    }
    
    if (config.particleLifetime !== undefined) {
      this.particleLifetime = config.particleLifetime;
    }
    
    if (config.initialSize !== undefined) {
      this.initialSize = config.initialSize;
    }
    
    if (config.sizeVariation !== undefined) {
      this.sizeVariation = config.sizeVariation;
    }
  }

  /**
   * Adjust pool size based on max particles setting
   */
  private adjustPoolSize(): void {
    const totalParticles = this.particles.length + this.particlePool.length;
    
    if (totalParticles < this.maxParticles) {
      // Add more particles to pool
      const needed = this.maxParticles - totalParticles;
      for (let i = 0; i < needed; i++) {
        this.particlePool.push(this.createParticle());
      }
    } else if (totalParticles > this.maxParticles) {
      // Remove excess particles from pool
      const excess = totalParticles - this.maxParticles;
      this.particlePool.splice(0, Math.min(excess, this.particlePool.length));
    }
  }
}
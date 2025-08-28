/**
 * Particle pooling system for memory management
 * Reuses particle objects to reduce garbage collection pressure
 */

import { Particle, Vector2, HSLColor } from '../types/splash-cursor';

export interface PooledParticle extends Particle {
  _pooled: boolean;
  _poolIndex: number;
}

export interface ParticlePoolConfig {
  initialSize: number;
  maxSize: number;
  growthFactor: number;
  shrinkThreshold: number;
  shrinkFactor: number;
}

export class ParticlePool {
  private pool: PooledParticle[] = [];
  private activeParticles: Set<PooledParticle> = new Set();
  private availableParticles: PooledParticle[] = [];
  private config: ParticlePoolConfig;
  
  // Statistics
  private stats = {
    created: 0,
    reused: 0,
    released: 0,
    maxActive: 0,
    poolGrows: 0,
    poolShrinks: 0
  };

  constructor(config: Partial<ParticlePoolConfig> = {}) {
    this.config = {
      initialSize: config.initialSize || 100,
      maxSize: config.maxSize || 1000,
      growthFactor: config.growthFactor || 1.5,
      shrinkThreshold: config.shrinkThreshold || 0.25,
      shrinkFactor: config.shrinkFactor || 0.5
    };

    this.initializePool();
  }

  /**
   * Get a particle from the pool or create a new one
   */
  acquire(
    position: Vector2,
    velocity: Vector2,
    life: number,
    maxLife: number,
    size: number,
    color: HSLColor
  ): PooledParticle {
    let particle: PooledParticle;

    if (this.availableParticles.length > 0) {
      // Reuse existing particle
      particle = this.availableParticles.pop()!;
      this.resetParticle(particle, position, velocity, life, maxLife, size, color);
      this.stats.reused++;
    } else {
      // Create new particle
      particle = this.createParticle(position, velocity, life, maxLife, size, color);
      this.stats.created++;
      
      // Grow pool if needed
      if (this.pool.length < this.config.maxSize) {
        this.growPool();
      }
    }

    this.activeParticles.add(particle);
    this.stats.maxActive = Math.max(this.stats.maxActive, this.activeParticles.size);

    return particle;
  }

  /**
   * Release a particle back to the pool
   */
  release(particle: PooledParticle): void {
    if (!this.activeParticles.has(particle)) {
      console.warn('Attempting to release particle that is not active');
      return;
    }

    this.activeParticles.delete(particle);
    this.availableParticles.push(particle);
    this.stats.released++;

    // Clean up particle data
    this.cleanParticle(particle);

    // Shrink pool if it's too large and underutilized
    this.considerShrinking();
  }

  /**
   * Release multiple particles at once
   */
  releaseMultiple(particles: PooledParticle[]): void {
    for (const particle of particles) {
      this.release(particle);
    }
  }

  /**
   * Get all active particles
   */
  getActiveParticles(): PooledParticle[] {
    return Array.from(this.activeParticles);
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    poolSize: number;
    activeCount: number;
    availableCount: number;
    utilizationRate: number;
    created: number;
    reused: number;
    released: number;
    maxActive: number;
    poolGrows: number;
    poolShrinks: number;
    reuseRate: number;
  } {
    const total = this.stats.created + this.stats.reused;
    
    return {
      poolSize: this.pool.length,
      activeCount: this.activeParticles.size,
      availableCount: this.availableParticles.length,
      utilizationRate: this.pool.length > 0 ? this.activeParticles.size / this.pool.length : 0,
      created: this.stats.created,
      reused: this.stats.reused,
      released: this.stats.released,
      maxActive: this.stats.maxActive,
      poolGrows: this.stats.poolGrows,
      poolShrinks: this.stats.poolShrinks,
      reuseRate: total > 0 ? this.stats.reused / total : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      created: 0,
      reused: 0,
      released: 0,
      maxActive: 0,
      poolGrows: 0,
      poolShrinks: 0
    };
  }

  /**
   * Clear all particles and reset pool
   */
  clear(): void {
    this.activeParticles.clear();
    this.availableParticles.length = 0;
    this.pool.length = 0;
    this.initializePool();
  }

  /**
   * Resize the pool
   */
  resize(newSize: number): void {
    newSize = Math.max(1, Math.min(this.config.maxSize, newSize));

    if (newSize > this.pool.length) {
      // Grow pool
      const toAdd = newSize - this.pool.length;
      for (let i = 0; i < toAdd; i++) {
        const particle = this.createEmptyParticle();
        this.pool.push(particle);
        this.availableParticles.push(particle);
      }
    } else if (newSize < this.pool.length) {
      // Shrink pool
      const toRemove = this.pool.length - newSize;
      
      // Remove from available particles first
      for (let i = 0; i < toRemove && this.availableParticles.length > 0; i++) {
        const particle = this.availableParticles.pop()!;
        const poolIndex = this.pool.indexOf(particle);
        if (poolIndex > -1) {
          this.pool.splice(poolIndex, 1);
        }
      }
    }

    this.updatePoolIndices();
  }

  /**
   * Force garbage collection of unused particles
   */
  forceCleanup(): void {
    // Release all available particles that haven't been used recently
    const now = performance.now();
    const maxAge = 5000; // 5 seconds

    this.availableParticles = this.availableParticles.filter(particle => {
      const age = now - (particle.createdAt || 0);
      if (age > maxAge) {
        const poolIndex = this.pool.indexOf(particle);
        if (poolIndex > -1) {
          this.pool.splice(poolIndex, 1);
        }
        return false;
      }
      return true;
    });

    this.updatePoolIndices();
  }

  /**
   * Initialize the pool with empty particles
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.initialSize; i++) {
      const particle = this.createEmptyParticle();
      this.pool.push(particle);
      this.availableParticles.push(particle);
    }
  }

  /**
   * Create an empty particle for the pool
   */
  private createEmptyParticle(): PooledParticle {
    return {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      life: 0,
      maxLife: 1,
      size: 1,
      color: { h: 0, s: 0, l: 0, a: 0 },
      createdAt: performance.now(),
      _pooled: true,
      _poolIndex: this.pool.length
    };
  }

  /**
   * Create a new particle with specified properties
   */
  private createParticle(
    position: Vector2,
    velocity: Vector2,
    life: number,
    maxLife: number,
    size: number,
    color: HSLColor
  ): PooledParticle {
    return {
      position: { ...position },
      velocity: { ...velocity },
      life,
      maxLife,
      size,
      color: { ...color },
      createdAt: performance.now(),
      _pooled: true,
      _poolIndex: this.pool.length
    };
  }

  /**
   * Reset particle properties
   */
  private resetParticle(
    particle: PooledParticle,
    position: Vector2,
    velocity: Vector2,
    life: number,
    maxLife: number,
    size: number,
    color: HSLColor
  ): void {
    particle.position.x = position.x;
    particle.position.y = position.y;
    particle.velocity.x = velocity.x;
    particle.velocity.y = velocity.y;
    particle.life = life;
    particle.maxLife = maxLife;
    particle.size = size;
    particle.color.h = color.h;
    particle.color.s = color.s;
    particle.color.l = color.l;
    particle.color.a = color.a;
    particle.createdAt = performance.now();
  }

  /**
   * Clean particle data when releasing
   */
  private cleanParticle(particle: PooledParticle): void {
    // Reset to safe defaults to prevent memory leaks
    particle.position.x = 0;
    particle.position.y = 0;
    particle.velocity.x = 0;
    particle.velocity.y = 0;
    particle.life = 0;
    particle.maxLife = 1;
    particle.size = 1;
    particle.color.h = 0;
    particle.color.s = 0;
    particle.color.l = 0;
    particle.color.a = 0;
  }

  /**
   * Grow the pool when needed
   */
  private growPool(): void {
    const currentSize = this.pool.length;
    const newSize = Math.min(
      this.config.maxSize,
      Math.ceil(currentSize * this.config.growthFactor)
    );

    if (newSize > currentSize) {
      this.resize(newSize);
      this.stats.poolGrows++;
    }
  }

  /**
   * Consider shrinking the pool if underutilized
   */
  private considerShrinking(): void {
    const utilizationRate = this.activeParticles.size / this.pool.length;
    
    if (utilizationRate < this.config.shrinkThreshold && 
        this.pool.length > this.config.initialSize) {
      
      const newSize = Math.max(
        this.config.initialSize,
        Math.ceil(this.pool.length * this.config.shrinkFactor)
      );

      if (newSize < this.pool.length) {
        this.resize(newSize);
        this.stats.poolShrinks++;
      }
    }
  }

  /**
   * Update pool indices after resize operations
   */
  private updatePoolIndices(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i]._poolIndex = i;
    }
  }
}

/**
 * Specialized particle pool for splash cursor system
 */
export class SplashCursorParticlePool extends ParticlePool {
  private colorTemplates: HSLColor[] = [];

  constructor(config: Partial<ParticlePoolConfig> = {}) {
    super({
      initialSize: 150,
      maxSize: 500,
      growthFactor: 1.3,
      shrinkThreshold: 0.3,
      shrinkFactor: 0.7,
      ...config
    });

    this.initializeColorTemplates();
  }

  /**
   * Acquire particle with splash cursor specific defaults
   */
  acquireSplashParticle(
    position: Vector2,
    velocity: Vector2,
    options: {
      life?: number;
      maxLife?: number;
      size?: number;
      colorMode?: 'rainbow' | 'velocity' | 'random';
      baseHue?: number;
    } = {}
  ): PooledParticle {
    const life = options.life || options.maxLife || 2.0;
    const maxLife = options.maxLife || 2.0;
    const size = options.size || this.calculateSizeFromVelocity(velocity);
    const color = this.generateColor(velocity, options);

    return this.acquire(position, velocity, life, maxLife, size, color);
  }

  /**
   * Batch acquire multiple particles for emission
   */
  acquireBatch(
    count: number,
    basePosition: Vector2,
    baseVelocity: Vector2,
    options: {
      positionSpread?: number;
      velocitySpread?: number;
      sizeVariation?: number;
      colorMode?: 'rainbow' | 'velocity' | 'random';
    } = {}
  ): PooledParticle[] {
    const particles: PooledParticle[] = [];
    const positionSpread = options.positionSpread || 5;
    const velocitySpread = options.velocitySpread || 50;
    const sizeVariation = options.sizeVariation || 0.3;

    for (let i = 0; i < count; i++) {
      const position = {
        x: basePosition.x + (Math.random() - 0.5) * positionSpread,
        y: basePosition.y + (Math.random() - 0.5) * positionSpread
      };

      const velocity = {
        x: baseVelocity.x + (Math.random() - 0.5) * velocitySpread,
        y: baseVelocity.y + (Math.random() - 0.5) * velocitySpread
      };

      const baseSize = this.calculateSizeFromVelocity(velocity);
      const size = baseSize * (1 + (Math.random() - 0.5) * sizeVariation);

      const particle = this.acquireSplashParticle(position, velocity, {
        size,
        colorMode: options.colorMode
      });

      particles.push(particle);
    }

    return particles;
  }

  /**
   * Update particle properties for animation
   */
  updateParticle(particle: PooledParticle, deltaTime: number): boolean {
    // Update life
    particle.life -= deltaTime;

    if (particle.life <= 0) {
      return false; // Particle should be released
    }

    // Update alpha based on life
    const lifeRatio = particle.life / particle.maxLife;
    particle.color.a = Math.max(0, lifeRatio);

    // Update size based on life (particles shrink as they age)
    const originalSize = particle.size;
    particle.size = originalSize * (0.5 + lifeRatio * 0.5);

    return true; // Particle is still alive
  }

  /**
   * Initialize color templates for efficient color generation
   */
  private initializeColorTemplates(): void {
    // Rainbow colors
    for (let i = 0; i < 360; i += 30) {
      this.colorTemplates.push({
        h: i,
        s: 80,
        l: 60,
        a: 1
      });
    }
  }

  /**
   * Generate color based on velocity and mode
   */
  private generateColor(
    velocity: Vector2,
    options: {
      colorMode?: 'rainbow' | 'velocity' | 'random';
      baseHue?: number;
    }
  ): HSLColor {
    const mode = options.colorMode || 'rainbow';

    switch (mode) {
      case 'velocity': {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const hue = (speed * 0.5) % 360;
        return {
          h: hue,
          s: 80,
          l: 60,
          a: 1
        };
      }

      case 'random': {
        return {
          h: Math.random() * 360,
          s: 70 + Math.random() * 30,
          l: 50 + Math.random() * 30,
          a: 1
        };
      }

      case 'rainbow':
      default: {
        const baseHue = options.baseHue || (performance.now() * 0.1) % 360;
        const hueVariation = (Math.random() - 0.5) * 60;
        return {
          h: (baseHue + hueVariation) % 360,
          s: 80,
          l: 60,
          a: 1
        };
      }
    }
  }

  /**
   * Calculate particle size based on velocity
   */
  private calculateSizeFromVelocity(velocity: Vector2): number {
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const baseSize = 8;
    const speedFactor = Math.min(speed / 100, 2); // Cap at 2x size
    return baseSize * (0.5 + speedFactor * 0.5);
  }
}
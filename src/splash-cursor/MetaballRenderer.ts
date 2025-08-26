/**
 * MetaballRenderer class for rendering particles as connected fluid using metaball technique
 * Implements efficient distance-based culling and threshold-based rendering
 */

import { 
  Particle, 
  Vector2, 
  HSLColor,
  QualityLevel,
  QualitySettings 
} from '../types/splash-cursor';

export interface MetaballRendererConfig {
  threshold: number;
  blurAmount: number;
  qualityLevel: QualityLevel;
  maxInfluenceDistance: number;
  skipPixels: number;
}

export class MetaballRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData | null = null;
  private width: number = 0;
  private height: number = 0;
  
  // Configuration
  private threshold: number;
  private blurAmount: number;
  private maxInfluenceDistance: number;
  private skipPixels: number;
  
  // Performance optimization
  private fieldBuffer: Float32Array | null = null;
  private colorBuffer: Uint8ClampedArray | null = null;
  
  // Quality settings
  private static readonly QUALITY_SETTINGS: Record<QualityLevel, QualitySettings> = {
    high: {
      particleCount: 150,
      metaballThreshold: 0.5,
      blurAmount: 2,
      skipPixels: 1,
      targetFPS: 60
    },
    medium: {
      particleCount: 100,
      metaballThreshold: 0.6,
      blurAmount: 1,
      skipPixels: 2,
      targetFPS: 45
    },
    low: {
      particleCount: 50,
      metaballThreshold: 0.7,
      blurAmount: 0,
      skipPixels: 3,
      targetFPS: 30
    },
    minimal: {
      particleCount: 25,
      metaballThreshold: 0.8,
      blurAmount: 0,
      skipPixels: 4,
      targetFPS: 20
    }
  };

  constructor(canvas: HTMLCanvasElement, config: MetaballRendererConfig) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get 2D rendering context from canvas');
    }
    
    this.ctx = context;
    this.threshold = config.threshold;
    this.blurAmount = config.blurAmount;
    this.maxInfluenceDistance = config.maxInfluenceDistance;
    this.skipPixels = config.skipPixels;
    
    // Initialize canvas size
    this.resize(canvas.width, canvas.height);
  }

  /**
   * Resize the renderer and reinitialize buffers
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    // Update canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Calculate buffer dimensions based on skip pixels for performance
    const bufferWidth = Math.ceil(width / this.skipPixels);
    const bufferHeight = Math.ceil(height / this.skipPixels);
    
    // Initialize buffers
    this.fieldBuffer = new Float32Array(bufferWidth * bufferHeight);
    this.colorBuffer = new Uint8ClampedArray(bufferWidth * bufferHeight * 4);
    this.imageData = this.ctx.createImageData(bufferWidth, bufferHeight);
  }

  /**
   * Main render method - renders particles as connected fluid using metaball technique
   */
  render(particles: ReadonlyArray<Particle>): void {
    if (!this.fieldBuffer || !this.colorBuffer || !this.imageData) {
      return;
    }

    // Clear buffers
    this.clearBuffers();
    
    // Calculate metaball field
    this.calculateMetaballField(particles);
    
    // Generate colors based on field values
    this.generateColors(particles);
    
    // Apply threshold and create final image
    this.applyThreshold();
    
    // Render to canvas
    this.renderToCanvas();
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Clear internal buffers
   */
  private clearBuffers(): void {
    if (this.fieldBuffer) {
      this.fieldBuffer.fill(0);
    }
    if (this.colorBuffer) {
      this.colorBuffer.fill(0);
    }
  }

  /**
   * Calculate the metaball influence field for all particles
   * Uses distance-based culling for performance optimization
   */
  private calculateMetaballField(particles: ReadonlyArray<Particle>): void {
    if (!this.fieldBuffer) return;

    const bufferWidth = Math.ceil(this.width / this.skipPixels);
    const bufferHeight = Math.ceil(this.height / this.skipPixels);

    // For each pixel in the field buffer
    for (let y = 0; y < bufferHeight; y++) {
      for (let x = 0; x < bufferWidth; x++) {
        const pixelIndex = y * bufferWidth + x;
        
        // Convert buffer coordinates to world coordinates
        const worldX = x * this.skipPixels;
        const worldY = y * this.skipPixels;
        
        let fieldValue = 0;
        
        // Calculate influence from all particles
        for (const particle of particles) {
          const influence = this.calculateParticleInfluence(
            worldX, 
            worldY, 
            particle
          );
          fieldValue += influence;
        }
        
        this.fieldBuffer[pixelIndex] = fieldValue;
      }
    }
  }

  /**
   * Calculate the influence of a single particle at a given position
   * Uses distance-based culling to skip particles that are too far away
   */
  private calculateParticleInfluence(x: number, y: number, particle: Particle): number {
    // Calculate distance from pixel to particle
    const dx = x - particle.position.x;
    const dy = y - particle.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Early exit if particle is too far away (distance-based culling)
    const maxDistance = particle.size * 3; // Influence radius based on particle size
    if (distance > maxDistance || distance > this.maxInfluenceDistance) {
      return 0;
    }
    
    // Calculate influence using inverse square law with particle size
    // Larger particles have more influence, and influence decreases with distance
    const radius = particle.size;
    const influence = (radius * radius) / (distance * distance + 1);
    
    // Apply particle alpha for fading effect
    return influence * particle.color.a;
  }

  /**
   * Generate colors for each pixel based on nearby particles
   * Blends colors from multiple particles based on their influence
   */
  private generateColors(particles: ReadonlyArray<Particle>): void {
    if (!this.colorBuffer) return;

    const bufferWidth = Math.ceil(this.width / this.skipPixels);
    const bufferHeight = Math.ceil(this.height / this.skipPixels);

    for (let y = 0; y < bufferHeight; y++) {
      for (let x = 0; x < bufferWidth; x++) {
        const pixelIndex = y * bufferWidth + x;
        const colorIndex = pixelIndex * 4;
        
        // Convert buffer coordinates to world coordinates
        const worldX = x * this.skipPixels;
        const worldY = y * this.skipPixels;
        
        // Blend colors from nearby particles
        const blendedColor = this.blendParticleColors(worldX, worldY, particles);
        
        // Store in color buffer (RGBA)
        this.colorBuffer[colorIndex] = blendedColor.r;     // Red
        this.colorBuffer[colorIndex + 1] = blendedColor.g; // Green
        this.colorBuffer[colorIndex + 2] = blendedColor.b; // Blue
        this.colorBuffer[colorIndex + 3] = blendedColor.a; // Alpha
      }
    }
  }

  /**
   * Blend colors from multiple particles at a given position
   * Uses weighted average based on particle influence
   */
  private blendParticleColors(x: number, y: number, particles: ReadonlyArray<Particle>): {r: number, g: number, b: number, a: number} {
    let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
    let totalWeight = 0;
    
    for (const particle of particles) {
      const influence = this.calculateParticleInfluence(x, y, particle);
      
      if (influence > 0.01) { // Only consider particles with significant influence
        const rgb = this.hslToRgb(particle.color);
        const weight = influence;
        
        totalR += rgb.r * weight;
        totalG += rgb.g * weight;
        totalB += rgb.b * weight;
        totalA += particle.color.a * weight;
        totalWeight += weight;
      }
    }
    
    if (totalWeight === 0) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    
    return {
      r: Math.round(totalR / totalWeight),
      g: Math.round(totalG / totalWeight),
      b: Math.round(totalB / totalWeight),
      a: Math.round((totalA / totalWeight) * 255)
    };
  }

  /**
   * Apply threshold to create connected appearance
   * Pixels above threshold become visible, creating fluid connectivity
   */
  private applyThreshold(): void {
    if (!this.fieldBuffer || !this.colorBuffer || !this.imageData) return;

    const bufferWidth = Math.ceil(this.width / this.skipPixels);
    const bufferHeight = Math.ceil(this.height / this.skipPixels);
    const data = this.imageData.data;

    for (let i = 0; i < this.fieldBuffer.length; i++) {
      const fieldValue = this.fieldBuffer[i];
      const colorIndex = i * 4;
      
      if (fieldValue >= this.threshold) {
        // Above threshold - use calculated color
        data[colorIndex] = this.colorBuffer[colorIndex];         // Red
        data[colorIndex + 1] = this.colorBuffer[colorIndex + 1]; // Green
        data[colorIndex + 2] = this.colorBuffer[colorIndex + 2]; // Blue
        data[colorIndex + 3] = this.colorBuffer[colorIndex + 3]; // Alpha
      } else {
        // Below threshold - transparent
        data[colorIndex] = 0;
        data[colorIndex + 1] = 0;
        data[colorIndex + 2] = 0;
        data[colorIndex + 3] = 0;
      }
    }
  }

  /**
   * Render the final image to canvas
   */
  private renderToCanvas(): void {
    if (!this.imageData) return;

    // Create a temporary canvas for scaling if needed
    if (this.skipPixels > 1) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      const bufferWidth = Math.ceil(this.width / this.skipPixels);
      const bufferHeight = Math.ceil(this.height / this.skipPixels);
      
      tempCanvas.width = bufferWidth;
      tempCanvas.height = bufferHeight;
      
      // Draw the low-res image
      tempCtx.putImageData(this.imageData, 0, 0);
      
      // Scale up to full canvas size
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.drawImage(tempCanvas, 0, 0, bufferWidth, bufferHeight, 0, 0, this.width, this.height);
    } else {
      // Direct rendering for full resolution
      this.ctx.putImageData(this.imageData, 0, 0);
    }
    
    // Apply blur if configured
    if (this.blurAmount > 0) {
      this.applyBlur();
    }
  }

  /**
   * Apply blur effect for smoother appearance
   */
  private applyBlur(): void {
    this.ctx.filter = `blur(${this.blurAmount}px)`;
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.filter = 'none';
  }

  /**
   * Convert HSL color to RGB
   */
  private hslToRgb(hsl: HSLColor): {r: number, g: number, b: number} {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // Achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Update configuration
   */
  setThreshold(threshold: number): void {
    this.threshold = Math.max(0, Math.min(1, threshold));
  }

  setBlurAmount(blur: number): void {
    this.blurAmount = Math.max(0, blur);
  }

  setMaxInfluenceDistance(distance: number): void {
    this.maxInfluenceDistance = Math.max(1, distance);
  }

  setSkipPixels(skip: number): void {
    this.skipPixels = Math.max(1, skip);
    // Resize to update buffers with new skip value
    this.resize(this.width, this.height);
  }

  /**
   * Update quality level and adjust settings accordingly
   */
  setQualityLevel(level: QualityLevel): void {
    const settings = MetaballRenderer.QUALITY_SETTINGS[level];
    this.setThreshold(settings.metaballThreshold);
    this.setBlurAmount(settings.blurAmount);
    this.setSkipPixels(settings.skipPixels);
  }

  /**
   * Get current configuration
   */
  getConfig(): MetaballRendererConfig {
    return {
      threshold: this.threshold,
      blurAmount: this.blurAmount,
      qualityLevel: 'high', // Default, would need to track this separately
      maxInfluenceDistance: this.maxInfluenceDistance,
      skipPixels: this.skipPixels
    };
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    bufferSize: number;
    fieldBufferLength: number;
    colorBufferLength: number;
    skipPixels: number;
  } {
    const bufferWidth = Math.ceil(this.width / this.skipPixels);
    const bufferHeight = Math.ceil(this.height / this.skipPixels);
    
    return {
      bufferSize: bufferWidth * bufferHeight,
      fieldBufferLength: this.fieldBuffer?.length || 0,
      colorBufferLength: this.colorBuffer?.length || 0,
      skipPixels: this.skipPixels
    };
  }
}
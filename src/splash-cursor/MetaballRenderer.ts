/**
 * MetaballRenderer class for rendering particles as connected fluid using metaball technique
 * Implements efficient distance-based culling and threshold-based rendering
 */

import {
  Particle,
  Vector2,
  HSLColor,
  QualityLevel,
  QualitySettings,
  Rectangle
} from '../types/splash-cursor';
import { MetaballSpatialGrid } from '../utils/spatial-partitioning';
import { DirtyRectangleTracker } from '../utils/dirty-rectangle';

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

  // Spatial partitioning for optimized particle queries
  private spatialGrid: MetaballSpatialGrid | null = null;

  // Dirty rectangle tracking for optimized rendering
  private dirtyTracker: DirtyRectangleTracker | null = null;

  // Previous frame data for dirty tracking
  private previousParticles: Map<Particle, Vector2> = new Map();

  // Rendering optimization flags
  private useOptimizations: boolean = true;
  private useSpatialPartitioning: boolean = true;
  private useDirtyRectangles: boolean = true;

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

    // Initialize canvas size and optimization systems
    this.resize(canvas.width, canvas.height);
    this.initializeOptimizations();
  }

  /**
   * Initialize optimization systems
   */
  private initializeOptimizations(): void {
    const bounds = { x: 0, y: 0, width: this.width, height: this.height };

    if (this.useSpatialPartitioning) {
      this.spatialGrid = new MetaballSpatialGrid(bounds, 100, this.maxInfluenceDistance);
    }

    if (this.useDirtyRectangles) {
      this.dirtyTracker = new DirtyRectangleTracker(bounds, {
        minRegionSize: 32,
        maxRegions: 50,
        mergeThreshold: 1.5
      });
    }
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

    // Update optimization systems
    const bounds = { x: 0, y: 0, width, height };

    if (this.spatialGrid) {
      this.spatialGrid.resize(bounds);
    }

    if (this.dirtyTracker) {
      this.dirtyTracker.updateCanvasBounds(bounds);
    }
  }

  /**
   * Main render method - renders particles as connected fluid using metaball technique
   */
  render(particles: ReadonlyArray<Particle>): void {
    if (!this.fieldBuffer || !this.colorBuffer || !this.imageData) {
      return;
    }

    // Update spatial partitioning
    if (this.spatialGrid && this.useSpatialPartitioning) {
      this.spatialGrid.updateParticles(particles);
    }

    // Track dirty regions
    if (this.dirtyTracker && this.useDirtyRectangles) {
      this.updateDirtyRegions(particles);
    }

    // Use optimized or full rendering based on settings
    if (this.useOptimizations && this.dirtyTracker) {
      this.renderOptimized(particles);
    } else {
      this.renderFull(particles);
    }

    // Update previous frame data for next dirty tracking
    this.updatePreviousFrameData(particles);
  }

  /**
   * Full rendering without optimizations
   */
  private renderFull(particles: ReadonlyArray<Particle>): void {
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
   * Optimized rendering using dirty rectangles
   */
  private renderOptimized(particles: ReadonlyArray<Particle>): void {
    if (!this.dirtyTracker) {
      this.renderFull(particles);
      return;
    }

    const dirtyRegions = this.dirtyTracker.getOptimizedDirtyRegions();

    if (dirtyRegions.length === 0) {
      return; // Nothing to render
    }

    // Check if we should do full render instead
    const dirtyStats = this.dirtyTracker.getStats();
    if (dirtyStats.dirtyPercentage > 75) {
      // Too much of the screen is dirty, full render is more efficient
      this.renderFull(particles);
      this.dirtyTracker.clearDirty();
      return;
    }

    // Render only dirty regions
    for (const region of dirtyRegions) {
      this.renderRegion(region, particles);
    }

    this.dirtyTracker.clearDirty();
  }

  /**
   * Render a specific region of the canvas
   */
  private renderRegion(region: Rectangle, particles: ReadonlyArray<Particle>): void {
    // Get particles that could affect this region
    const relevantParticles = this.spatialGrid
      ? this.spatialGrid.getInfluencingParticlesForRegion(region)
      : particles;

    // Calculate buffer coordinates
    const bufferRegion = {
      x: Math.floor(region.x / this.skipPixels),
      y: Math.floor(region.y / this.skipPixels),
      width: Math.ceil(region.width / this.skipPixels),
      height: Math.ceil(region.height / this.skipPixels)
    };

    // Render the region
    this.calculateMetaballFieldForRegion(bufferRegion, relevantParticles);
    this.generateColorsForRegion(bufferRegion, relevantParticles);
    this.applyThresholdForRegion(bufferRegion);
    this.renderRegionToCanvas(region, bufferRegion);
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

        // Use spatial partitioning if available
        const relevantParticles = this.spatialGrid && this.useSpatialPartitioning
          ? this.spatialGrid.getInfluencingParticles({ x: worldX, y: worldY })
          : particles;

        // Calculate influence from relevant particles
        for (const particle of relevantParticles) {
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
   * Calculate metaball field for a specific region
   */
  private calculateMetaballFieldForRegion(
    bufferRegion: Rectangle,
    particles: ReadonlyArray<Particle>
  ): void {
    if (!this.fieldBuffer) return;

    const bufferWidth = Math.ceil(this.width / this.skipPixels);

    for (let y = bufferRegion.y; y < bufferRegion.y + bufferRegion.height; y++) {
      for (let x = bufferRegion.x; x < bufferRegion.x + bufferRegion.width; x++) {
        const pixelIndex = y * bufferWidth + x;

        // Convert buffer coordinates to world coordinates
        const worldX = x * this.skipPixels;
        const worldY = y * this.skipPixels;

        let fieldValue = 0;

        // Calculate influence from particles
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

        // Use spatial partitioning for color blending if available
        const relevantParticles = this.spatialGrid && this.useSpatialPartitioning
          ? this.spatialGrid.getInfluencingParticles({ x: worldX, y: worldY })
          : particles;

        // Blend colors from nearby particles
        const blendedColor = this.blendParticleColors(worldX, worldY, relevantParticles);

        // Store in color buffer (RGBA)
        this.colorBuffer[colorIndex] = blendedColor.r;     // Red
        this.colorBuffer[colorIndex + 1] = blendedColor.g; // Green
        this.colorBuffer[colorIndex + 2] = blendedColor.b; // Blue
        this.colorBuffer[colorIndex + 3] = blendedColor.a; // Alpha
      }
    }
  }

  /**
   * Generate colors for a specific region
   */
  private generateColorsForRegion(
    bufferRegion: Rectangle,
    particles: ReadonlyArray<Particle>
  ): void {
    if (!this.colorBuffer) return;

    const bufferWidth = Math.ceil(this.width / this.skipPixels);

    for (let y = bufferRegion.y; y < bufferRegion.y + bufferRegion.height; y++) {
      for (let x = bufferRegion.x; x < bufferRegion.x + bufferRegion.width; x++) {
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
   * Apply threshold for a specific region
   */
  private applyThresholdForRegion(bufferRegion: Rectangle): void {
    if (!this.fieldBuffer || !this.colorBuffer || !this.imageData) return;

    const bufferWidth = Math.ceil(this.width / this.skipPixels);
    const data = this.imageData.data;

    for (let y = bufferRegion.y; y < bufferRegion.y + bufferRegion.height; y++) {
      for (let x = bufferRegion.x; x < bufferRegion.x + bufferRegion.width; x++) {
        const pixelIndex = y * bufferWidth + x;
        const colorIndex = pixelIndex * 4;

        const fieldValue = this.fieldBuffer[pixelIndex];

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
  }

  /**
   * Render a specific region to canvas
   */
  private renderRegionToCanvas(worldRegion: Rectangle, bufferRegion: Rectangle): void {
    if (!this.imageData) return;

    // Create temporary canvas for the region
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = bufferRegion.width;
    tempCanvas.height = bufferRegion.height;

    // Extract region data from image data
    const regionImageData = tempCtx.createImageData(bufferRegion.width, bufferRegion.height);
    const bufferWidth = Math.ceil(this.width / this.skipPixels);

    for (let y = 0; y < bufferRegion.height; y++) {
      for (let x = 0; x < bufferRegion.width; x++) {
        const srcIndex = ((bufferRegion.y + y) * bufferWidth + (bufferRegion.x + x)) * 4;
        const dstIndex = (y * bufferRegion.width + x) * 4;

        regionImageData.data[dstIndex] = this.imageData.data[srcIndex];
        regionImageData.data[dstIndex + 1] = this.imageData.data[srcIndex + 1];
        regionImageData.data[dstIndex + 2] = this.imageData.data[srcIndex + 2];
        regionImageData.data[dstIndex + 3] = this.imageData.data[srcIndex + 3];
      }
    }

    // Draw region to temporary canvas
    tempCtx.putImageData(regionImageData, 0, 0);

    // Clear the region on main canvas
    this.ctx.clearRect(worldRegion.x, worldRegion.y, worldRegion.width, worldRegion.height);

    // Draw scaled region to main canvas
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(
      tempCanvas,
      0, 0, bufferRegion.width, bufferRegion.height,
      worldRegion.x, worldRegion.y, worldRegion.width, worldRegion.height
    );
  }

  /**
   * Update dirty regions based on particle movement
   */
  private updateDirtyRegions(particles: ReadonlyArray<Particle>): void {
    if (!this.dirtyTracker) return;

    // Mark areas around current particles as dirty
    for (const particle of particles) {
      const previousPosition = this.previousParticles.get(particle);

      if (previousPosition) {
        // Mark moving particle trail as dirty
        this.dirtyTracker.markMovingParticleDirty(
          particle,
          previousPosition,
          this.maxInfluenceDistance
        );
      } else {
        // New particle - mark area as dirty
        this.dirtyTracker.markParticleDirty(particle, this.maxInfluenceDistance);
      }
    }

    // Mark areas where particles disappeared as dirty
    for (const [particle, position] of this.previousParticles.entries()) {
      if (particles.indexOf(particle) === -1) {
        const region = {
          x: position.x - this.maxInfluenceDistance,
          y: position.y - this.maxInfluenceDistance,
          width: this.maxInfluenceDistance * 2,
          height: this.maxInfluenceDistance * 2
        };
        this.dirtyTracker.markDirty(region, 1);
      }
    }
  }

  /**
   * Update previous frame data for dirty tracking
   */
  private updatePreviousFrameData(particles: ReadonlyArray<Particle>): void {
    this.previousParticles.clear();

    for (const particle of particles) {
      this.previousParticles.set(particle, { ...particle.position });
    }
  }

  /**
   * Blend colors from multiple particles at a given position
   * Uses advanced color mixing with additive blending and smooth gradients
   */
  private blendParticleColors(x: number, y: number, particles: ReadonlyArray<Particle>): { r: number, g: number, b: number, a: number } {
    let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
    let totalWeight = 0;
    let maxInfluence = 0;

    // First pass: calculate influences and find maximum
    const particleInfluences: Array<{ particle: Particle, influence: number, rgb: { r: number, g: number, b: number } }> = [];

    for (const particle of particles) {
      const influence = this.calculateParticleInfluence(x, y, particle);

      if (influence > 0.001) { // Lower threshold for smoother gradients
        const rgb = this.hslToRgb(particle.color);
        particleInfluences.push({ particle, influence, rgb });
        maxInfluence = Math.max(maxInfluence, influence);
      }
    }

    if (particleInfluences.length === 0) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    // Enhanced color blending with multiple modes
    if (particleInfluences.length === 1) {
      // Single particle - use direct color with smooth falloff
      const { particle, influence, rgb } = particleInfluences[0];
      const alpha = this.calculateSmoothAlpha(influence, maxInfluence, particle.color.a);

      return {
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        a: Math.round(alpha * 255)
      };
    }

    // Multiple particles - use advanced blending
    return this.blendMultipleParticleColors(particleInfluences, maxInfluence);
  }

  /**
   * Advanced color blending for multiple overlapping particles
   * Implements additive color mixing with energy conservation
   */
  private blendMultipleParticleColors(
    particleInfluences: Array<{ particle: Particle, influence: number, rgb: { r: number, g: number, b: number } }>,
    maxInfluence: number
  ): { r: number, g: number, b: number, a: number } {
    let additiveR = 0, additiveG = 0, additiveB = 0;
    let weightedR = 0, weightedG = 0, weightedB = 0;
    let totalWeight = 0;
    let totalAlpha = 0;

    for (const { particle, influence, rgb } of particleInfluences) {
      const normalizedInfluence = influence / maxInfluence;
      const weight = Math.pow(normalizedInfluence, 0.7); // Gamma correction for smoother blending

      // Additive blending for bright, energetic colors
      const additiveStrength = normalizedInfluence * particle.color.a;
      additiveR += rgb.r * additiveStrength * 0.3; // Reduced additive contribution
      additiveG += rgb.g * additiveStrength * 0.3;
      additiveB += rgb.b * additiveStrength * 0.3;

      // Weighted average blending for base colors
      weightedR += rgb.r * weight;
      weightedG += rgb.g * weight;
      weightedB += rgb.b * weight;
      totalWeight += weight;

      // Alpha accumulation with energy conservation
      totalAlpha += particle.color.a * normalizedInfluence;
    }

    if (totalWeight === 0) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    // Combine additive and weighted blending
    const baseR = weightedR / totalWeight;
    const baseG = weightedG / totalWeight;
    const baseB = weightedB / totalWeight;

    const finalR = Math.min(255, baseR + additiveR);
    const finalG = Math.min(255, baseG + additiveG);
    const finalB = Math.min(255, baseB + additiveB);

    // Apply color enhancement for more vibrant results
    const enhanced = this.enhanceColor(finalR, finalG, finalB);

    return {
      r: Math.round(enhanced.r),
      g: Math.round(enhanced.g),
      b: Math.round(enhanced.b),
      a: Math.round(Math.min(255, totalAlpha * 255))
    };
  }

  /**
   * Calculate smooth alpha falloff for better visual continuity
   */
  private calculateSmoothAlpha(influence: number, maxInfluence: number, particleAlpha: number): number {
    const normalizedInfluence = influence / maxInfluence;

    // Apply smooth step function for better falloff
    const smoothed = this.smoothStep(0, 1, normalizedInfluence);

    return smoothed * particleAlpha;
  }

  /**
   * Smooth step function for better interpolation
   */
  private smoothStep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  /**
   * Enhance color vibrancy and contrast
   */
  private enhanceColor(r: number, g: number, b: number): { r: number, g: number, b: number } {
    // Convert to HSL for enhancement
    const hsl = this.rgbToHsl(r, g, b);

    // Enhance saturation slightly
    hsl.s = Math.min(100, hsl.s * 1.1);

    // Adjust lightness for better contrast
    if (hsl.l < 30) {
      hsl.l = Math.min(50, hsl.l * 1.2); // Brighten dark colors
    } else if (hsl.l > 70) {
      hsl.l = Math.max(50, hsl.l * 0.9); // Darken light colors
    }

    return this.hslToRgb({ h: hsl.h, s: hsl.s, l: hsl.l, a: 1 });
  }

  /**
   * Convert RGB to HSL for color manipulation
   */
  private rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // Achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
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
   * Render the final image to canvas with enhanced visual effects
   */
  private renderToCanvas(): void {
    if (!this.imageData) return;

    // Apply pre-processing effects to image data
    this.applyGradientSmoothing();

    // Create a temporary canvas for scaling if needed
    if (this.skipPixels > 1) {
      this.renderScaled();
    } else {
      // Direct rendering for full resolution
      this.ctx.putImageData(this.imageData, 0, 0);
    }

    // Apply post-processing effects
    this.applyPostProcessingEffects();
  }

  /**
   * Apply gradient smoothing to the image data for better visual quality
   */
  private applyGradientSmoothing(): void {
    if (!this.imageData) return;

    const data = this.imageData.data;
    const width = this.imageData.width;
    const height = this.imageData.height;

    // Create smoothed version
    const smoothed = new Uint8ClampedArray(data);

    // Apply gradient-aware smoothing
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Skip transparent pixels
        if (data[idx + 3] === 0) continue;

        // Calculate gradient magnitude
        const gradientMag = this.calculateGradientMagnitude(data, x, y, width);

        // Apply smoothing based on gradient (less smoothing on edges)
        if (gradientMag < 50) { // Low gradient area - apply more smoothing
          const smoothedPixel = this.calculateSmoothedPixel(data, x, y, width);
          smoothed[idx] = smoothedPixel.r;
          smoothed[idx + 1] = smoothedPixel.g;
          smoothed[idx + 2] = smoothedPixel.b;
          smoothed[idx + 3] = smoothedPixel.a;
        }
      }
    }

    // Update image data
    this.imageData.data.set(smoothed);
  }

  /**
   * Calculate gradient magnitude for edge detection
   */
  private calculateGradientMagnitude(data: Uint8ClampedArray, x: number, y: number, width: number): number {
    const idx = (y * width + x) * 4;

    // Sobel operators
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];

    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ];

    let gx = 0, gy = 0;

    for (let ky = -1; ky <= 1; ky++) {
      for (let kx = -1; kx <= 1; kx++) {
        const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
        const intensity = (data[pixelIdx] + data[pixelIdx + 1] + data[pixelIdx + 2]) / 3;

        gx += intensity * sobelX[ky + 1][kx + 1];
        gy += intensity * sobelY[ky + 1][kx + 1];
      }
    }

    return Math.sqrt(gx * gx + gy * gy);
  }

  /**
   * Calculate smoothed pixel value using weighted average
   */
  private calculateSmoothedPixel(data: Uint8ClampedArray, x: number, y: number, width: number): { r: number, g: number, b: number, a: number } {
    let r = 0, g = 0, b = 0, a = 0;
    let totalWeight = 0;

    // 3x3 Gaussian kernel
    const weights = [
      [0.0625, 0.125, 0.0625],
      [0.125, 0.25, 0.125],
      [0.0625, 0.125, 0.0625]
    ];

    for (let ky = -1; ky <= 1; ky++) {
      for (let kx = -1; kx <= 1; kx++) {
        const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
        const weight = weights[ky + 1][kx + 1];

        r += data[pixelIdx] * weight;
        g += data[pixelIdx + 1] * weight;
        b += data[pixelIdx + 2] * weight;
        a += data[pixelIdx + 3] * weight;
        totalWeight += weight;
      }
    }

    return {
      r: Math.round(r / totalWeight),
      g: Math.round(g / totalWeight),
      b: Math.round(b / totalWeight),
      a: Math.round(a / totalWeight)
    };
  }

  /**
   * Render scaled version with high-quality interpolation
   */
  private renderScaled(): void {
    if (!this.imageData) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const bufferWidth = Math.ceil(this.width / this.skipPixels);
    const bufferHeight = Math.ceil(this.height / this.skipPixels);

    tempCanvas.width = bufferWidth;
    tempCanvas.height = bufferHeight;

    // Draw the low-res image
    tempCtx.putImageData(this.imageData, 0, 0);

    // Use high-quality scaling
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Scale up to full canvas size
    this.ctx.drawImage(tempCanvas, 0, 0, bufferWidth, bufferHeight, 0, 0, this.width, this.height);
  }

  /**
   * Apply post-processing effects for enhanced visual quality
   */
  private applyPostProcessingEffects(): void {
    // Apply blur and smoothing
    if (this.blurAmount > 0) {
      this.applyBlur();
    }

    // Apply subtle glow effect for more appealing visuals
    this.applyGlowEffect();

    // Apply color enhancement
    this.applyColorEnhancement();
  }

  /**
   * Apply subtle glow effect around particles
   */
  private applyGlowEffect(): void {
    // Save current state
    this.ctx.save();

    // Create glow by drawing the same content with blur and lower opacity
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.globalAlpha = 0.3;
    this.ctx.filter = `blur(${Math.max(1, this.blurAmount * 0.5)}px)`;

    // Draw the canvas onto itself for glow effect
    this.ctx.drawImage(this.canvas, 0, 0);

    // Restore state
    this.ctx.restore();
  }

  /**
   * Apply color enhancement for more vibrant results
   */
  private applyColorEnhancement(): void {
    try {
      const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Skip transparent pixels
        if (data[i + 3] === 0) continue;

        // Apply subtle contrast and saturation enhancement
        const enhanced = this.enhancePixel(data[i], data[i + 1], data[i + 2]);

        data[i] = enhanced.r;
        data[i + 1] = enhanced.g;
        data[i + 2] = enhanced.b;
      }

      this.ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      // Gracefully handle test environments
      if (typeof ImageData === 'undefined') {
        return;
      }
      throw error;
    }
  }

  /**
   * Enhance individual pixel for better visual quality
   */
  private enhancePixel(r: number, g: number, b: number): { r: number, g: number, b: number } {
    // Convert to HSL for enhancement
    const hsl = this.rgbToHsl(r, g, b);

    // Apply subtle enhancements
    hsl.s = Math.min(100, hsl.s * 1.05); // Slight saturation boost

    // Apply contrast curve
    hsl.l = this.applyContrastCurve(hsl.l);

    return this.hslToRgb({ h: hsl.h, s: hsl.s, l: hsl.l, a: 1 });
  }

  /**
   * Apply S-curve for better contrast
   */
  private applyContrastCurve(lightness: number): number {
    const normalized = lightness / 100;

    // S-curve function for subtle contrast enhancement
    const enhanced = normalized < 0.5
      ? 2 * normalized * normalized
      : 1 - 2 * (1 - normalized) * (1 - normalized);

    return enhanced * 100;
  }

  /**
   * Apply advanced blur and smoothing effects for realistic appearance
   */
  private applyBlur(): void {
    if (this.blurAmount <= 0) return;

    // Apply multiple blur techniques for better quality
    this.applyGaussianBlur();
    this.applyEdgeSmoothing();
  }

  /**
   * Apply Gaussian blur using canvas filter
   */
  private applyGaussianBlur(): void {
    // Save current state
    this.ctx.save();

    // Apply blur filter
    this.ctx.filter = `blur(${this.blurAmount}px)`;

    // Create temporary canvas for blur operation
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      this.ctx.restore();
      return;
    }

    tempCanvas.width = this.width;
    tempCanvas.height = this.height;

    // Copy current canvas to temp canvas
    tempCtx.drawImage(this.canvas, 0, 0);

    // Clear main canvas and draw blurred version
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(tempCanvas, 0, 0);

    // Restore state
    this.ctx.restore();
  }

  /**
   * Apply edge smoothing for better visual quality
   */
  private applyEdgeSmoothing(): void {
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    const smoothedData = new Uint8ClampedArray(data);

    // Apply simple edge smoothing kernel
    const kernel = [
      [0.0625, 0.125, 0.0625],
      [0.125, 0.25, 0.125],
      [0.0625, 0.125, 0.0625]
    ];

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const idx = (y * this.width + x) * 4;

        // Skip if pixel is already transparent
        if (data[idx + 3] === 0) continue;

        let r = 0, g = 0, b = 0, a = 0;

        // Apply convolution kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIdx = ((y + ky) * this.width + (x + kx)) * 4;
            const weight = kernel[ky + 1][kx + 1];

            r += data[pixelIdx] * weight;
            g += data[pixelIdx + 1] * weight;
            b += data[pixelIdx + 2] * weight;
            a += data[pixelIdx + 3] * weight;
          }
        }

        smoothedData[idx] = Math.round(r);
        smoothedData[idx + 1] = Math.round(g);
        smoothedData[idx + 2] = Math.round(b);
        smoothedData[idx + 3] = Math.round(a);
      }
    }

    // Apply smoothed data back to canvas
    try {
      const smoothedImageData = new ImageData(smoothedData, this.width, this.height);
      this.ctx.putImageData(smoothedImageData, 0, 0);
    } catch (error) {
      // Fallback for test environments without ImageData constructor
      if (typeof ImageData === 'undefined') {
        return;
      }
      throw error;
    }
  }

  /**
   * Convert HSL color to RGB
   */
  private hslToRgb(hsl: HSLColor): { r: number, g: number, b: number } {
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
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
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
   * Enable or disable optimizations
   */
  setOptimizationsEnabled(enabled: boolean): void {
    this.useOptimizations = enabled;
  }

  /**
   * Enable or disable spatial partitioning
   */
  setSpatialPartitioningEnabled(enabled: boolean): void {
    this.useSpatialPartitioning = enabled;

    if (!enabled && this.spatialGrid) {
      this.spatialGrid = null;
    } else if (enabled && !this.spatialGrid) {
      const bounds = { x: 0, y: 0, width: this.width, height: this.height };
      this.spatialGrid = new MetaballSpatialGrid(bounds, 100, this.maxInfluenceDistance);
    }
  }

  /**
   * Enable or disable dirty rectangle tracking
   */
  setDirtyRectanglesEnabled(enabled: boolean): void {
    this.useDirtyRectangles = enabled;

    if (!enabled && this.dirtyTracker) {
      this.dirtyTracker = null;
    } else if (enabled && !this.dirtyTracker) {
      const bounds = { x: 0, y: 0, width: this.width, height: this.height };
      this.dirtyTracker = new DirtyRectangleTracker(bounds);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    bufferSize: number;
    fieldBufferLength: number;
    colorBufferLength: number;
    skipPixels: number;
    optimizationsEnabled: boolean;
    spatialPartitioning?: {
      enabled: boolean;
      totalCells: number;
      activeCells: number;
      totalParticles: number;
      averageParticlesPerCell: number;
    };
    dirtyRectangles?: {
      enabled: boolean;
      regionCount: number;
      dirtyPercentage: number;
      averageRegionSize: number;
    };
  } {
    const bufferWidth = Math.ceil(this.width / this.skipPixels);
    const bufferHeight = Math.ceil(this.height / this.skipPixels);

    const stats: any = {
      bufferSize: bufferWidth * bufferHeight,
      fieldBufferLength: this.fieldBuffer?.length || 0,
      colorBufferLength: this.colorBuffer?.length || 0,
      skipPixels: this.skipPixels,
      optimizationsEnabled: this.useOptimizations
    };

    if (this.spatialGrid) {
      const spatialStats = this.spatialGrid.getStats();
      stats.spatialPartitioning = {
        enabled: this.useSpatialPartitioning,
        totalCells: spatialStats.totalCells,
        activeCells: spatialStats.activeCells,
        totalParticles: spatialStats.totalParticles,
        averageParticlesPerCell: spatialStats.averageParticlesPerCell
      };
    }

    if (this.dirtyTracker) {
      const dirtyStats = this.dirtyTracker.getStats();
      stats.dirtyRectangles = {
        enabled: this.useDirtyRectangles,
        regionCount: dirtyStats.regionCount,
        dirtyPercentage: dirtyStats.dirtyPercentage,
        averageRegionSize: dirtyStats.averageRegionSize
      };
    }

    return stats;
  }
}
/**
 * Fallback rendering modes for different browser capabilities
 */

import { Vector2, HSLColor } from '../types';

export type RenderingMode = 'metaball' | 'simple' | 'basic' | 'disabled';

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: HSLColor;
  createdAt: number;
}

export interface FallbackRendererConfig {
  mode: RenderingMode;
  particleCount: number;
  enableBlur: boolean;
  enableCompositing: boolean;
  enableTransforms: boolean;
  pixelSkip: number;
  simplificationLevel: number;
}

/**
 * Base renderer interface
 */
export interface IRenderer {
  render(particles: ReadonlyArray<Particle>): void;
  clear(): void;
  resize(width: number, height: number): void;
  setConfig(config: Partial<FallbackRendererConfig>): void;
  getMode(): RenderingMode;
}

/**
 * Metaball renderer for high-end browsers
 */
export class MetaballRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData | null = null;
  private config: FallbackRendererConfig;

  constructor(canvas: HTMLCanvasElement, config: FallbackRendererConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context');
    }
    this.ctx = ctx;
    this.config = config;
  }

  render(particles: ReadonlyArray<Particle>): void {
    if (!this.imageData) return;

    const { width, height } = this.canvas;
    const data = this.imageData.data;
    const pixelSkip = this.config.pixelSkip || 1;

    // Clear the image data
    data.fill(0);

    // Calculate metaball field
    for (let y = 0; y < height; y += pixelSkip) {
      for (let x = 0; x < width; x += pixelSkip) {
        let field = 0;
        let r = 0, g = 0, b = 0, a = 0;

        for (const particle of particles) {
          const dx = x - particle.position.x;
          const dy = y - particle.position.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq > 0) {
            const influence = (particle.size * particle.size) / distSq;
            field += influence;

            // Accumulate color based on influence
            const weight = influence * particle.life;
            r += particle.color.h * weight;
            g += particle.color.s * weight;
            b += particle.color.l * weight;
            a += particle.color.a * weight;
          }
        }

        // Apply threshold and set pixel
        if (field > 1.0) {
          const alpha = Math.min(255, field * 50);
          const hue = r / particles.length;
          const sat = g / particles.length;
          const light = b / particles.length;

          const rgb = this.hslToRgb(hue, sat, light);
          
          // Fill pixels with skipping
          for (let sy = 0; sy < pixelSkip && y + sy < height; sy++) {
            for (let sx = 0; sx < pixelSkip && x + sx < width; sx++) {
              const index = ((y + sy) * width + (x + sx)) * 4;
              data[index] = rgb.r;
              data[index + 1] = rgb.g;
              data[index + 2] = rgb.b;
              data[index + 3] = alpha;
            }
          }
        }
      }
    }

    // Put image data back to canvas
    this.ctx.putImageData(this.imageData, 0, 0);

    // Apply blur if enabled
    if (this.config.enableBlur) {
      this.ctx.filter = 'blur(2px)';
      this.ctx.drawImage(this.canvas, 0, 0);
      this.ctx.filter = 'none';
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    try {
      this.imageData = this.ctx.createImageData(width, height);
    } catch (error) {
      console.warn('Failed to create ImageData, falling back to simple rendering');
      this.imageData = null;
    }
  }

  setConfig(config: Partial<FallbackRendererConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getMode(): RenderingMode {
    return 'metaball';
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h = h % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }
}

/**
 * Simple particle renderer for medium-capability browsers
 */
export class SimpleRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: FallbackRendererConfig;

  constructor(canvas: HTMLCanvasElement, config: FallbackRendererConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context');
    }
    this.ctx = ctx;
    this.config = config;
  }

  render(particles: ReadonlyArray<Particle>): void {
    // Set composite operation if supported
    if (this.config.enableCompositing) {
      this.ctx.globalCompositeOperation = 'lighter';
    }

    for (const particle of particles) {
      const alpha = particle.life * particle.color.a;
      const rgb = this.hslToRgb(particle.color.h, particle.color.s, particle.color.l);
      
      this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      
      this.ctx.beginPath();
      this.ctx.arc(
        particle.position.x,
        particle.position.y,
        particle.size * particle.life,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }

    // Reset composite operation
    if (this.config.enableCompositing) {
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setConfig(config: Partial<FallbackRendererConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getMode(): RenderingMode {
    return 'simple';
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h = h % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }
}

/**
 * Basic renderer for low-capability browsers
 */
export class BasicRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: FallbackRendererConfig;

  constructor(canvas: HTMLCanvasElement, config: FallbackRendererConfig) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get 2D context');
    }
    this.ctx = ctx;
    this.config = config;
  }

  render(particles: ReadonlyArray<Particle>): void {
    // Use simple rectangles for maximum compatibility
    for (const particle of particles) {
      const alpha = particle.life;
      const size = Math.max(2, particle.size * particle.life);
      
      // Use simple color without HSL conversion
      this.ctx.fillStyle = `rgba(255, 100, 150, ${alpha * 0.5})`;
      
      this.ctx.fillRect(
        particle.position.x - size / 2,
        particle.position.y - size / 2,
        size,
        size
      );
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setConfig(config: Partial<FallbackRendererConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getMode(): RenderingMode {
    return 'basic';
  }
}

/**
 * Disabled renderer for unsupported browsers
 */
export class DisabledRenderer implements IRenderer {
  render(particles: ReadonlyArray<Particle>): void {
    // Do nothing
  }

  clear(): void {
    // Do nothing
  }

  resize(width: number, height: number): void {
    // Do nothing
  }

  setConfig(config: Partial<FallbackRendererConfig>): void {
    // Do nothing
  }

  getMode(): RenderingMode {
    return 'disabled';
  }
}

/**
 * Factory for creating appropriate renderer based on capabilities
 */
export class RendererFactory {
  static createRenderer(
    canvas: HTMLCanvasElement,
    mode: RenderingMode,
    config: FallbackRendererConfig
  ): IRenderer {
    switch (mode) {
      case 'metaball':
        return new MetaballRenderer(canvas, config);
      case 'simple':
        return new SimpleRenderer(canvas, config);
      case 'basic':
        return new BasicRenderer(canvas, config);
      case 'disabled':
        return new DisabledRenderer();
      default:
        throw new Error(`Unknown rendering mode: ${mode}`);
    }
  }

  static selectBestMode(capabilities: {
    canvas2d: boolean;
    imageData: boolean;
    compositeOperations: boolean;
    transforms: boolean;
  }): RenderingMode {
    if (!capabilities.canvas2d) {
      return 'disabled';
    }

    if (capabilities.imageData && capabilities.compositeOperations) {
      return 'metaball';
    }

    if (capabilities.compositeOperations) {
      return 'simple';
    }

    return 'basic';
  }
}
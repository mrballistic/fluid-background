/**
 * Browser compatibility detection and feature support utilities
 */

export interface BrowserCapabilities {
  canvas2d: boolean;
  imageData: boolean;
  requestAnimationFrame: boolean;
  performanceNow: boolean;
  addEventListener: boolean;
  compositeOperations: boolean;
  transforms: boolean;
  webgl: boolean;
  devicePixelRatio: boolean;
  visibilityAPI: boolean;
}

export interface PerformanceCapabilities {
  isHighPerformance: boolean;
  estimatedParticleLimit: number;
  supportsMetaballs: boolean;
  recommendedQuality: 'high' | 'medium' | 'low';
}

/**
 * Detects browser capabilities for splash cursor functionality
 */
export class BrowserCompatibility {
  private static _capabilities: BrowserCapabilities | null = null;
  private static _performance: PerformanceCapabilities | null = null;

  /**
   * Get browser capabilities (cached after first call)
   */
  static getCapabilities(): BrowserCapabilities {
    if (!this._capabilities) {
      this._capabilities = this.detectCapabilities();
    }
    return this._capabilities;
  }

  /**
   * Get performance capabilities (cached after first call)
   */
  static getPerformanceCapabilities(): PerformanceCapabilities {
    if (!this._performance) {
      this._performance = this.detectPerformanceCapabilities();
    }
    return this._performance;
  }

  /**
   * Check if the browser supports all required features
   */
  static isSupported(): boolean {
    const caps = this.getCapabilities();
    return caps.canvas2d && caps.imageData && caps.requestAnimationFrame;
  }

  /**
   * Get recommended configuration based on browser capabilities
   */
  static getRecommendedConfig() {
    const caps = this.getCapabilities();
    const perf = this.getPerformanceCapabilities();

    return {
      particleCount: perf.estimatedParticleLimit,
      quality: perf.recommendedQuality,
      useMetaballs: perf.supportsMetaballs,
      enableBlur: caps.compositeOperations,
      enableTransforms: caps.transforms,
      targetFPS: perf.isHighPerformance ? 60 : 30,
    };
  }

  /**
   * Detect all browser capabilities
   */
  private static detectCapabilities(): BrowserCapabilities {
    return {
      canvas2d: this.detectCanvas2D(),
      imageData: this.detectImageData(),
      requestAnimationFrame: this.detectRequestAnimationFrame(),
      performanceNow: this.detectPerformanceNow(),
      addEventListener: this.detectAddEventListener(),
      compositeOperations: this.detectCompositeOperations(),
      transforms: this.detectTransforms(),
      webgl: this.detectWebGL(),
      devicePixelRatio: this.detectDevicePixelRatio(),
      visibilityAPI: this.detectVisibilityAPI(),
    };
  }

  /**
   * Detect performance capabilities
   */
  private static detectPerformanceCapabilities(): PerformanceCapabilities {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad/.test(userAgent);
    const isOldBrowser = this.isOldBrowser();
    
    // Estimate performance based on various factors
    let performanceScore = 100;
    
    if (isMobile) performanceScore -= 30;
    if (isOldBrowser) performanceScore -= 40;
    if (!this.detectWebGL()) performanceScore -= 20;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      performanceScore -= 20;
    }

    const isHighPerformance = performanceScore >= 70;
    const isMediumPerformance = performanceScore >= 40;

    return {
      isHighPerformance,
      estimatedParticleLimit: isHighPerformance ? 150 : isMediumPerformance ? 100 : 50,
      supportsMetaballs: performanceScore >= 50 && this.detectImageData(),
      recommendedQuality: isHighPerformance ? 'high' : isMediumPerformance ? 'medium' : 'low',
    };
  }

  /**
   * Check if browser is considered old/unsupported
   */
  private static isOldBrowser(): boolean {
    const userAgent = navigator.userAgent;
    
    // Check for old IE versions
    if (/MSIE [6-9]/.test(userAgent)) return true;
    
    // Check for old Chrome versions (< 30)
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    if (chromeMatch && parseInt(chromeMatch[1]) < 30) return true;
    
    // Check for old Firefox versions (< 25)
    const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
    if (firefoxMatch && parseInt(firefoxMatch[1]) < 25) return true;
    
    // Check for old Safari versions (< 7)
    const safariMatch = userAgent.match(/Version\/(\d+).*Safari/);
    if (safariMatch && parseInt(safariMatch[1]) < 7) return true;
    
    return false;
  }

  /**
   * Detect Canvas 2D context support
   */
  private static detectCanvas2D(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      return ctx !== null;
    } catch {
      return false;
    }
  }

  /**
   * Detect ImageData support
   */
  private static detectImageData(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      canvas.width = 1;
      canvas.height = 1;
      const imageData = ctx.createImageData(1, 1);
      return imageData && imageData.data && imageData.data.length === 4;
    } catch {
      return false;
    }
  }

  /**
   * Detect requestAnimationFrame support
   */
  private static detectRequestAnimationFrame(): boolean {
    return typeof window !== 'undefined' && 
           (typeof window.requestAnimationFrame === 'function' ||
            typeof (window as any).webkitRequestAnimationFrame === 'function' ||
            typeof (window as any).mozRequestAnimationFrame === 'function');
  }

  /**
   * Detect performance.now() support
   */
  private static detectPerformanceNow(): boolean {
    return typeof performance !== 'undefined' && 
           typeof performance.now === 'function';
  }

  /**
   * Detect addEventListener support
   */
  private static detectAddEventListener(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.addEventListener === 'function';
  }

  /**
   * Detect composite operations support
   */
  private static detectCompositeOperations(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      ctx.globalCompositeOperation = 'lighter';
      return ctx.globalCompositeOperation === 'lighter';
    } catch {
      return false;
    }
  }

  /**
   * Detect transform support
   */
  private static detectTransforms(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      return typeof ctx.setTransform === 'function';
    } catch {
      return false;
    }
  }

  /**
   * Detect WebGL support
   */
  private static detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl !== null;
    } catch {
      return false;
    }
  }

  /**
   * Detect devicePixelRatio support
   */
  private static detectDevicePixelRatio(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.devicePixelRatio === 'number';
  }

  /**
   * Detect Page Visibility API support
   */
  private static detectVisibilityAPI(): boolean {
    return typeof document !== 'undefined' && 
           (typeof document.hidden !== 'undefined' ||
            typeof (document as any).webkitHidden !== 'undefined' ||
            typeof (document as any).mozHidden !== 'undefined');
  }
}
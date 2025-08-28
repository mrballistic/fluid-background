/**
 * Graceful degradation system for handling unsupported browser features
 */

import { BrowserCompatibility, BrowserCapabilities, PerformanceCapabilities } from './browser-compatibility';
import { installPolyfills } from './polyfills';

export interface DegradationConfig {
  enableFallbacks: boolean;
  autoInstallPolyfills: boolean;
  fallbackMode: 'disable' | 'simple' | 'compatible';
  onUnsupported?: (reason: string) => void;
  onDegraded?: (level: DegradationLevel) => void;
}

export type DegradationLevel = 'none' | 'minor' | 'major' | 'severe' | 'disabled';

export interface DegradedFeatures {
  level: DegradationLevel;
  disabledFeatures: string[];
  enabledFeatures: string[];
  recommendedConfig: any;
  canRun: boolean;
  warnings: string[];
}

/**
 * Manages graceful degradation for splash cursor functionality
 */
export class GracefulDegradation {
  private config: DegradationConfig;
  private capabilities: BrowserCapabilities;
  private performance: PerformanceCapabilities;
  private degradedFeatures: DegradedFeatures | null = null;

  constructor(config: Partial<DegradationConfig> = {}) {
    this.config = {
      enableFallbacks: true,
      autoInstallPolyfills: true,
      fallbackMode: 'compatible',
      ...config,
    };

    // Install polyfills if enabled
    if (this.config.autoInstallPolyfills) {
      installPolyfills();
    }

    this.capabilities = BrowserCompatibility.getCapabilities();
    this.performance = BrowserCompatibility.getPerformanceCapabilities();
  }

  /**
   * Analyze browser capabilities and determine degradation level
   */
  analyze(): DegradedFeatures {
    if (this.degradedFeatures) {
      return this.degradedFeatures;
    }

    const disabledFeatures: string[] = [];
    const enabledFeatures: string[] = [];
    const warnings: string[] = [];
    let level: DegradationLevel = 'none';

    // Check critical features
    if (!this.capabilities.canvas2d) {
      disabledFeatures.push('canvas2d');
      warnings.push('Canvas 2D context not supported');
      level = 'disabled';
    } else {
      enabledFeatures.push('canvas2d');
    }

    if (!this.capabilities.requestAnimationFrame) {
      disabledFeatures.push('requestAnimationFrame');
      warnings.push('RequestAnimationFrame not supported, using setTimeout fallback');
      if (level === 'none') level = 'minor';
    } else {
      enabledFeatures.push('requestAnimationFrame');
    }

    // Check advanced features
    if (!this.capabilities.imageData) {
      disabledFeatures.push('imageData');
      warnings.push('ImageData not supported, metaball rendering disabled');
      if (level === 'none') level = 'major';
    } else {
      enabledFeatures.push('imageData');
    }

    if (!this.capabilities.compositeOperations) {
      disabledFeatures.push('compositeOperations');
      warnings.push('Composite operations not supported, reduced visual effects');
      if (level === 'none') level = 'minor';
    } else {
      enabledFeatures.push('compositeOperations');
    }

    if (!this.capabilities.transforms) {
      disabledFeatures.push('transforms');
      warnings.push('Canvas transforms not supported');
      if (level === 'none') level = 'minor';
    } else {
      enabledFeatures.push('transforms');
    }

    // Check performance-related features
    if (!this.performance.supportsMetaballs) {
      disabledFeatures.push('metaballs');
      warnings.push('Metaball rendering disabled due to performance constraints');
      if (level === 'none') level = 'major';
    } else {
      enabledFeatures.push('metaballs');
    }

    if (!this.performance.isHighPerformance) {
      warnings.push('Low performance detected, reducing particle count and effects');
      if (level === 'none') level = 'minor';
    }

    // Determine if we can run at all
    const canRun = level !== 'disabled' && this.capabilities.canvas2d;

    // Generate recommended configuration
    const recommendedConfig = this.generateRecommendedConfig(disabledFeatures, enabledFeatures);

    this.degradedFeatures = {
      level,
      disabledFeatures,
      enabledFeatures,
      recommendedConfig,
      canRun,
      warnings,
    };

    // Notify callbacks
    if (level !== 'none' && this.config.onDegraded) {
      this.config.onDegraded(level);
    }

    if (!canRun && this.config.onUnsupported) {
      this.config.onUnsupported('Critical features not supported');
    }

    return this.degradedFeatures;
  }

  /**
   * Get degraded features (analyze if not done yet)
   */
  getDegradedFeatures(): DegradedFeatures {
    return this.analyze();
  }

  /**
   * Check if splash cursor can run in current browser
   */
  canRun(): boolean {
    return this.analyze().canRun;
  }

  /**
   * Get warnings about degraded functionality
   */
  getWarnings(): string[] {
    return this.analyze().warnings;
  }

  /**
   * Get recommended configuration for current browser
   */
  getRecommendedConfig(): any {
    return this.analyze().recommendedConfig;
  }

  /**
   * Generate recommended configuration based on capabilities
   */
  private generateRecommendedConfig(disabledFeatures: string[], enabledFeatures: string[]): any {
    const baseConfig = BrowserCompatibility.getRecommendedConfig();
    
    const config = {
      ...baseConfig,
      // Disable features that aren't supported
      useMetaballs: enabledFeatures.indexOf('metaballs') !== -1 && enabledFeatures.indexOf('imageData') !== -1,
      enableBlur: enabledFeatures.indexOf('compositeOperations') !== -1,
      enableTransforms: enabledFeatures.indexOf('transforms') !== -1,
      
      // Adjust performance settings
      particleCount: this.getAdjustedParticleCount(disabledFeatures),
      targetFPS: this.getAdjustedTargetFPS(disabledFeatures),
      
      // Fallback modes
      renderingMode: this.getRenderingMode(disabledFeatures),
      animationMode: enabledFeatures.indexOf('requestAnimationFrame') !== -1 ? 'raf' : 'timeout',
    };

    // Apply fallback mode settings
    switch (this.config.fallbackMode) {
      case 'disable':
        if (disabledFeatures.length > 0) {
          return { ...config, enabled: false };
        }
        break;
        
      case 'simple':
        return {
          ...config,
          useMetaballs: false,
          enableBlur: false,
          particleCount: Math.min(config.particleCount, 30),
          renderingMode: 'simple',
        };
        
      case 'compatible':
      default:
        // Use the calculated config as-is
        break;
    }

    return config;
  }

  /**
   * Get adjusted particle count based on disabled features
   */
  private getAdjustedParticleCount(disabledFeatures: string[]): number {
    let baseCount = this.performance.estimatedParticleLimit;
    
    // Reduce particle count for each disabled feature that affects performance
    if (disabledFeatures.indexOf('metaballs') !== -1) baseCount *= 0.8;
    if (disabledFeatures.indexOf('compositeOperations') !== -1) baseCount *= 0.9;
    if (disabledFeatures.indexOf('transforms') !== -1) baseCount *= 0.95;
    
    return Math.max(10, Math.floor(baseCount));
  }

  /**
   * Get adjusted target FPS based on capabilities
   */
  private getAdjustedTargetFPS(disabledFeatures: string[]): number {
    if (!this.performance.isHighPerformance) return 30;
    if (disabledFeatures.indexOf('requestAnimationFrame') !== -1) return 30;
    return 60;
  }

  /**
   * Determine rendering mode based on capabilities
   */
  private getRenderingMode(disabledFeatures: string[]): 'metaball' | 'simple' | 'basic' {
    if (disabledFeatures.indexOf('imageData') !== -1 || disabledFeatures.indexOf('metaballs') !== -1) {
      if (disabledFeatures.indexOf('compositeOperations') !== -1) {
        return 'basic';
      }
      return 'simple';
    }
    return 'metaball';
  }

  /**
   * Create a compatibility report
   */
  generateCompatibilityReport(): string {
    const features = this.analyze();
    const caps = this.capabilities;
    const perf = this.performance;

    let report = '=== Splash Cursor Compatibility Report ===\n\n';
    
    report += `Overall Status: ${features.canRun ? 'COMPATIBLE' : 'INCOMPATIBLE'}\n`;
    report += `Degradation Level: ${features.level.toUpperCase()}\n\n`;
    
    report += '--- Browser Capabilities ---\n';
    report += `Canvas 2D: ${caps.canvas2d ? '✓' : '✗'}\n`;
    report += `ImageData: ${caps.imageData ? '✓' : '✗'}\n`;
    report += `RequestAnimationFrame: ${caps.requestAnimationFrame ? '✓' : '✗'}\n`;
    report += `Performance.now(): ${caps.performanceNow ? '✓' : '✗'}\n`;
    report += `Event Listeners: ${caps.addEventListener ? '✓' : '✗'}\n`;
    report += `Composite Operations: ${caps.compositeOperations ? '✓' : '✗'}\n`;
    report += `Canvas Transforms: ${caps.transforms ? '✓' : '✗'}\n`;
    report += `WebGL: ${caps.webgl ? '✓' : '✗'}\n`;
    report += `Device Pixel Ratio: ${caps.devicePixelRatio ? '✓' : '✗'}\n`;
    report += `Visibility API: ${caps.visibilityAPI ? '✓' : '✗'}\n\n`;
    
    report += '--- Performance Assessment ---\n';
    report += `Performance Level: ${perf.isHighPerformance ? 'High' : 'Low/Medium'}\n`;
    report += `Estimated Particle Limit: ${perf.estimatedParticleLimit}\n`;
    report += `Supports Metaballs: ${perf.supportsMetaballs ? '✓' : '✗'}\n`;
    report += `Recommended Quality: ${perf.recommendedQuality}\n\n`;
    
    if (features.warnings.length > 0) {
      report += '--- Warnings ---\n';
      features.warnings.forEach(warning => {
        report += `⚠ ${warning}\n`;
      });
      report += '\n';
    }
    
    report += '--- Recommended Configuration ---\n';
    report += JSON.stringify(features.recommendedConfig, null, 2);
    
    return report;
  }
}
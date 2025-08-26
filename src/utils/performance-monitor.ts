/**
 * Performance monitoring utilities for splash cursor system
 */

import { 
  SplashCursorPerformanceMetrics, 
  QualityLevel, 
  QualitySettings,
  PerformanceError 
} from '../types/splash-cursor';
import { errorHandler } from './error-handler';
import { getHighResolutionTime } from './splash-cursor';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  // Performance tracking
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameTimeHistory: number[] = [];
  private fpsHistory: number[] = [];
  private droppedFrames: number = 0;
  
  // Timing measurements
  private renderTimeHistory: number[] = [];
  private updateTimeHistory: number[] = [];
  private lastRenderStart: number = 0;
  private lastUpdateStart: number = 0;
  
  // Performance targets
  private targetFPS: number = 60;
  private minAcceptableFPS: number = 30;
  private performanceCheckInterval: number = 1000; // 1 second
  private lastPerformanceCheck: number = 0;
  
  // Quality management
  private currentQuality: QualityLevel = 'high';
  private qualitySettings: Record<QualityLevel, QualitySettings> = {
    high: {
      particleCount: 150,
      metaballThreshold: 0.6,
      blurAmount: 2,
      skipPixels: 1,
      targetFPS: 60
    },
    medium: {
      particleCount: 100,
      metaballThreshold: 0.7,
      blurAmount: 1,
      skipPixels: 2,
      targetFPS: 45
    },
    low: {
      particleCount: 50,
      metaballThreshold: 0.8,
      blurAmount: 0,
      skipPixels: 3,
      targetFPS: 30
    },
    minimal: {
      particleCount: 25,
      metaballThreshold: 0.9,
      blurAmount: 0,
      skipPixels: 4,
      targetFPS: 20
    }
  };
  
  // Callbacks
  private qualityChangeCallbacks: Array<(quality: QualityLevel, settings: QualitySettings) => void> = [];
  private performanceCallbacks: Array<(metrics: SplashCursorPerformanceMetrics) => void> = [];
  
  // Configuration
  private maxHistoryLength: number = 60; // Keep 1 second of history at 60fps
  private adaptiveQualityEnabled: boolean = true;
  private isMonitoring: boolean = false;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Monitoring control
  public startMonitoring(targetFPS: number = 60): void {
    this.targetFPS = targetFPS;
    this.minAcceptableFPS = Math.max(20, targetFPS * 0.5);
    this.isMonitoring = true;
    this.lastFrameTime = getHighResolutionTime();
    this.lastPerformanceCheck = this.lastFrameTime;
    
    console.log(`[SplashCursor] Performance monitoring started (target: ${targetFPS} FPS)`);
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('[SplashCursor] Performance monitoring stopped');
  }

  // Frame recording
  public recordFrame(timestamp?: number): void {
    if (!this.isMonitoring) return;

    const currentTime = timestamp || getHighResolutionTime();
    
    // Always increment frame count
    this.frameCount++;
    
    // Only calculate FPS if we have a previous frame time
    if (this.lastFrameTime > 0) {
      const deltaTime = currentTime - this.lastFrameTime;
      
      if (deltaTime > 0) {
        const fps = 1000 / deltaTime;
        
        // Update frame tracking
        this.frameTimeHistory.push(deltaTime);
        this.fpsHistory.push(fps);
        
        // Maintain history size
        if (this.frameTimeHistory.length > this.maxHistoryLength) {
          this.frameTimeHistory.shift();
          this.fpsHistory.shift();
        }
        
        // Check for dropped frames
        if (fps < this.minAcceptableFPS) {
          this.droppedFrames++;
        }
        
        // Periodic performance check
        if (currentTime - this.lastPerformanceCheck >= this.performanceCheckInterval) {
          this.checkPerformance();
          this.lastPerformanceCheck = currentTime;
        }
      }
    }
    
    this.lastFrameTime = currentTime;
  }

  // Timing measurements
  public startRenderTiming(): void {
    this.lastRenderStart = getHighResolutionTime();
  }

  public endRenderTiming(): void {
    if (this.lastRenderStart > 0) {
      const renderTime = getHighResolutionTime() - this.lastRenderStart;
      this.renderTimeHistory.push(renderTime);
      
      if (this.renderTimeHistory.length > this.maxHistoryLength) {
        this.renderTimeHistory.shift();
      }
      
      this.lastRenderStart = 0;
    }
  }

  public startUpdateTiming(): void {
    this.lastUpdateStart = getHighResolutionTime();
  }

  public endUpdateTiming(): void {
    if (this.lastUpdateStart > 0) {
      const updateTime = getHighResolutionTime() - this.lastUpdateStart;
      this.updateTimeHistory.push(updateTime);
      
      if (this.updateTimeHistory.length > this.maxHistoryLength) {
        this.updateTimeHistory.shift();
      }
      
      this.lastUpdateStart = 0;
    }
  }

  // Performance analysis
  private checkPerformance(): void {
    const metrics = this.getMetrics();
    
    // Call performance callbacks
    this.performanceCallbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        errorHandler.reportError(error as Error, 'performance-callback');
      }
    });
    
    // Adaptive quality adjustment
    if (this.adaptiveQualityEnabled) {
      this.adjustQualityIfNeeded(metrics);
    }
    
    // Report performance issues
    if (metrics.averageFps < this.minAcceptableFPS) {
      errorHandler.reportPerformanceIssue(metrics.averageFps, metrics.particleCount);
    }
  }

  private adjustQualityIfNeeded(metrics: SplashCursorPerformanceMetrics): void {
    const currentSettings = this.qualitySettings[this.currentQuality];
    
    // Reduce quality if performance is poor
    if (metrics.averageFps < currentSettings.targetFPS * 0.8) {
      const newQuality = this.getNextLowerQuality();
      if (newQuality !== this.currentQuality) {
        this.setQuality(newQuality);
        console.log(`[SplashCursor] Quality reduced to ${newQuality} due to low FPS (${metrics.averageFps.toFixed(1)})`);
      }
    }
    // Increase quality if performance is good and stable
    else if (metrics.averageFps > currentSettings.targetFPS * 1.1 && metrics.minFps > currentSettings.targetFPS * 0.9) {
      const newQuality = this.getNextHigherQuality();
      if (newQuality !== this.currentQuality) {
        this.setQuality(newQuality);
        console.log(`[SplashCursor] Quality increased to ${newQuality} due to good performance (${metrics.averageFps.toFixed(1)} FPS)`);
      }
    }
  }

  // Quality management
  public setQuality(quality: QualityLevel): void {
    if (this.currentQuality !== quality) {
      this.currentQuality = quality;
      const settings = this.qualitySettings[quality];
      
      // Notify callbacks
      this.qualityChangeCallbacks.forEach(callback => {
        try {
          callback(quality, settings);
        } catch (error) {
          errorHandler.reportError(error as Error, 'quality-change-callback');
        }
      });
    }
  }

  public getCurrentQuality(): QualityLevel {
    return this.currentQuality;
  }

  public getQualitySettings(quality?: QualityLevel): QualitySettings {
    return this.qualitySettings[quality || this.currentQuality];
  }

  public setAdaptiveQuality(enabled: boolean): void {
    this.adaptiveQualityEnabled = enabled;
  }

  private getNextLowerQuality(): QualityLevel {
    const qualities: QualityLevel[] = ['high', 'medium', 'low', 'minimal'];
    const currentIndex = qualities.indexOf(this.currentQuality);
    return currentIndex < qualities.length - 1 ? qualities[currentIndex + 1] : this.currentQuality;
  }

  private getNextHigherQuality(): QualityLevel {
    const qualities: QualityLevel[] = ['high', 'medium', 'low', 'minimal'];
    const currentIndex = qualities.indexOf(this.currentQuality);
    return currentIndex > 0 ? qualities[currentIndex - 1] : this.currentQuality;
  }

  // Metrics calculation
  public getMetrics(): SplashCursorPerformanceMetrics {
    const currentFps = this.fpsHistory.length > 0 ? this.fpsHistory[this.fpsHistory.length - 1] : 0;
    const averageFps = this.fpsHistory.length > 0 ? 
      this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length : 0;
    const minFps = this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory) : 0;
    const maxFps = this.fpsHistory.length > 0 ? Math.max(...this.fpsHistory) : 0;
    
    const currentFrameTime = this.frameTimeHistory.length > 0 ? 
      this.frameTimeHistory[this.frameTimeHistory.length - 1] : 0;
    
    const averageRenderTime = this.renderTimeHistory.length > 0 ?
      this.renderTimeHistory.reduce((sum, time) => sum + time, 0) / this.renderTimeHistory.length : 0;
    
    const averageUpdateTime = this.updateTimeHistory.length > 0 ?
      this.updateTimeHistory.reduce((sum, time) => sum + time, 0) / this.updateTimeHistory.length : 0;

    return {
      fps: currentFps,
      frameTime: currentFrameTime,
      averageFps,
      minFps,
      maxFps,
      frameCount: this.frameCount,
      droppedFrames: this.droppedFrames,
      particleCount: this.qualitySettings[this.currentQuality].particleCount,
      renderTime: averageRenderTime,
      updateTime: averageUpdateTime
    };
  }

  // Callback registration
  public onQualityChange(callback: (quality: QualityLevel, settings: QualitySettings) => void): () => void {
    this.qualityChangeCallbacks.push(callback);
    
    return () => {
      const index = this.qualityChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.qualityChangeCallbacks.splice(index, 1);
      }
    };
  }

  public onPerformanceUpdate(callback: (metrics: SplashCursorPerformanceMetrics) => void): () => void {
    this.performanceCallbacks.push(callback);
    
    return () => {
      const index = this.performanceCallbacks.indexOf(callback);
      if (index > -1) {
        this.performanceCallbacks.splice(index, 1);
      }
    };
  }

  // Reset and cleanup
  public resetMetrics(): void {
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.frameTimeHistory.length = 0;
    this.fpsHistory.length = 0;
    this.renderTimeHistory.length = 0;
    this.updateTimeHistory.length = 0;
    this.lastFrameTime = getHighResolutionTime();
    this.lastPerformanceCheck = this.lastFrameTime;
  }

  public cleanup(): void {
    this.stopMonitoring();
    this.resetMetrics();
    this.qualityChangeCallbacks.length = 0;
    this.performanceCallbacks.length = 0;
  }
}

// Singleton instance export
export const performanceMonitor = PerformanceMonitor.getInstance();
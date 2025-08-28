/**
 * Error recovery system for splash cursor rendering
 */

import { IRenderer, RenderingMode, RendererFactory, FallbackRendererConfig } from './fallback-renderer';
import { BrowserCompatibility } from './browser-compatibility';

export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  enableAutoFallback: boolean;
  onModeChange?: (oldMode: RenderingMode, newMode: RenderingMode) => void;
  onError?: (error: Error, context: string) => void;
  onRecovery?: (mode: RenderingMode) => void;
}

export interface RecoveryState {
  currentMode: RenderingMode;
  errorCount: number;
  lastError: Error | null;
  fallbackHistory: RenderingMode[];
  isRecovering: boolean;
}

/**
 * Manages error recovery and fallback switching for splash cursor rendering
 */
export class ErrorRecovery {
  private config: ErrorRecoveryConfig;
  private state: RecoveryState;
  private canvas: HTMLCanvasElement;
  private rendererConfig: FallbackRendererConfig;
  private currentRenderer: IRenderer | null = null;
  private retryTimeout: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    rendererConfig: FallbackRendererConfig,
    config: Partial<ErrorRecoveryConfig> = {}
  ) {
    this.canvas = canvas;
    this.rendererConfig = rendererConfig;
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      enableAutoFallback: true,
      ...config,
    };

    // Initialize with best available mode
    const capabilities = BrowserCompatibility.getCapabilities();
    const initialMode = RendererFactory.selectBestMode(capabilities);

    this.state = {
      currentMode: initialMode,
      errorCount: 0,
      lastError: null,
      fallbackHistory: [],
      isRecovering: false,
    };

    this.initializeRenderer();
  }

  /**
   * Get current renderer with error handling
   */
  getRenderer(): IRenderer | null {
    return this.currentRenderer;
  }

  /**
   * Get current recovery state
   */
  getState(): RecoveryState {
    return { ...this.state };
  }

  /**
   * Execute a rendering operation with error recovery
   */
  async executeWithRecovery<T>(
    operation: (renderer: IRenderer) => T,
    context: string = 'render'
  ): Promise<T | null> {
    if (!this.currentRenderer) {
      this.handleError(new Error('No renderer available'), context);
      return null;
    }

    try {
      const result = operation(this.currentRenderer);
      
      // Reset error count on successful operation
      if (this.state.errorCount > 0) {
        this.state.errorCount = 0;
        this.state.isRecovering = false;
        
        if (this.config.onRecovery) {
          this.config.onRecovery(this.state.currentMode);
        }
      }
      
      return result;
    } catch (error) {
      this.handleError(error as Error, context);
      return null;
    }
  }

  /**
   * Force fallback to a specific mode
   */
  async fallbackToMode(mode: RenderingMode): Promise<boolean> {
    if (mode === this.state.currentMode) {
      return true;
    }

    const oldMode = this.state.currentMode;
    
    try {
      this.state.fallbackHistory.push(oldMode);
      this.state.currentMode = mode;
      
      await this.initializeRenderer();
      
      if (this.config.onModeChange) {
        this.config.onModeChange(oldMode, mode);
      }
      
      return true;
    } catch (error) {
      // Restore previous mode if fallback fails
      this.state.currentMode = oldMode;
      this.state.fallbackHistory.pop();
      
      this.handleError(error as Error, 'fallback');
      return false;
    }
  }

  /**
   * Attempt to recover to a better mode
   */
  async attemptUpgrade(): Promise<boolean> {
    const capabilities = BrowserCompatibility.getCapabilities();
    const bestMode = RendererFactory.selectBestMode(capabilities);
    
    // Check if we can upgrade
    const modeHierarchy: RenderingMode[] = ['disabled', 'basic', 'simple', 'metaball'];
    const currentIndex = modeHierarchy.indexOf(this.state.currentMode);
    const bestIndex = modeHierarchy.indexOf(bestMode);
    
    if (bestIndex > currentIndex) {
      return await this.fallbackToMode(bestMode);
    }
    
    return false;
  }

  /**
   * Reset error recovery state
   */
  reset(): void {
    this.state.errorCount = 0;
    this.state.lastError = null;
    this.state.isRecovering = false;
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.reset();
    this.currentRenderer = null;
  }

  /**
   * Handle rendering errors and attempt recovery
   */
  private handleError(error: Error, context: string): void {
    this.state.lastError = error;
    this.state.errorCount++;
    
    if (this.config.onError) {
      this.config.onError(error, context);
    }

    // Log error for debugging
    console.warn(`Splash cursor error in ${context}:`, error);

    if (this.config.enableAutoFallback && this.state.errorCount >= this.config.maxRetries) {
      this.attemptFallback();
    } else if (this.state.errorCount < this.config.maxRetries) {
      this.scheduleRetry();
    }
  }

  /**
   * Attempt to fallback to a simpler rendering mode
   */
  private async attemptFallback(): Promise<void> {
    const fallbackSequence: RenderingMode[] = ['simple', 'basic', 'disabled'];
    const currentModeIndex = fallbackSequence.indexOf(this.state.currentMode);
    
    // Try next simpler mode
    for (let i = currentModeIndex + 1; i < fallbackSequence.length; i++) {
      const fallbackMode = fallbackSequence[i];
      
      try {
        const success = await this.fallbackToMode(fallbackMode);
        if (success) {
          console.log(`Fallback successful: ${this.state.currentMode} -> ${fallbackMode}`);
          this.state.errorCount = 0;
          this.state.isRecovering = false;
          return;
        }
      } catch (error) {
        console.warn(`Fallback to ${fallbackMode} failed:`, error);
      }
    }

    // If all fallbacks fail, disable rendering
    console.error('All fallback modes failed, disabling splash cursor');
    this.state.currentMode = 'disabled';
    this.currentRenderer = new (RendererFactory as any).DisabledRenderer();
  }

  /**
   * Schedule a retry after delay
   */
  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.state.isRecovering = true;
    
    this.retryTimeout = window.setTimeout(() => {
      this.retryTimeout = null;
      this.initializeRenderer();
    }, this.config.retryDelay);
  }

  /**
   * Initialize renderer for current mode
   */
  private async initializeRenderer(): Promise<void> {
    try {
      this.currentRenderer = RendererFactory.createRenderer(
        this.canvas,
        this.state.currentMode,
        this.rendererConfig
      );
      
      // Test the renderer with a simple operation
      this.currentRenderer.clear();
      
    } catch (error) {
      this.currentRenderer = null;
      throw error;
    }
  }
}

/**
 * Utility class for managing multiple error recovery instances
 */
export class ErrorRecoveryManager {
  private static instances = new Map<string, ErrorRecovery>();

  static register(id: string, recovery: ErrorRecovery): void {
    this.instances.set(id, recovery);
  }

  static unregister(id: string): void {
    const recovery = this.instances.get(id);
    if (recovery) {
      recovery.cleanup();
      this.instances.delete(id);
    }
  }

  static get(id: string): ErrorRecovery | undefined {
    return this.instances.get(id);
  }

  static getAll(): ErrorRecovery[] {
    return Array.from(this.instances.values());
  }

  static cleanup(): void {
    for (const recovery of this.instances.values()) {
      recovery.cleanup();
    }
    this.instances.clear();
  }

  /**
   * Get global error statistics
   */
  static getGlobalStats(): {
    totalInstances: number;
    errorCount: number;
    recoveringCount: number;
    modeDistribution: Record<RenderingMode, number>;
  } {
    const stats = {
      totalInstances: this.instances.size,
      errorCount: 0,
      recoveringCount: 0,
      modeDistribution: {
        metaball: 0,
        simple: 0,
        basic: 0,
        disabled: 0,
      } as Record<RenderingMode, number>,
    };

    for (const recovery of this.instances.values()) {
      const state = recovery.getState();
      stats.errorCount += state.errorCount;
      
      if (state.isRecovering) {
        stats.recoveringCount++;
      }
      
      stats.modeDistribution[state.currentMode]++;
    }

    return stats;
  }
}
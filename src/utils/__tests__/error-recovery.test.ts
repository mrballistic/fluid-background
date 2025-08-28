/**
 * Tests for error recovery system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorRecovery, ErrorRecoveryManager } from '../error-recovery';
import { IRenderer, RenderingMode, FallbackRendererConfig } from '../fallback-renderer';
import { BrowserCompatibility } from '../browser-compatibility';

// Mock BrowserCompatibility
vi.mock('../browser-compatibility');
const mockBrowserCompatibility = BrowserCompatibility as any;

// Mock canvas
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: vi.fn(),
} as unknown as HTMLCanvasElement;

// Mock renderer
const mockRenderer: IRenderer = {
  render: vi.fn(),
  clear: vi.fn(),
  resize: vi.fn(),
  setConfig: vi.fn(),
  getMode: vi.fn().mockReturnValue('metaball'),
};

const defaultRendererConfig: FallbackRendererConfig = {
  mode: 'metaball',
  particleCount: 100,
  enableBlur: true,
  enableCompositing: true,
  enableTransforms: true,
  pixelSkip: 1,
  simplificationLevel: 1,
};

describe('ErrorRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock BrowserCompatibility to return high-end capabilities
    mockBrowserCompatibility.getCapabilities.mockReturnValue({
      canvas2d: true,
      imageData: true,
      compositeOperations: true,
      transforms: true,
    });
    
    // Clear any existing timers
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    ErrorRecoveryManager.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with best available mode', () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      const state = recovery.getState();
      
      expect(state.currentMode).toBe('metaball');
      expect(state.errorCount).toBe(0);
      expect(state.isRecovering).toBe(false);
    });

    it('should initialize with custom config', () => {
      const config = {
        maxRetries: 5,
        retryDelay: 2000,
        enableAutoFallback: false,
      };
      
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig, config);
      expect(recovery).toBeDefined();
    });

    it('should handle initialization errors', () => {
      // Mock capabilities that would cause initialization to fail
      mockBrowserCompatibility.getCapabilities.mockReturnValue({
        canvas2d: false,
        imageData: false,
        compositeOperations: false,
        transforms: false,
      });
      
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      const state = recovery.getState();
      
      expect(state.currentMode).toBe('disabled');
    });
  });

  describe('Error Handling', () => {
    it('should handle single error without fallback', async () => {
      const onError = vi.fn();
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig, {
        maxRetries: 3,
        onError,
      });

      const result = await recovery.executeWithRecovery(() => {
        throw new Error('Test error');
      }, 'test');

      expect(result).toBeNull();
      expect(onError).toHaveBeenCalledWith(expect.any(Error), 'test');
      
      const state = recovery.getState();
      expect(state.errorCount).toBe(1);
      expect(state.lastError?.message).toBe('Test error');
    });

    it('should retry after errors', async () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig, {
        maxRetries: 3,
        retryDelay: 100,
      });

      // First call fails
      await recovery.executeWithRecovery(() => {
        throw new Error('Test error');
      });

      expect(recovery.getState().isRecovering).toBe(true);

      // Advance timer to trigger retry
      vi.advanceTimersByTime(100);

      expect(recovery.getState().isRecovering).toBe(false);
    });

    it('should fallback after max retries', async () => {
      const onModeChange = vi.fn();
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig, {
        maxRetries: 2,
        enableAutoFallback: true,
        onModeChange,
      });

      // Trigger multiple errors to exceed max retries
      await recovery.executeWithRecovery(() => {
        throw new Error('Test error 1');
      });
      await recovery.executeWithRecovery(() => {
        throw new Error('Test error 2');
      });

      const state = recovery.getState();
      expect(state.errorCount).toBe(2);
      
      // Should have attempted fallback
      expect(state.fallbackHistory.length).toBeGreaterThan(0);
    });

    it('should reset error count on successful operation', async () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);

      // First operation fails
      await recovery.executeWithRecovery(() => {
        throw new Error('Test error');
      });

      expect(recovery.getState().errorCount).toBe(1);

      // Second operation succeeds
      const result = await recovery.executeWithRecovery(() => {
        return 'success';
      });

      expect(result).toBe('success');
      expect(recovery.getState().errorCount).toBe(0);
    });
  });

  describe('Fallback Management', () => {
    it('should fallback to specific mode', async () => {
      const onModeChange = vi.fn();
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig, {
        onModeChange,
      });

      const success = await recovery.fallbackToMode('simple');
      
      expect(success).toBe(true);
      expect(recovery.getState().currentMode).toBe('simple');
      expect(onModeChange).toHaveBeenCalledWith('metaball', 'simple');
    });

    it('should not fallback to same mode', async () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      const success = await recovery.fallbackToMode('metaball');
      
      expect(success).toBe(true);
      expect(recovery.getState().fallbackHistory).toHaveLength(0);
    });

    it('should track fallback history', async () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      await recovery.fallbackToMode('simple');
      await recovery.fallbackToMode('basic');
      
      const state = recovery.getState();
      expect(state.fallbackHistory).toEqual(['metaball', 'simple']);
      expect(state.currentMode).toBe('basic');
    });

    it('should attempt upgrade to better mode', async () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      // First fallback to basic mode
      await recovery.fallbackToMode('basic');
      expect(recovery.getState().currentMode).toBe('basic');
      
      // Attempt upgrade (should succeed since capabilities support metaball)
      const upgraded = await recovery.attemptUpgrade();
      
      expect(upgraded).toBe(true);
      expect(recovery.getState().currentMode).toBe('metaball');
    });

    it('should not upgrade if already at best mode', async () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      const upgraded = await recovery.attemptUpgrade();
      
      expect(upgraded).toBe(false);
      expect(recovery.getState().currentMode).toBe('metaball');
    });
  });

  describe('Recovery Callbacks', () => {
    it('should call onRecovery when recovering from errors', async () => {
      const onRecovery = vi.fn();
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig, {
        onRecovery,
      });

      // Cause an error
      await recovery.executeWithRecovery(() => {
        throw new Error('Test error');
      });

      expect(recovery.getState().errorCount).toBe(1);

      // Successful operation should trigger recovery callback
      await recovery.executeWithRecovery(() => {
        return 'success';
      });

      expect(onRecovery).toHaveBeenCalledWith('metaball');
    });

    it('should call onError for each error', async () => {
      const onError = vi.fn();
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig, {
        onError,
      });

      await recovery.executeWithRecovery(() => {
        throw new Error('Error 1');
      }, 'context1');

      await recovery.executeWithRecovery(() => {
        throw new Error('Error 2');
      }, 'context2');

      expect(onError).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenNthCalledWith(1, expect.any(Error), 'context1');
      expect(onError).toHaveBeenNthCalledWith(2, expect.any(Error), 'context2');
    });
  });

  describe('State Management', () => {
    it('should reset state correctly', () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      // Cause some errors
      recovery.executeWithRecovery(() => {
        throw new Error('Test error');
      });

      expect(recovery.getState().errorCount).toBe(1);

      recovery.reset();

      const state = recovery.getState();
      expect(state.errorCount).toBe(0);
      expect(state.lastError).toBeNull();
      expect(state.isRecovering).toBe(false);
    });

    it('should cleanup resources', () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      recovery.cleanup();
      
      expect(recovery.getRenderer()).toBeNull();
    });

    it('should provide current state snapshot', () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      const state1 = recovery.getState();
      const state2 = recovery.getState();
      
      // Should return different objects (snapshots)
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });
});

describe('ErrorRecoveryManager', () => {
  beforeEach(() => {
    ErrorRecoveryManager.cleanup();
    vi.clearAllMocks();
    
    mockBrowserCompatibility.getCapabilities.mockReturnValue({
      canvas2d: true,
      imageData: true,
      compositeOperations: true,
      transforms: true,
    });
  });

  afterEach(() => {
    ErrorRecoveryManager.cleanup();
  });

  describe('Instance Management', () => {
    it('should register and retrieve instances', () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      ErrorRecoveryManager.register('test1', recovery);
      
      const retrieved = ErrorRecoveryManager.get('test1');
      expect(retrieved).toBe(recovery);
    });

    it('should unregister instances', () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      ErrorRecoveryManager.register('test1', recovery);
      expect(ErrorRecoveryManager.get('test1')).toBe(recovery);
      
      ErrorRecoveryManager.unregister('test1');
      expect(ErrorRecoveryManager.get('test1')).toBeUndefined();
    });

    it('should get all instances', () => {
      const recovery1 = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      const recovery2 = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      ErrorRecoveryManager.register('test1', recovery1);
      ErrorRecoveryManager.register('test2', recovery2);
      
      const all = ErrorRecoveryManager.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(recovery1);
      expect(all).toContain(recovery2);
    });

    it('should cleanup all instances', () => {
      const recovery1 = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      const recovery2 = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      ErrorRecoveryManager.register('test1', recovery1);
      ErrorRecoveryManager.register('test2', recovery2);
      
      ErrorRecoveryManager.cleanup();
      
      expect(ErrorRecoveryManager.getAll()).toHaveLength(0);
    });
  });

  describe('Global Statistics', () => {
    it('should provide global statistics', async () => {
      const recovery1 = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      const recovery2 = new ErrorRecovery(mockCanvas, defaultRendererConfig);
      
      ErrorRecoveryManager.register('test1', recovery1);
      ErrorRecoveryManager.register('test2', recovery2);
      
      // Cause some errors
      await recovery1.executeWithRecovery(() => {
        throw new Error('Error 1');
      });
      
      await recovery2.fallbackToMode('simple');
      
      const stats = ErrorRecoveryManager.getGlobalStats();
      
      expect(stats.totalInstances).toBe(2);
      expect(stats.errorCount).toBe(1);
      expect(stats.modeDistribution.metaball).toBe(1);
      expect(stats.modeDistribution.simple).toBe(1);
    });

    it('should track recovering instances', async () => {
      const recovery = new ErrorRecovery(mockCanvas, defaultRendererConfig, {
        retryDelay: 1000,
      });
      
      ErrorRecoveryManager.register('test1', recovery);
      
      // Cause error that triggers recovery
      await recovery.executeWithRecovery(() => {
        throw new Error('Test error');
      });
      
      const stats = ErrorRecoveryManager.getGlobalStats();
      expect(stats.recoveringCount).toBe(1);
    });

    it('should handle empty manager', () => {
      const stats = ErrorRecoveryManager.getGlobalStats();
      
      expect(stats.totalInstances).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.recoveringCount).toBe(0);
      expect(stats.modeDistribution.metaball).toBe(0);
    });
  });
});
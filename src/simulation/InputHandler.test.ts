/**
 * InputHandler unit tests
 * Tests mouse and touch input processing, coordinate conversion, and state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandlerImpl } from './InputHandler';

// Mock HTMLCanvasElement
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = {
    width: 800,
    height: 600,
    getBoundingClientRect: vi.fn(() => ({
      left: 100,
      top: 50,
      width: 400,
      height: 300,
    })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLCanvasElement;

  return canvas;
};

// Mock events
const createMouseEvent = (type: string, clientX: number, clientY: number, button = 0): MouseEvent => {
  return {
    type,
    clientX,
    clientY,
    button,
    preventDefault: vi.fn(),
  } as unknown as MouseEvent;
};

const createTouchEvent = (type: string, touches: Array<{ identifier: number; clientX: number; clientY: number }>): TouchEvent => {
  return {
    type,
    changedTouches: touches,
    preventDefault: vi.fn(),
  } as unknown as TouchEvent;
};

describe('InputHandler', () => {
  let canvas: HTMLCanvasElement;
  let config: { interaction: { enabled: boolean; mouse: boolean; touch: boolean; intensity: number } };
  let inputHandler: InputHandlerImpl;

  beforeEach(() => {
    canvas = createMockCanvas();
    config = {
      interaction: {
        enabled: true,
        mouse: true,
        touch: true,
        intensity: 1.0,
      },
    };

    inputHandler = new InputHandlerImpl(canvas, config);
  });

  describe('initialization', () => {
    it('should setup event listeners when interaction is enabled', () => {
      expect(canvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(canvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(canvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(canvas.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
      expect(canvas.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(canvas.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(canvas.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
      expect(canvas.addEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: false });
      expect(canvas.addEventListener).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });

    it('should not setup event listeners when interaction is disabled', () => {
      const disabledConfig = { interaction: { enabled: false, mouse: true, touch: true, intensity: 1.0 } };
      const mockCanvas = createMockCanvas();
      
      new InputHandlerImpl(mockCanvas, disabledConfig);
      
      expect(mockCanvas.addEventListener).not.toHaveBeenCalled();
    });

    it('should only setup mouse events when touch is disabled', () => {
      const mouseOnlyConfig = { interaction: { enabled: true, mouse: true, touch: false, intensity: 1.0 } };
      const mockCanvas = createMockCanvas();
      
      new InputHandlerImpl(mockCanvas, mouseOnlyConfig);
      
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockCanvas.addEventListener).not.toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
    });
  });

  describe('coordinate conversion', () => {
    it('should convert client coordinates to canvas coordinates correctly', () => {
      // Canvas: 800x600, Rect: 400x300 at (100, 50)
      // Scale: 2x for both axes
      const mouseEvent = createMouseEvent('mousemove', 300, 200); // Client coords
      
      inputHandler.handleMouseMove(mouseEvent);
      const state = inputHandler.getState();
      
      // Expected canvas coords: (300-100)*2 = 400, (200-50)*2 = 300
      // Normalized: 400/800 = 0.5, 1-(300/600) = 0.5
      expect(state.x).toBeCloseTo(0.5);
      expect(state.y).toBeCloseTo(0.5);
    });

    it('should flip Y coordinate for WebGL convention', () => {
      const mouseEvent = createMouseEvent('mousemove', 300, 50); // Top of canvas
      
      inputHandler.handleMouseMove(mouseEvent);
      const state = inputHandler.getState();
      
      // Y should be close to 1.0 (top in WebGL coordinates)
      expect(state.y).toBeCloseTo(1.0);
    });

    it('should handle edge coordinates correctly', () => {
      // Test bottom-left corner
      const bottomLeft = createMouseEvent('mousemove', 100, 350); // Client coords
      inputHandler.handleMouseMove(bottomLeft);
      let state = inputHandler.getState();
      
      expect(state.x).toBeCloseTo(0.0);
      expect(state.y).toBeCloseTo(0.0);
      
      // Test top-right corner
      const topRight = createMouseEvent('mousemove', 500, 50); // Client coords
      inputHandler.handleMouseMove(topRight);
      state = inputHandler.getState();
      
      expect(state.x).toBeCloseTo(1.0);
      expect(state.y).toBeCloseTo(1.0);
    });
  });

  describe('mouse input handling', () => {
    it('should track mouse movement and calculate deltas', () => {
      // First move to establish position
      const firstMove = createMouseEvent('mousemove', 200, 150);
      inputHandler.handleMouseMove(firstMove);
      
      // Second move to calculate delta
      const secondMove = createMouseEvent('mousemove', 250, 200);
      inputHandler.handleMouseMove(secondMove);
      
      const state = inputHandler.getState();
      
      // Should have non-zero deltas
      expect(Math.abs(state.dx)).toBeGreaterThan(0);
      expect(Math.abs(state.dy)).toBeGreaterThan(0);
    });

    it('should set down state on mouse down', () => {
      const mouseDown = createMouseEvent('mousedown', 300, 200);
      inputHandler.handleMouseDown(mouseDown);
      
      const state = inputHandler.getState();
      expect(state.down).toBe(true);
      expect(mouseDown.preventDefault).toHaveBeenCalled();
    });

    it('should clear down state on mouse up', () => {
      // First mouse down
      const mouseDown = createMouseEvent('mousedown', 300, 200);
      inputHandler.handleMouseDown(mouseDown);
      
      // Then mouse up
      const mouseUp = createMouseEvent('mouseup', 300, 200);
      inputHandler.handleMouseUp(mouseUp);
      
      const state = inputHandler.getState();
      expect(state.down).toBe(false);
      expect(state.dx).toBe(0);
      expect(state.dy).toBe(0);
    });

    it('should not process mouse events when mouse interaction is disabled', () => {
      const mouseDisabledConfig = { interaction: { enabled: true, mouse: false, touch: true, intensity: 1.0 } };
      const mouseDisabledHandler = new InputHandlerImpl(canvas, mouseDisabledConfig);
      
      const mouseMove = createMouseEvent('mousemove', 300, 200);
      mouseDisabledHandler.handleMouseMove(mouseMove);
      
      const state = mouseDisabledHandler.getState();
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
    });
  });

  describe('touch input handling', () => {
    it('should handle single touch correctly', () => {
      const touchStart = createTouchEvent('touchstart', [{ identifier: 1, clientX: 300, clientY: 200 }]);
      inputHandler.handleTouchStart(touchStart);
      
      const state = inputHandler.getState();
      expect(state.down).toBe(true);
      expect(touchStart.preventDefault).toHaveBeenCalled();
    });

    it('should track touch movement and calculate deltas', () => {
      // Start touch
      const touchStart = createTouchEvent('touchstart', [{ identifier: 1, clientX: 200, clientY: 150 }]);
      inputHandler.handleTouchStart(touchStart);
      
      // Move touch
      const touchMove = createTouchEvent('touchmove', [{ identifier: 1, clientX: 250, clientY: 200 }]);
      inputHandler.handleTouchMove(touchMove);
      
      const state = inputHandler.getState();
      expect(state.down).toBe(true);
      expect(Math.abs(state.dx)).toBeGreaterThan(0);
      expect(Math.abs(state.dy)).toBeGreaterThan(0);
    });

    it('should handle touch end correctly', () => {
      // Start touch
      const touchStart = createTouchEvent('touchstart', [{ identifier: 1, clientX: 300, clientY: 200 }]);
      inputHandler.handleTouchStart(touchStart);
      
      // End touch
      const touchEnd = createTouchEvent('touchend', [{ identifier: 1, clientX: 300, clientY: 200 }]);
      inputHandler.handleTouchEnd(touchEnd);
      
      const state = inputHandler.getState();
      expect(state.down).toBe(false);
      expect(state.dx).toBe(0);
      expect(state.dy).toBe(0);
    });

    it('should handle multi-touch by promoting secondary touch to primary', () => {
      // Start first touch
      const touchStart1 = createTouchEvent('touchstart', [{ identifier: 1, clientX: 200, clientY: 150 }]);
      inputHandler.handleTouchStart(touchStart1);
      
      // Start second touch (should be ignored as primary is active)
      const touchStart2 = createTouchEvent('touchstart', [{ identifier: 2, clientX: 400, clientY: 250 }]);
      inputHandler.handleTouchStart(touchStart2);
      
      // End first touch (should promote second touch to primary)
      const touchEnd1 = createTouchEvent('touchend', [{ identifier: 1, clientX: 200, clientY: 150 }]);
      inputHandler.handleTouchEnd(touchEnd1);
      
      const state = inputHandler.getState();
      // Should still be tracking (second touch promoted to primary)
      expect(state.down).toBe(true);
    });

    it('should ignore touches when touch interaction is disabled', () => {
      const touchDisabledConfig = { interaction: { enabled: true, mouse: true, touch: false, intensity: 1.0 } };
      const touchDisabledHandler = new InputHandlerImpl(canvas, touchDisabledConfig);
      
      const touchStart = createTouchEvent('touchstart', [{ identifier: 1, clientX: 300, clientY: 200 }]);
      touchDisabledHandler.handleTouchStart(touchStart);
      
      const state = touchDisabledHandler.getState();
      expect(state.down).toBe(false);
    });
  });

  describe('intensity scaling', () => {
    it('should scale deltas by intensity factor', () => {
      const highIntensityConfig = { interaction: { enabled: true, mouse: true, touch: true, intensity: 2.0 } };
      const highIntensityHandler = new InputHandlerImpl(canvas, highIntensityConfig);
      
      // First move to establish position
      const firstMove = createMouseEvent('mousemove', 200, 150);
      highIntensityHandler.handleMouseMove(firstMove);
      
      // Second move to calculate delta
      const secondMove = createMouseEvent('mousemove', 250, 200);
      highIntensityHandler.handleMouseMove(secondMove);
      
      const state = highIntensityHandler.getState();
      
      // Deltas should be scaled by intensity (2.0)
      expect(Math.abs(state.dx)).toBeGreaterThan(0);
      expect(Math.abs(state.dy)).toBeGreaterThan(0);
    });
  });

  describe('configuration updates', () => {
    it('should update configuration and re-setup event listeners', () => {
      const newConfig = { interaction: { enabled: false, mouse: true, touch: true, intensity: 0.5 } };
      
      inputHandler.updateConfig(newConfig);
      
      // Should remove event listeners when disabled
      expect(canvas.removeEventListener).toHaveBeenCalled();
    });

    it('should clear state when interaction is disabled', () => {
      // Set some state first
      const mouseDown = createMouseEvent('mousedown', 300, 200);
      inputHandler.handleMouseDown(mouseDown);
      
      // Disable interaction
      const disabledConfig = { interaction: { enabled: false, mouse: true, touch: true, intensity: 1.0 } };
      inputHandler.updateConfig(disabledConfig);
      
      const state = inputHandler.getState();
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.dx).toBe(0);
      expect(state.dy).toBe(0);
      expect(state.down).toBe(false);
    });
  });

  describe('state management', () => {
    it('should return a copy of the current state', () => {
      const state1 = inputHandler.getState();
      const state2 = inputHandler.getState();
      
      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2); // Same values
    });

    it('should reset state correctly', () => {
      // Set some state
      const mouseDown = createMouseEvent('mousedown', 300, 200);
      inputHandler.handleMouseDown(mouseDown);
      
      inputHandler.reset();
      
      const state = inputHandler.getState();
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.dx).toBe(0);
      expect(state.dy).toBe(0);
      expect(state.down).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove all event listeners and reset state', () => {
      inputHandler.cleanup();
      
      expect(canvas.removeEventListener).toHaveBeenCalled();
      
      const state = inputHandler.getState();
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.dx).toBe(0);
      expect(state.dy).toBe(0);
      expect(state.down).toBe(false);
    });
  });
});
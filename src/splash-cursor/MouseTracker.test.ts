/**
 * Unit tests for MouseTracker class
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MouseTracker, MouseTrackerConfig } from './MouseTracker';

// Mock HTMLCanvasElement
class MockCanvas {
  width = 800;
  height = 600;
  
  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      width: this.width,
      height: this.height,
      right: this.width,
      bottom: this.height,
      x: 0,
      y: 0
    };
  }
}

describe('MouseTracker', () => {
  let mouseTracker: MouseTracker;
  let mockCanvas: MockCanvas;
  let defaultConfig: MouseTrackerConfig;

  beforeEach(() => {
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    
    defaultConfig = {
      velocitySmoothing: 0.8,
      maxVelocity: 1000,
      touchSupport: true,
      preventDefault: false
    };
    
    mouseTracker = new MouseTracker(defaultConfig);
    mockCanvas = new MockCanvas();
    
    // Mock document.addEventListener and removeEventListener
    vi.spyOn(document, 'addEventListener');
    vi.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    mouseTracker.stopTracking();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const tracker = new MouseTracker();
      const state = tracker.getMouseState();
      
      expect(state.position.x).toBe(0);
      expect(state.position.y).toBe(0);
      expect(state.velocity.x).toBe(0);
      expect(state.velocity.y).toBe(0);
      expect(state.isDown).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: MouseTrackerConfig = {
        velocitySmoothing: 0.5,
        maxVelocity: 500,
        touchSupport: false,
        preventDefault: true
      };
      
      const tracker = new MouseTracker(customConfig);
      expect(() => tracker.updateConfig(customConfig)).not.toThrow();
    });
  });

  describe('tracking lifecycle', () => {
    it('should start tracking and add event listeners', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));
      expect(document.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.any(Object));
      expect(document.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object));
    });

    it('should stop tracking and remove event listeners', () => {
      mouseTracker.startTracking(mockCanvas as any);
      mouseTracker.stopTracking();
      
      expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    });

    it('should handle multiple start/stop calls gracefully', () => {
      mouseTracker.startTracking(mockCanvas as any);
      mouseTracker.startTracking(mockCanvas as any); // Should stop previous tracking
      mouseTracker.stopTracking();
      mouseTracker.stopTracking(); // Should not throw
      
      expect(() => mouseTracker.stopTracking()).not.toThrow();
    });
  });

  describe('mouse position tracking', () => {
    beforeEach(() => {
      mouseTracker.startTracking(mockCanvas as any);
    });

    it('should track mouse position correctly', () => {
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200
      });
      
      // Simulate mouse move
      document.dispatchEvent(mouseEvent);
      
      const state = mouseTracker.getMouseState();
      expect(state.position.x).toBe(100);
      expect(state.position.y).toBe(200);
    });

    it('should calculate normalized position correctly', () => {
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 400, // Half of canvas width (800)
        clientY: 300  // Half of canvas height (600)
      });
      
      document.dispatchEvent(mouseEvent);
      
      const normalized = mouseTracker.getNormalizedPosition();
      expect(normalized.x).toBe(0.5);
      expect(normalized.y).toBe(0.5);
    });

    it('should track mouse down/up state', () => {
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100
      });
      
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 100,
        clientY: 100
      });
      
      // Initially not down
      expect(mouseTracker.getMouseState().isDown).toBe(false);
      
      // Mouse down
      document.dispatchEvent(mouseDownEvent);
      expect(mouseTracker.getMouseState().isDown).toBe(true);
      
      // Mouse up
      document.dispatchEvent(mouseUpEvent);
      expect(mouseTracker.getMouseState().isDown).toBe(false);
    });
  });

  describe('velocity calculation', () => {
    beforeEach(() => {
      mouseTracker.startTracking(mockCanvas as any);
    });

    it('should calculate velocity based on position changes', () => {
      // First position
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const event1 = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(event1);
      
      // Second position after 16ms (60fps)
      vi.spyOn(performance, 'now').mockReturnValue(1016);
      const event2 = new MouseEvent('mousemove', { clientX: 200, clientY: 150 });
      document.dispatchEvent(event2);
      
      const state = mouseTracker.getMouseState();
      expect(state.velocity.x).toBeGreaterThan(0); // Moving right
      expect(state.velocity.y).toBeGreaterThan(0); // Moving down
    });

    it('should return velocity magnitude correctly', () => {
      // Set up known velocity
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const event1 = new MouseEvent('mousemove', { clientX: 0, clientY: 0 });
      document.dispatchEvent(event1);
      
      vi.spyOn(performance, 'now').mockReturnValue(1100); // 100ms later
      const event2 = new MouseEvent('mousemove', { clientX: 300, clientY: 400 }); // 3:4:5 triangle
      document.dispatchEvent(event2);
      
      const magnitude = mouseTracker.getVelocityMagnitude();
      expect(magnitude).toBeGreaterThan(0);
    });

    it('should detect when mouse is moving', () => {
      // Initially not moving
      expect(mouseTracker.isMoving()).toBe(false);
      
      // Create movement
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const event1 = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(event1);
      
      vi.spyOn(performance, 'now').mockReturnValue(1016);
      const event2 = new MouseEvent('mousemove', { clientX: 200, clientY: 200 });
      document.dispatchEvent(event2);
      
      expect(mouseTracker.isMoving()).toBe(true);
    });

    it('should clamp velocity to maximum value', () => {
      const tracker = new MouseTracker({ maxVelocity: 100 });
      tracker.startTracking(mockCanvas as any);
      
      // Create very fast movement
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const event1 = new MouseEvent('mousemove', { clientX: 0, clientY: 0 });
      document.dispatchEvent(event1);
      
      vi.spyOn(performance, 'now').mockReturnValue(1001); // 1ms later
      const event2 = new MouseEvent('mousemove', { clientX: 1000, clientY: 1000 });
      document.dispatchEvent(event2);
      
      const magnitude = tracker.getVelocityMagnitude();
      expect(magnitude).toBeLessThanOrEqual(100);
      
      tracker.stopTracking();
    });
  });

  describe('touch support', () => {
    beforeEach(() => {
      mouseTracker.startTracking(mockCanvas as any);
    });

    it('should handle touch start events', () => {
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{
          clientX: 150,
          clientY: 250,
          identifier: 0
        } as Touch]
      });
      
      document.dispatchEvent(touchEvent);
      
      const state = mouseTracker.getMouseState();
      expect(state.position.x).toBe(150);
      expect(state.position.y).toBe(250);
      expect(state.isDown).toBe(true);
    });

    it('should handle touch move events', () => {
      // Start touch
      const touchStart = new TouchEvent('touchstart', {
        touches: [{
          clientX: 100,
          clientY: 100,
          identifier: 0
        } as Touch]
      });
      document.dispatchEvent(touchStart);
      
      // Move touch
      vi.spyOn(performance, 'now').mockReturnValue(1016);
      const touchMove = new TouchEvent('touchmove', {
        touches: [{
          clientX: 200,
          clientY: 200,
          identifier: 0
        } as Touch]
      });
      document.dispatchEvent(touchMove);
      
      const state = mouseTracker.getMouseState();
      expect(state.position.x).toBe(200);
      expect(state.position.y).toBe(200);
      expect(state.velocity.x).toBeGreaterThan(0);
    });

    it('should handle touch end events', () => {
      // Start touch
      const touchStart = new TouchEvent('touchstart', {
        touches: [{
          clientX: 100,
          clientY: 100,
          identifier: 0
        } as Touch]
      });
      document.dispatchEvent(touchStart);
      expect(mouseTracker.getMouseState().isDown).toBe(true);
      
      // End touch
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{
          clientX: 100,
          clientY: 100,
          identifier: 0
        } as Touch]
      });
      document.dispatchEvent(touchEnd);
      expect(mouseTracker.getMouseState().isDown).toBe(false);
    });

    it('should disable touch support when configured', () => {
      // Clear previous mock calls
      (document.addEventListener as any).mockClear();
      
      const tracker = new MouseTracker({ touchSupport: false });
      tracker.startTracking(mockCanvas as any);
      
      // Should not add touch event listeners
      const addEventListenerCalls = (document.addEventListener as any).mock.calls;
      const touchCalls = addEventListenerCalls.filter((call: any) => 
        call[0].startsWith('touch')
      );
      expect(touchCalls.length).toBe(0);
      
      tracker.stopTracking();
    });
  });

  describe('configuration updates', () => {
    it('should update configuration dynamically', () => {
      const newConfig = {
        velocitySmoothing: 0.5,
        maxVelocity: 500
      };
      
      mouseTracker.updateConfig(newConfig);
      
      // Configuration should be updated (we can't directly test private config,
      // but we can test behavior changes)
      expect(() => mouseTracker.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      mouseTracker.startTracking(mockCanvas as any);
    });

    it('should reset state correctly', () => {
      // Set some state
      const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(event);
      
      mouseTracker.reset();
      
      const state = mouseTracker.getMouseState();
      expect(state.position.x).toBe(0);
      expect(state.position.y).toBe(0);
      expect(state.velocity.x).toBe(0);
      expect(state.velocity.y).toBe(0);
      expect(state.isDown).toBe(false);
    });

    it('should provide debug information', () => {
      const debugInfo = mouseTracker.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('position');
      expect(debugInfo).toHaveProperty('velocity');
      expect(debugInfo).toHaveProperty('velocityMagnitude');
      expect(debugInfo).toHaveProperty('isDown');
      expect(debugInfo).toHaveProperty('isMoving');
      expect(debugInfo).toHaveProperty('historyLength');
    });

    it('should provide smoothed velocity', () => {
      // Create some movement to build velocity history
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const event1 = new MouseEvent('mousemove', { clientX: 0, clientY: 0 });
      document.dispatchEvent(event1);
      
      vi.spyOn(performance, 'now').mockReturnValue(1016);
      const event2 = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(event2);
      
      const smoothedVelocity = mouseTracker.getSmoothedVelocity();
      expect(smoothedVelocity).toHaveProperty('x');
      expect(smoothedVelocity).toHaveProperty('y');
    });
  });

  describe('edge cases', () => {
    it('should handle events without canvas', () => {
      // Don't start tracking
      const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      
      expect(() => {
        document.dispatchEvent(event);
      }).not.toThrow();
      
      const normalized = mouseTracker.getNormalizedPosition();
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });

    it('should handle zero delta time', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      // Same timestamp for both events
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      const event1 = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      document.dispatchEvent(event1);
      
      const event2 = new MouseEvent('mousemove', { clientX: 200, clientY: 200 });
      document.dispatchEvent(event2);
      
      expect(() => {
        mouseTracker.getMouseState();
      }).not.toThrow();
    });

    it('should handle touch events with no touches', () => {
      mouseTracker.startTracking(mockCanvas as any);
      
      const touchEvent = new TouchEvent('touchstart', {
        touches: []
      });
      
      expect(() => {
        document.dispatchEvent(touchEvent);
      }).not.toThrow();
    });
  });
});
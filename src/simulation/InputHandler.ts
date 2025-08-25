/**
 * InputHandler - Processes mouse and touch input for fluid simulation
 * Handles coordinate conversion, pointer tracking, and delta calculation
 */

import { InputHandler as IInputHandler, InputState } from '../types';

export class InputHandlerImpl implements IInputHandler {
  private state: InputState = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    down: false
  };

  private lastX: number = 0;
  private lastY: number = 0;
  private isTracking: boolean = false;

  // Touch tracking for multi-touch support
  private activeTouches: Map<number, { x: number; y: number }> = new Map();
  private primaryTouchId: number | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private config: { interaction: { enabled: boolean; mouse: boolean; touch: boolean; intensity: number } }
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.config.interaction.enabled) {
      return;
    }

    // Mouse events
    if (this.config.interaction.mouse) {
      this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }

    // Touch events
    if (this.config.interaction.touch) {
      this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
      this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
    }

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private removeEventListeners(): void {
    // Mouse events
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp.bind(this));

    // Touch events
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));

    this.canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
  }

  private getCanvasCoordinates(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  private getNormalizedCoordinates(x: number, y: number): { x: number; y: number } {
    return {
      x: x / this.canvas.width,
      y: 1.0 - (y / this.canvas.height) // Flip Y coordinate for WebGL
    };
  }

  private updateState(x: number, y: number, down: boolean): void {
    const normalized = this.getNormalizedCoordinates(x, y);

    // Calculate delta from last position
    let dx = 0;
    let dy = 0;

    if (this.isTracking && (this.lastX !== 0 || this.lastY !== 0)) {
      const lastNormalized = this.getNormalizedCoordinates(this.lastX, this.lastY);
      dx = (normalized.x - lastNormalized.x) * this.config.interaction.intensity;
      dy = (normalized.y - lastNormalized.y) * this.config.interaction.intensity;
    }

    this.state = {
      x: normalized.x,
      y: normalized.y,
      dx,
      dy,
      down
    };

    this.lastX = x;
    this.lastY = y;
  }

  handleMouseMove(event: MouseEvent): void {
    if (!this.config.interaction.enabled || !this.config.interaction.mouse) {
      return;
    }

    const coords = this.getCanvasCoordinates(event.clientX, event.clientY);

    // Start tracking on first move if not already tracking
    if (!this.isTracking && (this.lastX === 0 && this.lastY === 0)) {
      this.isTracking = true;
      this.lastX = coords.x;
      this.lastY = coords.y;
    }

    this.updateState(coords.x, coords.y, this.state.down);
  }

  handleMouseDown(event: MouseEvent): void {
    if (!this.config.interaction.enabled || !this.config.interaction.mouse) {
      return;
    }

    event.preventDefault();

    const coords = this.getCanvasCoordinates(event.clientX, event.clientY);
    this.isTracking = true;
    this.updateState(coords.x, coords.y, true);
  }

  handleMouseUp(event: MouseEvent): void {
    if (!this.config.interaction.enabled || !this.config.interaction.mouse) {
      return;
    }

    const coords = this.getCanvasCoordinates(event.clientX, event.clientY);
    this.updateState(coords.x, coords.y, false);
    this.isTracking = false;

    // Clear delta when mouse is released
    this.state.dx = 0;
    this.state.dy = 0;
  }

  handleTouchStart(event: TouchEvent): void {
    if (!this.config.interaction.enabled || !this.config.interaction.touch) {
      return;
    }

    event.preventDefault();

    // Handle all new touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });

      // Set first touch as primary if no primary exists
      if (this.primaryTouchId === null) {
        this.primaryTouchId = touch.identifier;
        const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY);
        this.isTracking = true;
        this.updateState(coords.x, coords.y, true);
      }
    }
  }

  handleTouchMove(event: TouchEvent): void {
    if (!this.config.interaction.enabled || !this.config.interaction.touch) {
      return;
    }

    event.preventDefault();

    // Find the primary touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];

      if (touch.identifier === this.primaryTouchId) {
        const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY);
        this.updateState(coords.x, coords.y, true);

        // Update stored touch position
        this.activeTouches.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
        break;
      }
    }
  }

  handleTouchEnd(event: TouchEvent): void {
    if (!this.config.interaction.enabled || !this.config.interaction.touch) {
      return;
    }

    event.preventDefault();

    // Check if the primary touch ended
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];

      if (touch.identifier === this.primaryTouchId) {
        const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY);
        this.updateState(coords.x, coords.y, false);

        // Clear primary touch
        this.primaryTouchId = null;
        this.isTracking = false;
        this.activeTouches.delete(touch.identifier);

        // Clear delta when touch ends
        this.state.dx = 0;
        this.state.dy = 0;

        // If there are other active touches, promote one to primary
        if (this.activeTouches.size > 0) {
          const firstEntry = this.activeTouches.entries().next().value;
          if (firstEntry) {
            const [newPrimaryId, touchPos] = firstEntry;
            this.primaryTouchId = newPrimaryId;

            const newCoords = this.getCanvasCoordinates(touchPos.x, touchPos.y);
            this.isTracking = true;
            this.updateState(newCoords.x, newCoords.y, true);
          }
        }

        break;
      } else {
        // Remove non-primary touches
        this.activeTouches.delete(touch.identifier);
      }
    }
  }

  getState(): InputState {
    return { ...this.state };
  }

  // Update configuration at runtime
  updateConfig(config: { interaction: { enabled: boolean; mouse: boolean; touch: boolean; intensity: number } }): void {
    const wasEnabled = this.config.interaction.enabled;
    this.config = config;

    // Re-setup event listeners if interaction state changed
    if (wasEnabled !== config.interaction.enabled) {
      if (config.interaction.enabled) {
        this.setupEventListeners();
      } else {
        this.removeEventListeners();
        // Clear state when disabled
        this.state = { x: 0, y: 0, dx: 0, dy: 0, down: false };
        this.isTracking = false;
        this.activeTouches.clear();
        this.primaryTouchId = null;
      }
    }
  }

  // Reset input state (useful for cleanup or state reset)
  reset(): void {
    this.state = { x: 0, y: 0, dx: 0, dy: 0, down: false };
    this.lastX = 0;
    this.lastY = 0;
    this.isTracking = false;
    this.activeTouches.clear();
    this.primaryTouchId = null;
  }

  cleanup(): void {
    this.removeEventListeners();
    this.reset();
  }
}
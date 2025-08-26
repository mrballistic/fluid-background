/**
 * MouseTracker class for tracking mouse movement and calculating velocity
 * Handles both mouse and touch events for cross-platform compatibility
 */

import { Vector2, MouseState } from '../types/splash-cursor';

export interface MouseTrackerConfig {
  velocitySmoothing?: number;  // 0-1, how much to smooth velocity calculations
  maxVelocity?: number;        // Maximum velocity magnitude to prevent extreme values
  touchSupport?: boolean;      // Enable touch event handling
  preventDefault?: boolean;    // Prevent default event behavior
}

export class MouseTracker {
  private mouseState: MouseState;
  private config: Required<MouseTrackerConfig>;
  private canvas: HTMLCanvasElement | null = null;
  private isTracking: boolean = false;
  private velocityHistory: Vector2[] = [];
  private readonly maxHistoryLength = 5;
  
  // Event listeners for cleanup
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  constructor(config: MouseTrackerConfig = {}) {
    this.config = {
      velocitySmoothing: config.velocitySmoothing ?? 0.8,
      maxVelocity: config.maxVelocity ?? 1000,
      touchSupport: config.touchSupport ?? true,
      preventDefault: config.preventDefault ?? false
    };

    this.mouseState = {
      position: { x: 0, y: 0 },
      lastPosition: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      isDown: false,
      lastMoveTime: performance.now()
    };

    // Bind event handlers
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
  }

  /**
   * Start tracking mouse movement on the given canvas
   */
  startTracking(canvas: HTMLCanvasElement): void {
    if (this.isTracking) {
      this.stopTracking();
    }

    this.canvas = canvas;
    this.isTracking = true;

    // Add mouse event listeners
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mousedown', this.boundMouseDown);
    document.addEventListener('mouseup', this.boundMouseUp);

    // Add touch event listeners if enabled
    if (this.config.touchSupport) {
      document.addEventListener('touchstart', this.boundTouchStart, { passive: !this.config.preventDefault });
      document.addEventListener('touchmove', this.boundTouchMove, { passive: !this.config.preventDefault });
      document.addEventListener('touchend', this.boundTouchEnd, { passive: !this.config.preventDefault });
    }
  }

  /**
   * Stop tracking mouse movement and clean up event listeners
   */
  stopTracking(): void {
    if (!this.isTracking) return;

    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mousedown', this.boundMouseDown);
    document.removeEventListener('mouseup', this.boundMouseUp);

    if (this.config.touchSupport) {
      document.removeEventListener('touchstart', this.boundTouchStart);
      document.removeEventListener('touchmove', this.boundTouchMove);
      document.removeEventListener('touchend', this.boundTouchEnd);
    }

    this.isTracking = false;
    this.canvas = null;
  }

  /**
   * Get current mouse state
   */
  getMouseState(): Readonly<MouseState> {
    return { ...this.mouseState };
  }

  /**
   * Get normalized mouse position (0-1 range)
   */
  getNormalizedPosition(): Vector2 {
    if (!this.canvas) {
      return { x: 0, y: 0 };
    }

    const rect = this.canvas.getBoundingClientRect();
    return {
      x: this.mouseState.position.x / rect.width,
      y: this.mouseState.position.y / rect.height
    };
  }

  /**
   * Get velocity magnitude
   */
  getVelocityMagnitude(): number {
    const vel = this.mouseState.velocity;
    return Math.sqrt(vel.x * vel.x + vel.y * vel.y);
  }

  /**
   * Check if mouse is moving (has velocity above threshold)
   */
  isMoving(threshold: number = 1): boolean {
    return this.getVelocityMagnitude() > threshold;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MouseTrackerConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(event: MouseEvent): void {
    if (this.config.preventDefault) {
      event.preventDefault();
    }

    const clientPos = this.getCanvasRelativePosition(event.clientX, event.clientY);
    this.updateMousePosition(clientPos.x, clientPos.y);
  }

  /**
   * Handle mouse down events
   */
  private handleMouseDown(event: MouseEvent): void {
    if (this.config.preventDefault) {
      event.preventDefault();
    }

    this.mouseState.isDown = true;
    const clientPos = this.getCanvasRelativePosition(event.clientX, event.clientY);
    this.updateMousePosition(clientPos.x, clientPos.y);
  }

  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    if (this.config.preventDefault) {
      event.preventDefault();
    }

    this.mouseState.isDown = false;
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    if (this.config.preventDefault) {
      event.preventDefault();
    }

    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.mouseState.isDown = true;
      const clientPos = this.getCanvasRelativePosition(touch.clientX, touch.clientY);
      this.updateMousePosition(clientPos.x, clientPos.y);
    }
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(event: TouchEvent): void {
    if (this.config.preventDefault) {
      event.preventDefault();
    }

    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const clientPos = this.getCanvasRelativePosition(touch.clientX, touch.clientY);
      this.updateMousePosition(clientPos.x, clientPos.y);
    }
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (this.config.preventDefault) {
      event.preventDefault();
    }

    this.mouseState.isDown = false;
  }

  /**
   * Get canvas-relative position from client coordinates
   */
  private getCanvasRelativePosition(clientX: number, clientY: number): Vector2 {
    if (!this.canvas) {
      return { x: clientX, y: clientY };
    }

    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  /**
   * Update mouse position and calculate velocity
   */
  private updateMousePosition(x: number, y: number): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.mouseState.lastMoveTime;

    // Update last position
    this.mouseState.lastPosition.x = this.mouseState.position.x;
    this.mouseState.lastPosition.y = this.mouseState.position.y;

    // Update current position
    this.mouseState.position.x = x;
    this.mouseState.position.y = y;

    // Calculate velocity (pixels per second)
    if (deltaTime > 0) {
      const deltaX = x - this.mouseState.lastPosition.x;
      const deltaY = y - this.mouseState.lastPosition.y;
      
      const instantVelocity: Vector2 = {
        x: (deltaX / deltaTime) * 1000, // Convert to pixels per second
        y: (deltaY / deltaTime) * 1000
      };

      // Apply velocity smoothing
      this.mouseState.velocity.x = this.lerp(
        this.mouseState.velocity.x,
        instantVelocity.x,
        1 - this.config.velocitySmoothing
      );
      this.mouseState.velocity.y = this.lerp(
        this.mouseState.velocity.y,
        instantVelocity.y,
        1 - this.config.velocitySmoothing
      );

      // Clamp velocity to max value
      const velocityMagnitude = Math.sqrt(
        this.mouseState.velocity.x * this.mouseState.velocity.x +
        this.mouseState.velocity.y * this.mouseState.velocity.y
      );

      if (velocityMagnitude > this.config.maxVelocity) {
        const scale = this.config.maxVelocity / velocityMagnitude;
        this.mouseState.velocity.x *= scale;
        this.mouseState.velocity.y *= scale;
      }

      // Store velocity in history for additional smoothing if needed
      this.velocityHistory.push({ ...instantVelocity });
      if (this.velocityHistory.length > this.maxHistoryLength) {
        this.velocityHistory.shift();
      }
    }

    this.mouseState.lastMoveTime = currentTime;
  }

  /**
   * Linear interpolation helper
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Get smoothed velocity based on history
   */
  getSmoothedVelocity(): Vector2 {
    if (this.velocityHistory.length === 0) {
      return { ...this.mouseState.velocity };
    }

    let totalX = 0;
    let totalY = 0;
    let totalWeight = 0;

    // Weight recent velocities more heavily
    for (let i = 0; i < this.velocityHistory.length; i++) {
      const weight = (i + 1) / this.velocityHistory.length; // More recent = higher weight
      const velocity = this.velocityHistory[i];
      
      totalX += velocity.x * weight;
      totalY += velocity.y * weight;
      totalWeight += weight;
    }

    return {
      x: totalWeight > 0 ? totalX / totalWeight : 0,
      y: totalWeight > 0 ? totalY / totalWeight : 0
    };
  }

  /**
   * Reset velocity and position
   */
  reset(): void {
    this.mouseState.velocity.x = 0;
    this.mouseState.velocity.y = 0;
    this.mouseState.position.x = 0;
    this.mouseState.position.y = 0;
    this.mouseState.lastPosition.x = 0;
    this.mouseState.lastPosition.y = 0;
    this.mouseState.isDown = false;
    this.mouseState.lastMoveTime = performance.now();
    this.velocityHistory.length = 0;
  }

  /**
   * Get debug information
   */
  getDebugInfo(): {
    position: Vector2;
    velocity: Vector2;
    velocityMagnitude: number;
    isDown: boolean;
    isMoving: boolean;
    historyLength: number;
  } {
    return {
      position: { ...this.mouseState.position },
      velocity: { ...this.mouseState.velocity },
      velocityMagnitude: this.getVelocityMagnitude(),
      isDown: this.mouseState.isDown,
      isMoving: this.isMoving(),
      historyLength: this.velocityHistory.length
    };
  }
}
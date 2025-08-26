# Design Document

## Overview

The splash cursor effect will be implemented as a new component within the existing fluid-react package, leveraging proven infrastructure while creating a focused, high-performance cursor-following effect. The design prioritizes performance and visual fidelity to match the reference implementation at https://www.reactbits.dev/animations/splash-cursor.

## Architecture

### High-Level Architecture

```
fluid-react/
├── src/
│   ├── components/
│   │   ├── FluidBackground/     (existing)
│   │   └── SplashCursor/        (new)
│   ├── hooks/
│   │   ├── useFluidSimulation/  (existing - reuse parts)
│   │   └── useSplashCursor/     (new)
│   ├── simulation/              (existing - reuse utilities)
│   └── utils/                   (existing - reuse)
```

### Component Hierarchy

```
SplashCursor
├── Canvas (full-screen overlay)
├── ParticleSystem (cursor-following particles)
├── MetaballRenderer (fluid connectivity)
└── PhysicsEngine (movement and bouncing)
```

## Components and Interfaces

### 1. SplashCursor Component

**Purpose:** Main React component that provides the splash cursor effect

**Props Interface:**
```typescript
interface SplashCursorProps {
  // Visual configuration
  intensity?: number;           // 0-1, controls trail strength
  colors?: ColorConfig;         // Color scheme configuration
  particleCount?: number;       // Max particles (default: 150)
  
  // Physics configuration
  bounceEnabled?: boolean;      // Enable edge bouncing (default: true)
  gravity?: number;            // Upward drift strength (default: 0.01)
  drag?: number;               // Air resistance (default: 0.997)
  
  // Performance configuration
  targetFPS?: number;          // Target frame rate (default: 60)
  pauseOnHidden?: boolean;     // Pause when tab hidden (default: true)
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  zIndex?: number;             // Canvas z-index (default: 9999)
}

interface ColorConfig {
  mode: 'rainbow' | 'single' | 'gradient' | 'velocity';
  baseHue?: number;            // For single/gradient modes
  saturation?: number;         // Color saturation (0-100)
  lightness?: number;          // Color lightness (0-100)
  cycleSpeed?: number;         // Color cycling speed
}
```

### 2. useSplashCursor Hook

**Purpose:** Core hook that manages the splash cursor effect logic

**Interface:**
```typescript
interface UseSplashCursorReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  particleCount: number;
  fps: number;
  
  // Control methods
  start: () => void;
  stop: () => void;
  reset: () => void;
  updateConfig: (config: Partial<SplashCursorProps>) => void;
}

function useSplashCursor(config: SplashCursorProps): UseSplashCursorReturn;
```

### 3. ParticleSystem Class

**Purpose:** Manages particle lifecycle and physics

```typescript
class ParticleSystem {
  private particles: Particle[];
  private maxParticles: number;
  private emissionRate: number;
  
  constructor(config: ParticleSystemConfig);
  
  // Core methods
  update(deltaTime: number, mousePos: Vector2, mouseVelocity: Vector2): void;
  emit(position: Vector2, velocity: Vector2, intensity: number): void;
  cleanup(): void;
  
  // Getters
  getParticles(): ReadonlyArray<Particle>;
  getActiveCount(): number;
}

interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: HSLColor;
  createdAt: number;
}
```

### 4. MetaballRenderer Class

**Purpose:** Renders particles as connected fluid using metaball technique

```typescript
class MetaballRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  
  constructor(canvas: HTMLCanvasElement);
  
  // Rendering methods
  render(particles: ReadonlyArray<Particle>): void;
  clear(): void;
  resize(width: number, height: number): void;
  
  // Configuration
  setThreshold(threshold: number): void;
  setBlurAmount(blur: number): void;
}
```

### 5. PhysicsEngine Class

**Purpose:** Handles particle physics including edge bouncing

```typescript
class PhysicsEngine {
  private bounds: Rectangle;
  private gravity: Vector2;
  private drag: number;
  
  constructor(config: PhysicsConfig);
  
  // Physics methods
  updateParticle(particle: Particle, deltaTime: number): void;
  handleBoundaryCollision(particle: Particle): boolean;
  applyForces(particle: Particle, deltaTime: number): void;
  
  // Configuration
  setBounds(bounds: Rectangle): void;
  setGravity(gravity: Vector2): void;
  setDrag(drag: number): void;
}
```

## Data Models

### Core Data Structures

```typescript
interface Vector2 {
  x: number;
  y: number;
}

interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
  a: number; // 0-1
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MouseState {
  position: Vector2;
  lastPosition: Vector2;
  velocity: Vector2;
  isDown: boolean;
  lastMoveTime: number;
}
```

### Configuration Models

```typescript
interface SplashCursorConfig {
  // Visual
  intensity: number;
  colors: ColorConfig;
  particleCount: number;
  
  // Physics
  bounceEnabled: boolean;
  gravity: number;
  drag: number;
  
  // Performance
  targetFPS: number;
  pauseOnHidden: boolean;
  
  // Rendering
  metaballThreshold: number;
  blurAmount: number;
  fadeRate: number;
}
```

## Error Handling

### Error Categories

1. **Canvas Initialization Errors**
   - Missing canvas element
   - Canvas context creation failure
   - Canvas size constraints

2. **Performance Errors**
   - Low FPS detection and automatic quality reduction
   - Memory usage monitoring
   - Particle count auto-adjustment

3. **Browser Compatibility Errors**
   - Feature detection for required APIs
   - Graceful degradation for unsupported features
   - Fallback rendering modes

### Error Handling Strategy

```typescript
class ErrorHandler {
  private static instance: ErrorHandler;
  
  // Error reporting
  reportError(error: Error, context: string): void;
  reportPerformanceIssue(fps: number, particleCount: number): void;
  
  // Recovery strategies
  reduceQuality(): void;
  fallbackToSimpleMode(): void;
  disableEffect(): void;
  
  // Monitoring
  startPerformanceMonitoring(): void;
  stopPerformanceMonitoring(): void;
}
```

## Testing Strategy

### Unit Tests

1. **ParticleSystem Tests**
   - Particle creation and lifecycle
   - Emission rate calculations
   - Memory management (particle cleanup)

2. **PhysicsEngine Tests**
   - Boundary collision detection
   - Velocity calculations
   - Force application accuracy

3. **MetaballRenderer Tests**
   - Threshold calculations
   - Color blending accuracy
   - Performance benchmarks

### Integration Tests

1. **Component Integration**
   - SplashCursor component mounting/unmounting
   - Props updates and re-rendering
   - Event listener management

2. **Performance Tests**
   - FPS measurement under load
   - Memory usage over time
   - Particle count scaling

### Visual Tests

1. **Reference Comparison**
   - Side-by-side comparison with reactbits.dev
   - Color accuracy verification
   - Motion smoothness assessment

2. **Cross-Browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile browser testing
   - Performance consistency

## Performance Optimizations

### Rendering Optimizations

1. **Metaball Optimization**
   - Spatial partitioning for particle influence calculations
   - Distance culling to skip far particles
   - Pixel skipping for lower resolution calculation

2. **Canvas Optimizations**
   - ImageData reuse to avoid allocations
   - Dirty rectangle tracking for partial updates
   - Off-screen canvas for complex operations

### Memory Management

1. **Particle Pooling**
   - Pre-allocate particle objects
   - Reuse particles instead of creating new ones
   - Automatic pool size adjustment

2. **Garbage Collection Optimization**
   - Minimize object creation in animation loop
   - Use typed arrays for performance-critical data
   - Batch operations to reduce GC pressure

### Adaptive Quality

1. **Performance Monitoring**
   - Real-time FPS tracking
   - Automatic quality adjustment
   - User-configurable performance targets

2. **Quality Levels**
   - High: Full metaball rendering, 150 particles
   - Medium: Simplified metaballs, 100 particles
   - Low: Simple particle rendering, 50 particles

## Integration with Existing Infrastructure

### Reusing Existing Components

1. **Utility Functions**
   - Color conversion utilities from existing codebase
   - Vector math operations
   - Performance monitoring helpers

2. **Hook Patterns**
   - Follow existing useFluidSimulation patterns
   - Reuse canvas management logic
   - Leverage existing event handling utilities

3. **Build System**
   - Extend existing Rollup configuration
   - Reuse TypeScript setup
   - Maintain existing export patterns

### API Consistency

1. **Component Props**
   - Follow existing naming conventions
   - Use similar configuration patterns
   - Maintain consistent prop validation

2. **Hook Returns**
   - Similar return object structure
   - Consistent method naming
   - Compatible ref patterns

## Browser Compatibility

### Required Features

1. **Canvas 2D Context**
   - ImageData manipulation
   - Composite operations
   - Transform operations

2. **Modern JavaScript**
   - ES6+ features (classes, arrow functions)
   - RequestAnimationFrame
   - Event listeners

### Fallback Strategies

1. **Feature Detection**
   - Check for required Canvas APIs
   - Detect performance capabilities
   - Graceful degradation plan

2. **Polyfills**
   - RequestAnimationFrame polyfill
   - Performance.now() fallback
   - Event listener compatibility

## Security Considerations

### Input Validation

1. **Configuration Validation**
   - Validate numeric ranges for all config values
   - Sanitize color inputs
   - Prevent excessive particle counts

2. **Event Handling**
   - Validate mouse coordinates
   - Rate limit event processing
   - Prevent memory exhaustion

### Resource Management

1. **Memory Limits**
   - Maximum particle count enforcement
   - Canvas size limitations
   - Automatic cleanup on errors

2. **Performance Safeguards**
   - FPS monitoring and automatic quality reduction
   - CPU usage monitoring
   - Emergency stop mechanisms
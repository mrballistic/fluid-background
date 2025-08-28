# SplashCursor Vanilla JavaScript API

The SplashCursor library provides a comprehensive vanilla JavaScript API for non-React applications. This allows you to integrate the splash cursor effect into any web application regardless of the framework used.

## Installation

```bash
npm install fluid-background
```

## Basic Usage

### Quick Start

```javascript
import { createSplashCursor } from 'fluid-background/splash-cursor';

// Create and start the splash cursor with default settings
const splashCursor = createSplashCursor();
splashCursor.start();
```

### Custom Configuration

```javascript
import { createSplashCursor } from 'fluid-background/splash-cursor';

const splashCursor = createSplashCursor({
  intensity: 0.8,
  particleCount: 200,
  colors: {
    mode: 'rainbow',
    saturation: 80,
    lightness: 60
  },
  gravity: 0.01,
  drag: 0.997,
  bounceEnabled: true,
  targetFPS: 60
});

splashCursor.start();
```

### Using Existing Canvas

```javascript
import { SplashCursorVanilla } from 'fluid-background/splash-cursor';

const canvas = document.getElementById('myCanvas');
const splashCursor = new SplashCursorVanilla({
  canvas: canvas,
  intensity: 0.5
});

splashCursor.start();
```

## API Reference

### Factory Function

#### `createSplashCursor(options?)`

Creates a new SplashCursor instance with the specified options.

**Parameters:**
- `options` (optional): Configuration object

**Returns:** `SplashCursorVanillaAPI` instance

### Class Constructor

#### `new SplashCursorVanilla(options?)`

Creates a new SplashCursor instance.

**Parameters:**
- `options` (optional): Configuration object

### Configuration Options

```typescript
interface SplashCursorVanillaOptions {
  // Visual configuration
  intensity?: number;           // 0-1, controls trail strength (default: 0.8)
  colors?: ColorConfig;         // Color scheme configuration
  particleCount?: number;       // Max particles (default: 150)
  
  // Physics configuration
  bounceEnabled?: boolean;      // Enable edge bouncing (default: true)
  gravity?: number;            // Upward drift strength (default: 0.01)
  drag?: number;               // Air resistance (default: 0.997)
  
  // Performance configuration
  targetFPS?: number;          // Target frame rate (default: 60)
  pauseOnHidden?: boolean;     // Pause when tab hidden (default: true)
  
  // Canvas configuration
  container?: HTMLElement | string;  // Container element or selector
  canvas?: HTMLCanvasElement;        // Use existing canvas
  zIndex?: number;                   // Canvas z-index (default: 9999)
}

interface ColorConfig {
  mode: 'rainbow' | 'single' | 'gradient' | 'velocity';
  baseHue?: number;            // For single/gradient modes (0-360)
  saturation?: number;         // Color saturation (0-100)
  lightness?: number;          // Color lightness (0-100)
  cycleSpeed?: number;         // Color cycling speed
}
```

### Control Methods

#### `start()`

Starts the splash cursor animation.

```javascript
splashCursor.start();
```

#### `stop()`

Stops the splash cursor animation.

```javascript
splashCursor.stop();
```

#### `reset()`

Resets the system state, clearing all particles.

```javascript
splashCursor.reset();
```

#### `destroy()`

Completely destroys the splash cursor instance, cleaning up all resources.

```javascript
splashCursor.destroy();
```

### Configuration Methods

#### `updateConfig(config)`

Updates the configuration while the system is running.

```javascript
splashCursor.updateConfig({
  intensity: 0.5,
  particleCount: 100,
  colors: { mode: 'single', baseHue: 200 }
});
```

#### `getConfig()`

Returns the current configuration.

```javascript
const config = splashCursor.getConfig();
console.log('Current intensity:', config.intensity);
```

### State Methods

#### `isActive()`

Returns whether the animation is currently running.

```javascript
if (splashCursor.isActive()) {
  console.log('Animation is running');
}
```

#### `getParticleCount()`

Returns the current number of active particles.

```javascript
const count = splashCursor.getParticleCount();
console.log('Active particles:', count);
```

#### `getFPS()`

Returns the current frames per second.

```javascript
const fps = splashCursor.getFPS();
console.log('Current FPS:', fps);
```

#### `getQuality()`

Returns the current quality level.

```javascript
const quality = splashCursor.getQuality();
console.log('Quality level:', quality); // 'high', 'medium', 'low', or 'minimal'
```

#### `getMetrics()`

Returns detailed performance metrics.

```javascript
const metrics = splashCursor.getMetrics();
if (metrics) {
  console.log('Performance metrics:', {
    fps: metrics.fps,
    frameTime: metrics.frameTime,
    particleCount: metrics.particleCount
  });
}
```

#### `getCanvas()`

Returns the canvas element being used.

```javascript
const canvas = splashCursor.getCanvas();
if (canvas) {
  console.log('Canvas size:', canvas.width, 'x', canvas.height);
}
```

### Event Handling

#### `onPerformanceUpdate(callback)`

Registers a callback for performance updates.

```javascript
const unsubscribe = splashCursor.onPerformanceUpdate((metrics) => {
  console.log('FPS:', metrics.fps);
  console.log('Particles:', metrics.particleCount);
});

// Later, to unsubscribe:
unsubscribe();
```

#### `onQualityChange(callback)`

Registers a callback for quality level changes.

```javascript
const unsubscribe = splashCursor.onQualityChange((quality) => {
  console.log('Quality changed to:', quality);
});

// Later, to unsubscribe:
unsubscribe();
```

#### `onError(callback)`

Registers a callback for error events.

```javascript
const unsubscribe = splashCursor.onError((error, context) => {
  console.error('SplashCursor error in', context, ':', error.message);
});

// Later, to unsubscribe:
unsubscribe();
```

## Examples

### Basic Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>SplashCursor Demo</title>
</head>
<body>
    <h1>My Website</h1>
    <p>Move your mouse to see the effect!</p>
    
    <script type="module">
        import { createSplashCursor } from 'fluid-background/splash-cursor';
        
        const splashCursor = createSplashCursor({
            intensity: 0.7,
            colors: { mode: 'rainbow' }
        });
        
        splashCursor.start();
    </script>
</body>
</html>
```

### Advanced Integration with Controls

```javascript
import { createSplashCursor } from 'fluid-background/splash-cursor';

class SplashCursorController {
  constructor() {
    this.splashCursor = createSplashCursor({
      intensity: 0.8,
      particleCount: 150
    });
    
    this.setupEventListeners();
    this.setupPerformanceMonitoring();
  }
  
  setupEventListeners() {
    // Start/stop controls
    document.getElementById('startBtn').addEventListener('click', () => {
      this.splashCursor.start();
    });
    
    document.getElementById('stopBtn').addEventListener('click', () => {
      this.splashCursor.stop();
    });
    
    // Intensity slider
    document.getElementById('intensitySlider').addEventListener('input', (e) => {
      this.splashCursor.updateConfig({
        intensity: parseFloat(e.target.value)
      });
    });
  }
  
  setupPerformanceMonitoring() {
    this.splashCursor.onPerformanceUpdate((metrics) => {
      document.getElementById('fpsDisplay').textContent = metrics.fps.toFixed(1);
      document.getElementById('particleDisplay').textContent = metrics.particleCount;
    });
    
    this.splashCursor.onQualityChange((quality) => {
      document.getElementById('qualityDisplay').textContent = quality;
    });
    
    this.splashCursor.onError((error, context) => {
      console.error(`SplashCursor error in ${context}:`, error);
    });
  }
  
  start() {
    this.splashCursor.start();
  }
  
  destroy() {
    this.splashCursor.destroy();
  }
}

// Initialize
const controller = new SplashCursorController();
controller.start();
```

### Container-Specific Usage

```javascript
import { createSplashCursor } from 'fluid-background/splash-cursor';

// Create splash cursor in specific container
const splashCursor = createSplashCursor({
  container: '#hero-section',  // CSS selector
  intensity: 0.6,
  colors: { mode: 'single', baseHue: 240 }
});

splashCursor.start();
```

## Browser Compatibility

The vanilla JavaScript API supports all modern browsers:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

For older browsers, the library includes graceful degradation and fallback modes.

## Performance Considerations

- The library automatically adjusts quality based on performance
- Use lower `particleCount` values on mobile devices
- Monitor FPS using `onPerformanceUpdate()` callback
- Consider pausing the effect when the page is not visible

## Error Handling

The library includes comprehensive error handling:

```javascript
splashCursor.onError((error, context) => {
  switch (context) {
    case 'canvas-initialization':
      console.error('Failed to initialize canvas:', error);
      break;
    case 'performance':
      console.warn('Performance issue detected:', error);
      break;
    default:
      console.error('SplashCursor error:', error);
  }
});
```

## TypeScript Support

The vanilla JavaScript API includes full TypeScript definitions:

```typescript
import { 
  SplashCursorVanilla, 
  SplashCursorVanillaOptions,
  SplashCursorVanillaAPI 
} from 'fluid-background/splash-cursor';

const options: SplashCursorVanillaOptions = {
  intensity: 0.8,
  particleCount: 200
};

const splashCursor: SplashCursorVanillaAPI = new SplashCursorVanilla(options);
```
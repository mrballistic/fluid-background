# SplashCursor API Reference

The SplashCursor component creates beautiful, flowing smoke-like trails that follow the user's cursor movement with realistic fluid dynamics and smooth visual blending.

## Table of Contents

- [React Component API](#react-component-api)
- [Vanilla JavaScript API](#vanilla-javascript-api)
- [Configuration Options](#configuration-options)
- [Performance Tuning](#performance-tuning)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)
- [Examples](#examples)

## React Component API

### Basic Usage

```tsx
import { SplashCursor } from 'fluid-react';

function App() {
  return (
    <div>
      <SplashCursor />
      {/* Your app content */}
    </div>
  );
}
```

### Component Props

#### `intensity?: number`

Controls the strength and visibility of the cursor trails.

- **Type:** `number`
- **Range:** `0.0` - `1.0`
- **Default:** `0.8`

```tsx
// Subtle effect
<SplashCursor intensity={0.3} />

// Strong, dramatic effect
<SplashCursor intensity={1.0} />
```

#### `colors?: ColorConfig`

Configure the visual appearance and color scheme of the trails.

```typescript
interface ColorConfig {
  mode: 'rainbow' | 'single' | 'gradient' | 'velocity';
  baseHue?: number;        // 0-360, base color for single/gradient modes
  saturation?: number;     // 0-100, color saturation
  lightness?: number;      // 0-100, color lightness
  cycleSpeed?: number;     // 0.1-5.0, color cycling speed
}
```

**Color Mode Examples:**

```tsx
// Rainbow colors (default)
<SplashCursor colors={{ mode: 'rainbow' }} />

// Single color with custom hue
<SplashCursor 
  colors={{ 
    mode: 'single', 
    baseHue: 240,      // Blue
    saturation: 80,
    lightness: 60 
  }} 
/>

// Velocity-based colors (faster = warmer colors)
<SplashCursor colors={{ mode: 'velocity' }} />

// Custom gradient
<SplashCursor 
  colors={{ 
    mode: 'gradient',
    baseHue: 300,      // Purple to pink gradient
    cycleSpeed: 2.0    // Faster color cycling
  }} 
/>
```

#### `particleCount?: number`

Maximum number of particles in the system.

- **Type:** `number`
- **Range:** `1` - `500`
- **Default:** `150`

```tsx
// Performance-friendly for mobile
<SplashCursor particleCount={75} />

// High-quality for desktop
<SplashCursor particleCount={300} />
```

#### `bounceEnabled?: boolean`

Enable particle bouncing off screen edges.

- **Type:** `boolean`
- **Default:** `true`

```tsx
// Disable bouncing for infinite trails
<SplashCursor bounceEnabled={false} />
```

#### `gravity?: number`

Vertical force applied to particles (positive = downward, negative = upward).

- **Type:** `number`
- **Range:** `-1.0` - `1.0`
- **Default:** `0.01`

```tsx
// Floating upward effect
<SplashCursor gravity={-0.05} />

// Heavy, falling particles
<SplashCursor gravity={0.1} />

// No gravity
<SplashCursor gravity={0} />
```

#### `drag?: number`

Air resistance affecting particle movement (higher = more resistance).

- **Type:** `number`
- **Range:** `0.0` - `1.0`
- **Default:** `0.997`

```tsx
// Low drag, particles travel far
<SplashCursor drag={0.99} />

// High drag, particles slow down quickly
<SplashCursor drag={0.95} />
```

#### `targetFPS?: number`

Target frame rate for the animation.

- **Type:** `number`
- **Range:** `10` - `120`
- **Default:** `60`

```tsx
// Battery-friendly 30fps
<SplashCursor targetFPS={30} />

// Smooth 60fps
<SplashCursor targetFPS={60} />
```

#### `pauseOnHidden?: boolean`

Pause animation when browser tab is hidden.

- **Type:** `boolean`
- **Default:** `true`

```tsx
// Continue animation in background
<SplashCursor pauseOnHidden={false} />
```

#### `className?: string`

CSS class name for the canvas element.

```tsx
<SplashCursor className="my-splash-cursor" />
```

#### `style?: React.CSSProperties`

Inline styles for the canvas element.

```tsx
<SplashCursor 
  style={{ 
    opacity: 0.8,
    filter: 'blur(1px)',
    mixBlendMode: 'screen'
  }} 
/>
```

#### `zIndex?: number`

Z-index for the canvas element.

- **Type:** `number`
- **Default:** `9999`

```tsx
// Lower z-index to appear behind some elements
<SplashCursor zIndex={100} />
```

### Hook API

The `useSplashCursor` hook provides programmatic control over the splash cursor effect.

```tsx
import { useSplashCursor } from 'fluid-react';

function CustomSplashCursor() {
  const { 
    canvasRef, 
    isActive, 
    particleCount, 
    fps,
    start,
    stop,
    reset,
    updateConfig 
  } = useSplashCursor({
    intensity: 0.8,
    particleCount: 150
  });

  return (
    <div>
      <canvas ref={canvasRef} />
      <div>
        Active: {isActive ? 'Yes' : 'No'} | 
        Particles: {particleCount} | 
        FPS: {fps}
      </div>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <button onClick={reset}>Reset</button>
      <button onClick={() => updateConfig({ intensity: 0.5 })}>
        Reduce Intensity
      </button>
    </div>
  );
}
```

#### Hook Return Values

```typescript
interface UseSplashCursorReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  particleCount: number;
  fps: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
  updateConfig: (config: Partial<SplashCursorProps>) => void;
}
```

## Vanilla JavaScript API

For non-React applications, use the vanilla JavaScript API.

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/fluid-react/dist/vanilla.js"></script>
</head>
<body>
  <script>
    const splashCursor = FluidReact.createSplashCursor({
      intensity: 0.8,
      colors: { mode: 'rainbow' }
    });
    
    splashCursor.start();
  </script>
</body>
</html>
```

### ES Module Usage

```javascript
import { createSplashCursor } from 'fluid-react/vanilla';

const splashCursor = createSplashCursor({
  container: '#app',
  intensity: 0.8,
  particleCount: 150
});

splashCursor.start();
```

### Vanilla API Methods

#### `createSplashCursor(options)`

Creates a new SplashCursor instance.

```javascript
const splashCursor = createSplashCursor({
  container: document.body,  // Container element or selector
  canvas: myCanvas,          // Existing canvas (optional)
  intensity: 0.8,
  colors: { mode: 'rainbow' },
  particleCount: 150
});
```

#### Control Methods

```javascript
// Start the animation
splashCursor.start();

// Stop the animation
splashCursor.stop();

// Reset particles and state
splashCursor.reset();

// Clean up and remove from DOM
splashCursor.destroy();
```

#### Configuration

```javascript
// Update configuration
splashCursor.updateConfig({
  intensity: 0.5,
  particleCount: 100
});

// Get current configuration
const config = splashCursor.getConfig();
```

#### State Information

```javascript
// Check if active
const active = splashCursor.isActive();

// Get current particle count
const count = splashCursor.getParticleCount();

// Get current FPS
const fps = splashCursor.getFPS();

// Get performance metrics
const metrics = splashCursor.getMetrics();
```

#### Event Handling

```javascript
// Monitor performance
const unsubscribe = splashCursor.onPerformanceUpdate((metrics) => {
  console.log('FPS:', metrics.fps);
  console.log('Particles:', metrics.particleCount);
});

// Monitor quality changes
splashCursor.onQualityChange((quality) => {
  console.log('Quality changed to:', quality);
});

// Handle errors
splashCursor.onError((error, context) => {
  console.error('SplashCursor error:', error, context);
});

// Clean up event listeners
unsubscribe();
```

## Configuration Options

### Performance Presets

Pre-configured settings for different performance targets:

```tsx
// Mobile-friendly settings
<SplashCursor 
  particleCount={75}
  targetFPS={30}
  intensity={0.6}
/>

// Balanced desktop settings
<SplashCursor 
  particleCount={150}
  targetFPS={60}
  intensity={0.8}
/>

// High-end desktop settings
<SplashCursor 
  particleCount={300}
  targetFPS={60}
  intensity={1.0}
/>
```

### Color Schemes

#### Rainbow Mode (Default)
Cycles through all hue values for vibrant, colorful trails.

```tsx
<SplashCursor colors={{ mode: 'rainbow', cycleSpeed: 1.0 }} />
```

#### Single Color Mode
Uses a single hue with variations in saturation and lightness.

```tsx
<SplashCursor 
  colors={{ 
    mode: 'single',
    baseHue: 240,      // Blue
    saturation: 80,
    lightness: 60
  }} 
/>
```

#### Gradient Mode
Creates a gradient effect around the base hue.

```tsx
<SplashCursor 
  colors={{ 
    mode: 'gradient',
    baseHue: 300,      // Purple base
    cycleSpeed: 1.5
  }} 
/>
```

#### Velocity Mode
Colors change based on cursor movement speed.

```tsx
<SplashCursor colors={{ mode: 'velocity' }} />
```

### Physics Presets

#### Floating Effect
```tsx
<SplashCursor 
  gravity={-0.02}
  drag={0.995}
  bounceEnabled={false}
/>
```

#### Heavy Particles
```tsx
<SplashCursor 
  gravity={0.05}
  drag={0.99}
  bounceEnabled={true}
/>
```

#### Smoke-like
```tsx
<SplashCursor 
  gravity={0.01}
  drag={0.997}
  intensity={0.6}
/>
```

## Performance Tuning

### Automatic Quality Adjustment

SplashCursor automatically adjusts quality based on performance:

- **High Quality:** 150+ particles, full metaball rendering
- **Medium Quality:** ~100 particles, optimized rendering
- **Low Quality:** ~50 particles, simplified rendering
- **Minimal Quality:** ~25 particles, basic rendering

### Manual Performance Optimization

#### For Mobile Devices
```tsx
<SplashCursor 
  particleCount={75}
  targetFPS={30}
  intensity={0.6}
  pauseOnHidden={true}
/>
```

#### For Low-End Devices
```tsx
<SplashCursor 
  particleCount={50}
  targetFPS={24}
  intensity={0.4}
  drag={0.95}  // Particles fade faster
/>
```

#### For High-End Devices
```tsx
<SplashCursor 
  particleCount={300}
  targetFPS={60}
  intensity={1.0}
  colors={{ mode: 'rainbow', cycleSpeed: 2.0 }}
/>
```

### Performance Monitoring

```tsx
import { useSplashCursor } from 'fluid-react';

function PerformanceMonitor() {
  const { fps, particleCount } = useSplashCursor();
  
  return (
    <div style={{ position: 'fixed', top: 10, right: 10 }}>
      FPS: {fps} | Particles: {particleCount}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

#### Low Performance / Stuttering

**Symptoms:** Animation appears choppy or slow
**Solutions:**
1. Reduce `particleCount` (try 75-100)
2. Lower `targetFPS` (try 30)
3. Increase `drag` to make particles fade faster
4. Reduce `intensity`

```tsx
// Performance-optimized settings
<SplashCursor 
  particleCount={75}
  targetFPS={30}
  drag={0.95}
  intensity={0.6}
/>
```

#### Trails Too Faint

**Symptoms:** Cursor trails are barely visible
**Solutions:**
1. Increase `intensity`
2. Adjust color `saturation` and `lightness`
3. Increase `particleCount`

```tsx
// More visible trails
<SplashCursor 
  intensity={1.0}
  colors={{ 
    mode: 'single',
    baseHue: 240,
    saturation: 90,
    lightness: 70
  }}
/>
```

#### Trails Too Intense

**Symptoms:** Effect is overwhelming or distracting
**Solutions:**
1. Reduce `intensity`
2. Lower `particleCount`
3. Increase `drag` for faster fading

```tsx
// Subtle effect
<SplashCursor 
  intensity={0.3}
  particleCount={75}
  drag={0.99}
/>
```

#### Canvas Not Appearing

**Symptoms:** No visual effect visible
**Solutions:**
1. Check `zIndex` - ensure it's above other elements
2. Verify container has proper dimensions
3. Check for CSS conflicts

```tsx
// Ensure proper layering
<SplashCursor 
  zIndex={9999}
  style={{ pointerEvents: 'none' }}
/>
```

#### Memory Issues

**Symptoms:** Browser becomes slow over time
**Solutions:**
1. Enable `pauseOnHidden`
2. Reduce `particleCount`
3. Call `reset()` periodically

```tsx
<SplashCursor 
  pauseOnHidden={true}
  particleCount={100}
/>
```

### Browser Compatibility

#### WebGL Issues
SplashCursor uses Canvas 2D, not WebGL, so it works on all modern browsers.

#### Mobile Safari
- Reduce `particleCount` for better performance
- Enable `pauseOnHidden` to save battery

#### Older Browsers
- Automatic fallback to simpler rendering
- Graceful degradation for missing features

### Debugging

#### Enable Debug Mode

```tsx
// Add debug information to canvas
<SplashCursor 
  style={{ border: '1px solid red' }}  // Visualize canvas bounds
/>
```

#### Performance Logging

```javascript
// Vanilla JS debugging
const splashCursor = createSplashCursor();

splashCursor.onPerformanceUpdate((metrics) => {
  if (metrics.fps < 30) {
    console.warn('Low FPS detected:', metrics);
  }
});
```

## Migration Guide

### From FluidBackground to SplashCursor

If you're currently using the FluidBackground component and want to switch to SplashCursor:

#### Before (FluidBackground)
```tsx
<FluidBackground 
  colors={{ fluid: 'rainbow' }}
  physics={{ viscosity: 0.3 }}
  interaction={{ intensity: 0.8 }}
/>
```

#### After (SplashCursor)
```tsx
<SplashCursor 
  colors={{ mode: 'rainbow' }}
  intensity={0.8}
  drag={0.997}  // Similar to viscosity
/>
```

### Key Differences

| FluidBackground | SplashCursor | Notes |
|----------------|--------------|-------|
| `physics.viscosity` | `drag` | Controls particle movement resistance |
| `interaction.intensity` | `intensity` | Controls effect strength |
| `colors.fluid` | `colors.mode` | Color configuration |
| Full-screen simulation | Cursor-following particles | Different interaction model |

### Configuration Mapping

```tsx
// FluidBackground equivalent settings
const fluidBackgroundConfig = {
  colors: { fluid: 'rainbow' },
  physics: { viscosity: 0.3, curl: 30 },
  interaction: { intensity: 0.8 }
};

// SplashCursor equivalent
const splashCursorConfig = {
  colors: { mode: 'rainbow' },
  drag: 0.997,  // Higher drag = more viscous
  intensity: 0.8,
  gravity: 0.01  // Adds subtle movement
};
```

### Gradual Migration

You can use both components together during migration:

```tsx
function App() {
  const [useNewCursor, setUseNewCursor] = useState(false);
  
  return (
    <div>
      {useNewCursor ? (
        <SplashCursor intensity={0.8} />
      ) : (
        <FluidBackground interaction={{ intensity: 0.8 }} />
      )}
      
      <button onClick={() => setUseNewCursor(!useNewCursor)}>
        Toggle Cursor Effect
      </button>
    </div>
  );
}
```

## Examples

### Basic Examples

#### Simple Setup
```tsx
import { SplashCursor } from 'fluid-react';

function App() {
  return (
    <div>
      <SplashCursor />
      <h1>My App</h1>
    </div>
  );
}
```

#### Custom Colors
```tsx
<SplashCursor 
  colors={{
    mode: 'single',
    baseHue: 280,     // Purple
    saturation: 85,
    lightness: 65
  }}
  intensity={0.9}
/>
```

#### Performance Optimized
```tsx
<SplashCursor 
  particleCount={75}
  targetFPS={30}
  pauseOnHidden={true}
  drag={0.95}
/>
```

### Advanced Examples

#### Dynamic Configuration
```tsx
function DynamicSplashCursor() {
  const [config, setConfig] = useState({
    intensity: 0.8,
    colors: { mode: 'rainbow' as const }
  });
  
  const { updateConfig } = useSplashCursor(config);
  
  const changeToBlue = () => {
    const newConfig = {
      colors: { mode: 'single' as const, baseHue: 240 }
    };
    setConfig(prev => ({ ...prev, ...newConfig }));
    updateConfig(newConfig);
  };
  
  return (
    <div>
      <SplashCursor {...config} />
      <button onClick={changeToBlue}>Blue Theme</button>
    </div>
  );
}
```

#### Conditional Rendering
```tsx
function ConditionalSplashCursor() {
  const [enabled, setEnabled] = useState(true);
  const [isLowPower, setIsLowPower] = useState(false);
  
  // Detect low power mode (simplified)
  useEffect(() => {
    const checkPerformance = () => {
      const start = performance.now();
      requestAnimationFrame(() => {
        const delta = performance.now() - start;
        setIsLowPower(delta > 20); // Rough heuristic
      });
    };
    
    checkPerformance();
  }, []);
  
  if (!enabled) return null;
  
  return (
    <SplashCursor 
      particleCount={isLowPower ? 50 : 150}
      targetFPS={isLowPower ? 24 : 60}
      intensity={isLowPower ? 0.5 : 0.8}
    />
  );
}
```

#### Multiple Instances
```tsx
function MultipleSplashCursors() {
  return (
    <div>
      {/* Main cursor effect */}
      <SplashCursor 
        intensity={0.8}
        colors={{ mode: 'rainbow' }}
        zIndex={9999}
      />
      
      {/* Subtle background effect */}
      <SplashCursor 
        intensity={0.3}
        colors={{ mode: 'single', baseHue: 240 }}
        particleCount={50}
        gravity={-0.01}
        zIndex={1}
      />
    </div>
  );
}
```

### Vanilla JavaScript Examples

#### Basic Setup
```html
<!DOCTYPE html>
<html>
<head>
  <title>SplashCursor Demo</title>
</head>
<body>
  <h1>My Website</h1>
  
  <script type="module">
    import { createSplashCursor } from './node_modules/fluid-react/dist/vanilla.js';
    
    const splashCursor = createSplashCursor({
      intensity: 0.8,
      colors: { mode: 'rainbow' }
    });
    
    splashCursor.start();
  </script>
</body>
</html>
```

#### With Controls
```html
<div id="controls">
  <button id="start">Start</button>
  <button id="stop">Stop</button>
  <button id="reset">Reset</button>
  <input id="intensity" type="range" min="0" max="1" step="0.1" value="0.8">
</div>

<script>
  const splashCursor = createSplashCursor();
  
  document.getElementById('start').onclick = () => splashCursor.start();
  document.getElementById('stop').onclick = () => splashCursor.stop();
  document.getElementById('reset').onclick = () => splashCursor.reset();
  
  document.getElementById('intensity').oninput = (e) => {
    splashCursor.updateConfig({ intensity: parseFloat(e.target.value) });
  };
</script>
```

#### Performance Monitoring
```javascript
const splashCursor = createSplashCursor();

// Monitor performance
splashCursor.onPerformanceUpdate((metrics) => {
  document.getElementById('fps').textContent = Math.round(metrics.fps);
  document.getElementById('particles').textContent = metrics.particleCount;
  
  // Auto-adjust quality
  if (metrics.fps < 30) {
    splashCursor.updateConfig({ particleCount: 75 });
  }
});

splashCursor.start();
```

This comprehensive API documentation covers all aspects of using the SplashCursor component, from basic setup to advanced configuration and troubleshooting.
# API Reference

## FluidBackground Component

The main component that renders an interactive fluid simulation background.

### Props

#### `colors?: ColorConfiguration`

Configure the visual appearance of the fluid simulation.

```typescript
interface ColorConfiguration {
  background?: ColorRGB;
  fluid?: FluidColorMode;
}

type ColorRGB = { r: number; g: number; b: number };
type FluidColorMode = 'rainbow' | 'monochrome' | ColorRGB[];
```

**Default Values:**
- `background`: `{ r: 0, g: 0, b: 0 }` (black)
- `fluid`: `'rainbow'`

**Color Value Range:** All RGB values should be between 0.0 and 1.0.

**Examples:**

```tsx
// Rainbow fluid on dark background
<FluidBackground 
  colors={{
    background: { r: 0.05, g: 0.05, b: 0.1 },
    fluid: 'rainbow'
  }}
/>

// Custom color palette
<FluidBackground 
  colors={{
    fluid: [
      { r: 0.9, g: 0.3, b: 0.4 }, // Pink
      { r: 0.3, g: 0.7, b: 0.9 }, // Blue
      { r: 0.9, g: 0.8, b: 0.3 }  // Yellow
    ]
  }}
/>

// Monochrome for subtle effect
<FluidBackground 
  colors={{
    background: { r: 0.95, g: 0.95, b: 0.95 },
    fluid: 'monochrome'
  }}
/>
```

#### `physics?: PhysicsConfiguration`

Control the fluid simulation physics parameters.

```typescript
interface PhysicsConfiguration {
  viscosity?: number;
  density?: number;
  pressure?: number;
  curl?: number;
  splatRadius?: number;
  splatForce?: number;
}
```

**Parameter Details:**

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `viscosity` | 0.0 - 1.0 | 0.3 | Fluid thickness/resistance to flow |
| `density` | 0.0 - 1.0 | 0.8 | Fluid density affecting momentum |
| `pressure` | 0.0 - 1.0 | 0.8 | Pressure solver strength |
| `curl` | 0.0 - 50.0 | 30.0 | Vorticity/swirl strength |
| `splatRadius` | 0.0 - 1.0 | 0.25 | Size of interaction area |
| `splatForce` | 0.0 - 10000.0 | 6000.0 | Force applied by interactions |

**Physics Presets:**

```tsx
// Thick honey-like fluid
<FluidBackground 
  physics={{
    viscosity: 0.8,
    density: 0.9,
    curl: 15,
    splatForce: 3000
  }}
/>

// Thin water-like fluid
<FluidBackground 
  physics={{
    viscosity: 0.1,
    density: 0.6,
    curl: 40,
    splatForce: 8000
  }}
/>

// Chaotic turbulent fluid
<FluidBackground 
  physics={{
    viscosity: 0.2,
    curl: 45,
    splatForce: 9000,
    splatRadius: 0.4
  }}
/>
```

#### `performance?: PerformanceConfiguration`

Optimize performance for different devices and use cases.

```typescript
interface PerformanceConfiguration {
  resolution?: Resolution;
  frameRate?: number;
  pauseOnHidden?: boolean;
}

type Resolution = 'low' | 'medium' | 'high' | 'auto';
```

**Resolution Settings:**

| Resolution | Texture Size | Best For |
|------------|--------------|----------|
| `'low'` | 128x128 | Mobile devices, battery saving |
| `'medium'` | 256x256 | Balanced performance |
| `'high'` | 512x512 | Desktop, high-end devices |
| `'auto'` | Dynamic | Automatic optimization (recommended) |

**Performance Examples:**

```tsx
// Battery-friendly mobile configuration
<FluidBackground 
  performance={{
    resolution: 'low',
    frameRate: 24,
    pauseOnHidden: true
  }}
/>

// High-quality desktop configuration
<FluidBackground 
  performance={{
    resolution: 'high',
    frameRate: 60,
    pauseOnHidden: false
  }}
/>

// Adaptive configuration (recommended)
<FluidBackground 
  performance={{
    resolution: 'auto'
  }}
/>
```

#### `interaction?: InteractionConfiguration`

Control user interaction behavior.

```typescript
interface InteractionConfiguration {
  enabled?: boolean;
  mouse?: boolean;
  touch?: boolean;
  intensity?: number;
}
```

**Interaction Examples:**

```tsx
// Disable all interactions
<FluidBackground 
  interaction={{ enabled: false }}
/>

// Touch-only for mobile
<FluidBackground 
  interaction={{
    mouse: false,
    touch: true
  }}
/>

// Subtle interactions
<FluidBackground 
  interaction={{
    intensity: 0.3
  }}
/>

// Intense interactions
<FluidBackground 
  interaction={{
    intensity: 2.0,
    splatRadius: 0.4
  }}
/>
```

#### `style?: React.CSSProperties`

Apply custom CSS styles to the background container.

```tsx
<FluidBackground 
  style={{
    opacity: 0.8,
    filter: 'blur(2px) brightness(1.2)',
    mixBlendMode: 'multiply'
  }}
/>
```

#### `className?: string`

Add custom CSS classes for styling.

```tsx
<FluidBackground className="my-custom-fluid" />
```

```css
.my-custom-fluid {
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.my-custom-fluid:hover {
  opacity: 1.0;
}
```

#### `zIndex?: number`

Set the z-index of the background element.

**Default:** `-1`

```tsx
// Ensure background stays behind content
<FluidBackground zIndex={-10} />

// Place above certain elements but below others
<FluidBackground zIndex={5} />
```

## Utility Exports

### Color Utilities

```typescript
// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): ColorRGB;

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): ColorHSV;

// Convert hex string to RGB
function hexToRgb(hex: string): ColorRGB;

// Convert RGB to hex string
function rgbToHex(r: number, g: number, b: number): string;

// Generate random color
function generateRandomColor(): ColorRGB;

// Generate rainbow color at position
function generateRainbowColor(position: number): ColorRGB;

// Blend two colors
function blendColors(color1: ColorRGB, color2: ColorRGB, factor: number): ColorRGB;
```

### Math Utilities

```typescript
// Clamp value between min and max
function clamp(value: number, min: number, max: number): number;

// Linear interpolation
function lerp(a: number, b: number, t: number): number;

// Map value from one range to another
function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;

// Smooth step interpolation
function smoothstep(edge0: number, edge1: number, x: number): number;

// Normalize vector
function normalize(x: number, y: number): { x: number; y: number };
```

### WebGL Utilities

```typescript
// Create WebGL context with error handling
function createWebGLContext(canvas: HTMLCanvasElement): WebGL2RenderingContext | null;

// Detect WebGL capabilities
function detectWebGLCapabilities(gl: WebGL2RenderingContext): WebGLCapabilities;

// Check for WebGL errors
function checkWebGLError(gl: WebGL2RenderingContext, operation: string): boolean;

// Validate framebuffer
function validateFramebuffer(gl: WebGL2RenderingContext, framebuffer: WebGLFramebuffer): boolean;
```

## Configuration Utilities

### Default Configuration

```typescript
import { DEFAULT_CONFIG } from 'fluid-background';

// Access default values
console.log(DEFAULT_CONFIG.physics.viscosity); // 0.3
console.log(DEFAULT_CONFIG.colors.fluid); // 'rainbow'
```

### Performance Presets

```typescript
import { PERFORMANCE_PRESETS } from 'fluid-background';

// Use predefined performance configurations
<FluidBackground {...PERFORMANCE_PRESETS.mobile} />
<FluidBackground {...PERFORMANCE_PRESETS.desktop} />
<FluidBackground {...PERFORMANCE_PRESETS.highEnd} />
```

### Configuration Merging

```typescript
import { mergeConfig } from 'fluid-background';

const customConfig = mergeConfig(DEFAULT_CONFIG, {
  physics: { viscosity: 0.5 },
  colors: { fluid: 'monochrome' }
});
```

## Error Handling

### WebGL Errors

```typescript
import { WebGLError } from 'fluid-background';

try {
  // WebGL operations
} catch (error) {
  if (error instanceof WebGLError) {
    console.error('WebGL Error:', error.message, error.context);
  }
}
```

### Shader Compilation Errors

```typescript
import { ShaderCompilationError } from 'fluid-background';

try {
  // Shader compilation
} catch (error) {
  if (error instanceof ShaderCompilationError) {
    console.error('Shader Error:', error.message);
    console.error('Shader Source:', error.shaderSource);
  }
}
```

## Type Definitions

All TypeScript type definitions are included with the package:

```typescript
import type {
  FluidBackgroundProps,
  FluidSimulationConfig,
  ColorRGB,
  ColorHSV,
  Resolution,
  FluidColorMode,
  WebGLCapabilities,
  WebGLExtensions
} from 'fluid-background';
```


# 💧 Fluid Background

Interactive fluid simulation background component for Next.js applications. Create stunning, performant fluid animations that respond to user interactions.

[![npm version](https://badge.fury.io/js/fluid-background.svg)](https://badge.fury.io/js/fluid-background)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-Compatible-black.svg)](https://nextjs.org/)

---

## ✨ Features

- 🎨 **Interactive Fluid Simulation** - Real-time WebGL-based fluid dynamics
- 📱 **Mobile Optimized** - Automatic performance scaling for mobile devices
- 🎯 **TypeScript Ready** - Full type definitions included
- ⚡ **Performance First** - Automatic quality adjustment based on device capabilities
- 🎛️ **Highly Customizable** - Extensive configuration options for colors, physics, and behavior
- ♿ **Accessible** - Respects `prefers-reduced-motion` and includes ARIA labels
- 🔧 **Next.js Optimized** - SSR-safe with app router support

---

## 🚀 Installation

```bash
npm install fluid-background
```

---

## ⚡ Quick Start

### Basic Usage

```tsx
import { FluidBackground } from 'fluid-background';

export default function MyPage() {
  return (
    <div>
      <FluidBackground />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Your content here</h1>
        <p>The fluid background will render behind this content.</p>
      </main>
    </div>
  );
}
```

### Custom Colors

```tsx
import { FluidBackground } from 'fluid-background';

export default function CustomPage() {
  return (
    <div>
      <FluidBackground
        colors={{
          background: { r: 0.1, g: 0.1, b: 0.2 },
          fluid: [
            { r: 0.8, g: 0.2, b: 0.4 },
            { r: 0.2, g: 0.6, b: 0.8 },
            { r: 0.9, g: 0.7, b: 0.3 }
          ]
        }}
      />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Custom Colored Fluid</h1>
      </main>
    </div>
  );
}
```

---

## 📖 API Reference

### FluidBackground Props

#### `colors?: ColorConfiguration`

Configure the visual appearance of the fluid simulation.

```tsx
interface ColorConfiguration {
  background?: { r: number; g: number; b: number };
  fluid?: 'rainbow' | 'monochrome' | { r: number; g: number; b: number }[];
}
```

**Examples:**
```tsx
// Rainbow colors (default)
<FluidBackground colors={{ fluid: 'rainbow' }} />

// Monochrome
<FluidBackground colors={{ fluid: 'monochrome' }} />

// Custom colors
<FluidBackground 
  colors={{
    background: { r: 0, g: 0, b: 0 },
    fluid: [
      { r: 1, g: 0, b: 0 },
      { r: 0, g: 1, b: 0 },
      { r: 0, g: 0, b: 1 }
    ]
  }}
/>
```

#### `physics?: PhysicsConfiguration`

Control the fluid simulation physics parameters.

```tsx
interface PhysicsConfiguration {
  viscosity?: number;    // Fluid thickness (0.0 - 1.0, default: 0.3)
  density?: number;      // Fluid density (0.0 - 1.0, default: 0.8)
  pressure?: number;     // Pressure strength (0.0 - 1.0, default: 0.8)
  curl?: number;         // Vorticity strength (0.0 - 50.0, default: 30.0)
  splatRadius?: number;  // Interaction radius (0.0 - 1.0, default: 0.25)
  splatForce?: number;   // Interaction force (0.0 - 1.0, default: 6000.0)
}
```

**Examples:**
```tsx
// Thick, slow fluid
<FluidBackground 
  physics={{
    viscosity: 0.8,
    density: 0.9,
    splatForce: 3000
  }}
/>

// Fast, chaotic fluid
<FluidBackground 
  physics={{
    viscosity: 0.1,
    curl: 45,
    splatForce: 8000
  }}
/>
```

#### `performance?: PerformanceConfiguration`

Optimize performance for different devices and use cases.

```tsx
interface PerformanceConfiguration {
  resolution?: 'low' | 'medium' | 'high' | 'auto';
  frameRate?: number;        // Target FPS (default: 60)
  pauseOnHidden?: boolean;   // Pause when tab is hidden (default: true)
}
```

**Examples:**
```tsx
// High performance for desktop
<FluidBackground 
  performance={{
    resolution: 'high',
    frameRate: 60
  }}
/>

// Battery-friendly mobile
<FluidBackground 
  performance={{
    resolution: 'low',
    frameRate: 30,
    pauseOnHidden: true
  }}
/>

// Auto-adjust based on device (recommended)
<FluidBackground performance={{ resolution: 'auto' }} />
```

#### `interaction?: InteractionConfiguration`

Control user interaction behavior.

```tsx
interface InteractionConfiguration {
  enabled?: boolean;    // Enable/disable interactions (default: true)
  mouse?: boolean;      // Mouse interactions (default: true)
  touch?: boolean;      // Touch interactions (default: true)
  intensity?: number;   // Interaction strength multiplier (default: 1.0)
}
```

**Examples:**
```tsx
// Non-interactive background
<FluidBackground interaction={{ enabled: false }} />

// Touch-only (mobile)
<FluidBackground 
  interaction={{
    mouse: false,
    touch: true
  }}
/>

// Subtle interactions
<FluidBackground 
  interaction={{
    intensity: 0.5
  }}
/>
```

#### `style?: React.CSSProperties`

Apply custom CSS styles to the background container.

```tsx
<FluidBackground 
  style={{
    opacity: 0.8,
    filter: 'blur(1px)'
  }}
/>
```

#### `className?: string`

Add custom CSS classes.

```tsx
<FluidBackground className="my-fluid-background" />
```

#### `zIndex?: number`

Set the z-index of the background (default: -1).

```tsx
<FluidBackground zIndex={-10} />
```

---

## 🎨 Color Formats

Colors are specified as RGB objects with values between 0 and 1:

```tsx
{ r: 1.0, g: 0.5, b: 0.0 }  // Orange
{ r: 0.0, g: 0.0, b: 0.0 }  // Black
{ r: 1.0, g: 1.0, b: 1.0 }  // White
```

### Predefined Color Modes

- **`'rainbow'`** - Cycles through vibrant rainbow colors
- **`'monochrome'`** - Uses grayscale colors for a subtle effect

---

## 🔧 Performance Optimization

### Automatic Optimization

The component automatically optimizes performance based on:
- Device capabilities (mobile vs desktop)
- WebGL support level
- Current frame rate
- Battery status (when available)

### Manual Optimization

```tsx
// For low-end devices
<FluidBackground 
  performance={{
    resolution: 'low',
    frameRate: 30
  }}
  physics={{
    viscosity: 0.5,  // Simpler simulation
    curl: 15         // Reduced complexity
  }}
/>

// For high-end devices
<FluidBackground 
  performance={{
    resolution: 'high',
    frameRate: 60
  }}
  physics={{
    curl: 40,        // More complex simulation
    splatForce: 8000 // Stronger interactions
  }}
/>
```

### Performance Monitoring

The component includes built-in performance monitoring that automatically:
- Reduces quality when frame rate drops
- Pauses animation when the tab is hidden
- Adjusts resolution based on device pixel ratio

---

## ♿ Accessibility

### Reduced Motion Support

The component respects the `prefers-reduced-motion` CSS media query:

```css
@media (prefers-reduced-motion: reduce) {
  /* Fluid animation is automatically disabled */
}
```

### Screen Reader Support

- Includes appropriate ARIA labels
- Provides descriptive text for screen readers
- Uses semantic HTML structure

### Keyboard Navigation

The background doesn't interfere with keyboard navigation and maintains proper focus management.

---

## 🌐 Browser Support

### WebGL Requirements

- **Chrome/Edge**: Version 56+
- **Firefox**: Version 51+
- **Safari**: Version 15+
- **Mobile Safari**: iOS 15+
- **Chrome Mobile**: Version 56+

### Fallback Behavior

When WebGL is not supported, the component:
- Renders a static gradient background
- Logs a helpful warning message
- Maintains the same API for consistency

---

## 🔍 Troubleshooting

### Common Issues

#### "WebGL not supported" Error

**Problem**: The browser doesn't support WebGL or it's disabled.

**Solutions**:
1. Update to a modern browser
2. Enable hardware acceleration in browser settings
3. Check if WebGL is blocked by browser extensions

#### Poor Performance on Mobile

**Problem**: Animation is choppy or slow on mobile devices.

**Solutions**:
```tsx
<FluidBackground 
  performance={{
    resolution: 'low',
    frameRate: 30
  }}
  physics={{
    viscosity: 0.6,
    curl: 20
  }}
/>
```

#### Background Not Visible

**Problem**: The fluid background doesn't appear.

**Solutions**:
1. Ensure content has `position: relative` and `zIndex: 1`
2. Check that the container has sufficient height
3. Verify WebGL support in the browser

#### Hydration Mismatch in Next.js

**Problem**: Server/client rendering mismatch.

**Solution**: The component is designed to be SSR-safe, but if issues persist:
```tsx
import dynamic from 'next/dynamic';

const FluidBackground = dynamic(
  () => import('fluid-background').then(mod => mod.FluidBackground),
  { ssr: false }
);
```

#### High CPU/Battery Usage

**Problem**: The animation consumes too many resources.

**Solutions**:
```tsx
<FluidBackground 
  performance={{
    resolution: 'low',
    frameRate: 24,
    pauseOnHidden: true
  }}
/>
```

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=fluid-background npm run dev
```

---

## 🏗️ Advanced Usage

### Custom Styling

```tsx
<FluidBackground 
  className="custom-fluid"
  style={{
    opacity: 0.7,
    mixBlendMode: 'multiply',
    filter: 'hue-rotate(45deg)'
  }}
/>
```

### Responsive Configuration

```tsx
import { FluidBackground } from 'fluid-background';
import { useMediaQuery } from 'your-media-query-hook';

export default function ResponsiveFluid() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <FluidBackground 
      performance={{
        resolution: isMobile ? 'low' : 'high',
        frameRate: isMobile ? 30 : 60
      }}
      physics={{
        splatForce: isMobile ? 4000 : 6000
      }}
    />
  );
}
```

### Integration with Theme Systems

```tsx
import { FluidBackground } from 'fluid-background';
import { useTheme } from 'your-theme-provider';

export default function ThemedFluid() {
  const theme = useTheme();
  
  return (
    <FluidBackground 
      colors={{
        background: theme.colors.background,
        fluid: theme.colors.accent
      }}
    />
  );
}
```

---

## 📚 Documentation

- **[API Reference](./docs/API.md)** - Complete API documentation with examples
- **[Usage Examples](./docs/EXAMPLES.md)** - Comprehensive usage examples and patterns
- **[Performance Guide](./docs/PERFORMANCE.md)** - Optimization strategies and best practices
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

---

## 📋 Implementation Plan & Progress

Below is a checklist of major implementation tasks. Progress is tracked live:

### ✅ = Complete, 🔄 = In Progress, ⬜ = Not Started

| Status | Task |
|--------|------|
| ✅ | 1. Set up project structure and core interfaces |
| ✅ | 2. Implement utility modules |
| ✅ | 2.1 Create math and color utility functions |
| ✅ | 2.2 Implement WebGL utility functions |
| ✅ | 2.3 Create configuration management system |
| ✅ | 3. Build WebGL foundation classes |
| ✅ | 3.1 Implement WebGLContext class |
| ✅ | 3.2 Create ShaderManager class |
| ✅ | 3.3 Build FramebufferManager class |
| 🔄 | 4. Create individual shader modules |
| ✅ | 4.1 Implement base vertex shader |
| 🔄 | 4.2 Create fragment shader modules |
| ⬜ | 5. Build render pass classes |
| ⬜ | 5.1 Implement AdvectionPass class |
| ⬜ | 5.2 Create DivergencePass class |
| ⬜ | 5.3 Build PressurePass class |
| ⬜ | 5.4 Implement CurlPass class |
| ⬜ | 5.5 Create VorticityPass class |
| ⬜ | 5.6 Build SplatPass class |
| ⬜ | 6. Create simulation orchestrator |
| ⬜ | 6.1 Implement SimulationStep class |
| ⬜ | 6.2 Build InputHandler class |
| ⬜ | 7. Create React hooks |
| ⬜ | 7.1 Implement useFluidSimulation hook |
| ⬜ | 7.2 Build useResponsive hook |
| ⬜ | 7.3 Create usePerformance hook |
| ⬜ | 8. Build main React component |
| ⬜ | 8.1 Implement FluidBackground component |
| ⬜ | 8.2 Add accessibility and performance features |
| ⬜ | 9. Create package exports and documentation |
| ⬜ | 9.1 Set up package exports and TypeScript definitions |
| ⬜ | 9.2 Write comprehensive documentation |
| ⬜ | 10. Create example implementations |
| ⬜ | 10.1 Build basic usage examples |
| ⬜ | 10.2 Create advanced integration examples |

---

## 🛠️ Development

```bash
# 📦 Install dependencies
npm install

# 🧑‍💻 Start development
npm run dev

# 🧪 Run tests
npm test

# 🏗️ Build package
npm run build
```

---

## � License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
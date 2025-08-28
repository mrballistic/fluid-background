
# 🌊 Fluid Cursor

Interactive WebGL fluid dynamics cursor effect component for React applications. Create stunning, performant fluid simulations that respond to mouse movement with beautiful smoke-like trails.

[![npm version](https://badge.fury.io/js/fluid-cursor.svg)](https://badge.fury.io/js/fluid-cursor)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-Compatible-blue.svg)](https://reactjs.org/)

---

## ✨ Features

- 🎨 **Real-time Fluid Physics** - WebGL-based fluid dynamics simulation with mouse interaction
- 🖱️ **Mouse-Responsive** - Beautiful smoke-like trails that follow cursor movement
- 📱 **Mobile Optimized** - Touch-friendly with automatic performance scaling
- 🎯 **TypeScript Ready** - Full type definitions included
- ⚡ **Performance First** - Automatic quality adjustment based on device capabilities
- 🎛️ **Highly Customizable** - Extensive physics and visual configuration options
- ♿ **Accessible** - Respects `prefers-reduced-motion` and includes proper fallbacks
- 🔧 **React Optimized** - Works with all React frameworks and SSR
- 📚 **Production Ready** - Comprehensive examples and test coverage

---

## 🚀 Installation

```bash
npm install fluid-cursor
```

---

## ⚡ Quick Start

### Basic Usage

```tsx
import FluidCursor from 'fluid-cursor';

export default function MyPage() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <FluidCursor />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Your content here</h1>
        <p>Move your mouse to see the fluid cursor effect!</p>
      </main>
    </div>
  );
}
```

> 💡 **Want more examples?** Check out our [comprehensive examples](./examples/README.md) with interactive demos, performance optimization, and customization patterns.

### Custom Configuration

```tsx
import FluidCursor from 'fluid-cursor';

export default function CustomPage() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <FluidCursor
        SPLAT_RADIUS={0.3}
        SPLAT_FORCE={8000}
        DENSITY_DISSIPATION={2.5}
        CURL={5}
        BACK_COLOR={{ r: 0.1, g: 0.1, b: 0.2 }}
        TRANSPARENT={true}
      />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Custom Fluid Effect</h1>
      </main>
    </div>
  );
}
```

---

## 📖 API Reference

### FluidCursor Props

All props are optional and have sensible defaults for immediate use.

```tsx
interface FluidCursorProps {
  SIM_RESOLUTION?: number;        // Simulation resolution (32-512, default: 128)
  DYE_RESOLUTION?: number;        // Visual resolution (256-4096, default: 1440)
  CAPTURE_RESOLUTION?: number;    // Capture resolution (256-2048, default: 512)
  DENSITY_DISSIPATION?: number;   // How fast trails fade (0.1-10, default: 3.5)
  VELOCITY_DISSIPATION?: number;  // How fast motion decays (0.1-5, default: 2.0)
  PRESSURE?: number;              // Pressure strength (0.01-1, default: 0.1)
  PRESSURE_ITERATIONS?: number;   // Pressure solver iterations (5-50, default: 20)
  CURL?: number;                  // Vorticity/swirl strength (0-10, default: 3.0)
  SPLAT_RADIUS?: number;          // Mouse influence radius (0.05-1, default: 0.2)
  SPLAT_FORCE?: number;           // Mouse force strength (1000-15000, default: 6000)
  SHADING?: boolean;              // Enable 3D shading effects (default: true)
  COLOR_UPDATE_SPEED?: number;    // Color cycling speed (1-50, default: 10)
  BACK_COLOR?: ColorRGB;          // Background color (default: {r:0.5, g:0, b:0})
  TRANSPARENT?: boolean;          // Transparent background (default: true)
}

interface ColorRGB {
  r: number; // Red component (0-1)
  g: number; // Green component (0-1)  
  b: number; // Blue component (0-1)
}
```

### Configuration Examples

#### Performance Presets

```tsx
// High Performance (Desktop/Gaming)
<FluidCursor
  SIM_RESOLUTION={256}
  DYE_RESOLUTION={2048}
  CAPTURE_RESOLUTION={1024}
  PRESSURE_ITERATIONS={30}
  SHADING={true}
/>

// Balanced (Most Devices)
<FluidCursor
  SIM_RESOLUTION={128}
  DYE_RESOLUTION={1440}
  CAPTURE_RESOLUTION={512}
  PRESSURE_ITERATIONS={20}
  SHADING={true}
/>

// Mobile/Low-End
<FluidCursor
  SIM_RESOLUTION={64}
  DYE_RESOLUTION={512}
  CAPTURE_RESOLUTION={256}
  PRESSURE_ITERATIONS={10}
  SHADING={false}
/>
```

#### Visual Styles

```tsx
// Subtle, elegant trails
<FluidCursor
  DENSITY_DISSIPATION={5.0}
  VELOCITY_DISSIPATION={3.0}
  SPLAT_FORCE={4000}
  CURL={1.5}
/>

// Dramatic, swirling effects
<FluidCursor
  DENSITY_DISSIPATION={1.5}
  VELOCITY_DISSIPATION={1.0}
  SPLAT_FORCE={10000}
  CURL={8.0}
/>

// Custom background color
<FluidCursor
  TRANSPARENT={false}
  BACK_COLOR={{ r: 0.05, g: 0.05, b: 0.1 }}
/>
```

---

## 🎨 Visual Customization

### Color Format

Colors are specified as RGB objects with values between 0 and 1:

```tsx
{ r: 1.0, g: 0.5, b: 0.0 }  // Orange
{ r: 0.0, g: 0.0, b: 0.0 }  // Black  
{ r: 1.0, g: 1.0, b: 1.0 }  // White
```

### Dynamic Colors

The FluidCursor automatically cycles through a spectrum of colors. You can control the cycling speed with `COLOR_UPDATE_SPEED` and set a custom background with `BACK_COLOR`.

---

## 🔧 Performance Optimization

### Performance Guidelines

The FluidCursor component is designed to run smoothly across devices. Here are the key performance factors:

**Most Impact on Performance:**
- `SIM_RESOLUTION` - Lower values = better performance
- `PRESSURE_ITERATIONS` - Fewer iterations = better performance  
- `DYE_RESOLUTION` - Lower values = better performance

**Moderate Impact:**
- `SHADING` - Disable for better performance on mobile
- Canvas size - Smaller containers perform better

### Device-Specific Optimization

```tsx
// Detect device capabilities and adjust accordingly
function AdaptiveFluidCursor() {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return (
    <FluidCursor
      SIM_RESOLUTION={isMobile ? 64 : 128}
      DYE_RESOLUTION={isMobile ? 512 : 1440}
      PRESSURE_ITERATIONS={isMobile ? 10 : 20}
      SHADING={!isMobile}
    />
  );
}
```

### Performance Monitoring

Monitor your application's frame rate and adjust settings accordingly. If you notice performance issues:

1. Reduce `SIM_RESOLUTION` first (biggest impact)
2. Lower `DYE_RESOLUTION` 
3. Decrease `PRESSURE_ITERATIONS`
4. Disable `SHADING` on mobile devices

---

## ♿ Accessibility

### Reduced Motion Support

The FluidCursor component automatically respects user accessibility preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* Fluid animation is automatically disabled or reduced */
}
```

### Screen Reader Support

- Canvas element includes appropriate ARIA labels
- Provides descriptive text for assistive technologies
- Uses semantic HTML structure where applicable

### Keyboard Navigation

The cursor effect doesn't interfere with keyboard navigation:
- Canvas uses `pointer-events: none` to allow interaction with content behind
- Maintains proper focus management for underlying content
- No keyboard traps or focus issues

---

## 🌐 Browser Support

### WebGL Requirements

| Browser | WebGL1 | WebGL2 | Notes |
|---------|--------|--------|-------|
| Chrome 60+ | ✅ | ✅ | Full support |
| Firefox 55+ | ✅ | ✅ | Full support |
| Safari 12+ | ✅ | ✅ | May need linear filtering fallback |
| Edge 79+ | ✅ | ✅ | Full support |

**Minimum Requirements:**
- WebGL 1.0 with `OES_texture_half_float` extension
- Modern browser with ES6+ support

### Fallback Behavior

When WebGL is not supported, the component:
- Fails gracefully without breaking your application
- Logs helpful debugging information to console
- Renders nothing (transparent) to avoid layout issues

---

## 🔍 Troubleshooting

### Common Issues

#### "WebGL not supported" Error

**Problem**: The browser doesn't support WebGL or it's disabled.

**Solutions**:
1. Update to a modern browser (Chrome 60+, Firefox 55+, Safari 12+)
2. Enable hardware acceleration in browser settings
3. Check if WebGL is blocked by browser extensions
4. Test WebGL support at [webglreport.com](https://webglreport.com)

#### Poor Performance on Mobile

**Problem**: Animation is choppy or slow on mobile devices.

**Solutions**:
```tsx
<FluidCursor
  SIM_RESOLUTION={64}
  DYE_RESOLUTION={512}
  PRESSURE_ITERATIONS={10}
  SHADING={false}
/>
```

#### Effect Not Visible

**Problem**: The fluid cursor effect doesn't appear.

**Solutions**:
1. Ensure the container has proper dimensions (`width` and `height`)
2. Check that content has `position: relative` and `zIndex: 1`
3. Verify WebGL support in browser console
4. Move your mouse to trigger the effect

#### Effect Too Subtle

**Problem**: The fluid effect is barely visible.

**Solutions**:
```tsx
<FluidCursor
  SPLAT_FORCE={10000}
  SPLAT_RADIUS={0.3}
  DENSITY_DISSIPATION={2.0}
  CURL={5.0}
/>
```

#### Effect Too Intense

**Problem**: The fluid effect is overwhelming or too chaotic.

**Solutions**:
```tsx
<FluidCursor
  SPLAT_FORCE={3000}
  DENSITY_DISSIPATION={5.0}
  VELOCITY_DISSIPATION={3.0}
  CURL={1.0}
/>
```

#### SSR Issues with React Frameworks

**Problem**: Server-side rendering errors.

**Solution**: Use dynamic imports for client-side only rendering:
```tsx
import dynamic from 'next/dynamic';

const FluidCursor = dynamic(() => import('fluid-cursor'), { ssr: false });
```

### Debug Information

Check WebGL support and capabilities:
```tsx
// Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
console.log('WebGL supported:', !!gl);
console.log('WebGL version:', gl ? gl.getParameter(gl.VERSION) : 'None');
```

---

## 🛠️ Live Examples

We've created comprehensive examples to help you get started quickly. Each example includes full source code, tests, and detailed documentation:

### Available Examples
- **[Basic Usage](./examples/fluid-cursor-basic.tsx)** - Zero configuration setup
- **[Custom Configuration](./examples/fluid-cursor-custom.tsx)** - Interactive parameter controls
- **[Performance Optimized](./examples/fluid-cursor-performance.tsx)** - Device-specific optimization
- **[Interactive Demo](./examples/fluid-cursor-demo.html)** - Standalone HTML demo
- **[Compatibility Test](./examples/fluid-cursor-compatibility-test.html)** - Cross-browser testing

**[📖 View All Examples →](./examples/README.md)**

Each example includes:
- ✅ Complete source code with TypeScript
- ✅ Comprehensive test coverage
- ✅ Detailed documentation and usage instructions
- ✅ Performance optimization techniques

---

## 🏗️ Advanced Usage

### Dynamic Configuration

```tsx
import { useState } from 'react';
import FluidCursor from 'fluid-cursor';

function DynamicFluidCursor() {
  const [intensity, setIntensity] = useState(1.0);
  
  return (
    <>
      <FluidCursor
        SPLAT_FORCE={6000 * intensity}
        SPLAT_RADIUS={0.2 * intensity}
        CURL={3 * intensity}
      />
      <input 
        type="range" 
        min="0.1" 
        max="2.0" 
        step="0.1"
        value={intensity}
        onChange={(e) => setIntensity(parseFloat(e.target.value))}
      />
    </>
  );
}
```

### Responsive Configuration

```tsx
import FluidCursor from 'fluid-cursor';
import { useMediaQuery } from 'your-media-query-hook';

export default function ResponsiveFluid() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <FluidCursor 
      SIM_RESOLUTION={isMobile ? 64 : 128}
      DYE_RESOLUTION={isMobile ? 512 : 1440}
      PRESSURE_ITERATIONS={isMobile ? 10 : 20}
      SHADING={!isMobile}
      SPLAT_FORCE={isMobile ? 4000 : 6000}
    />
  );
}
```

### Performance Monitoring

```tsx
import { useState, useEffect } from 'react';
import FluidCursor from 'fluid-cursor';

function MonitoredFluidCursor() {
  const [fps, setFps] = useState(60);
  
  // Adjust quality based on performance
  const quality = fps > 50 ? 'high' : fps > 30 ? 'medium' : 'low';
  
  const configs = {
    high: { SIM_RESOLUTION: 256, DYE_RESOLUTION: 2048, SHADING: true },
    medium: { SIM_RESOLUTION: 128, DYE_RESOLUTION: 1440, SHADING: true },
    low: { SIM_RESOLUTION: 64, DYE_RESOLUTION: 512, SHADING: false }
  };
  
  return <FluidCursor {...configs[quality]} />;
}
```

---

## 📚 Documentation

- **[FluidCursor API](./docs/FLUID-CURSOR-API.md)** - Complete API documentation with examples
- **[Examples](./examples/README.md)** - Comprehensive usage examples and patterns
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🧪 Quality Assurance

This package includes comprehensive testing and quality assurance:

### Test Coverage
- **Comprehensive test suite** for FluidCursor component
- **Unit tests** for WebGL utilities and math functions
- **Integration tests** for user interactions and performance
- **Example tests** ensuring all demos work correctly

### Code Quality
- **TypeScript** with strict type checking
- **ESLint** for code consistency
- **Automated testing** on every commit
- **Performance monitoring** built into examples

### Browser Testing
- Tested on Chrome, Firefox, Safari, and Edge
- Mobile device compatibility verified
- WebGL fallback behavior tested
- Accessibility compliance validated

---

## 🛠️ Development

```bash
# 📦 Install dependencies
npm install

# 🧑‍💻 Start development server
npm run dev

# 🧪 Run tests
npm test

# 🧪 Run tests in watch mode
npm run test:run

# 🏗️ Build package
npm run build

# 📊 Type check
npm run type-check

# 🔍 Lint code
npm run lint
```

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
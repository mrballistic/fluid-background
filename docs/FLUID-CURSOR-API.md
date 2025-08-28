# FluidCursor API Documentation

The FluidCursor component creates a WebGL-based fluid dynamics simulation that responds to mouse movement, creating beautiful smoke-like trails through real-time fluid physics.

## Installation

```bash
npm install your-package-name
```

## Basic Usage

```tsx
import React from 'react';
import FluidCursor from 'your-package-name/FluidCursor';

function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <FluidCursor />
      {/* Your content here */}
    </div>
  );
}
```

## Props Interface

The FluidCursor component accepts the following props, all of which are optional:

### FluidCursorProps

```typescript
interface FluidCursorProps {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  CAPTURE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  PRESSURE_ITERATIONS?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  SHADING?: boolean;
  COLOR_UPDATE_SPEED?: number;
  BACK_COLOR?: ColorRGB;
  TRANSPARENT?: boolean;
}

interface ColorRGB {
  r: number; // Red component (0-1)
  g: number; // Green component (0-1)
  b: number; // Blue component (0-1)
}
```

## Detailed Props Documentation

### Simulation Resolution

#### `SIM_RESOLUTION?: number`
- **Default:** `128`
- **Range:** `32` - `512`
- **Description:** Controls the resolution of the velocity field simulation. Higher values provide more detailed fluid motion but require more GPU power.
- **Performance Impact:** High - directly affects simulation complexity

#### `DYE_RESOLUTION?: number`
- **Default:** `1440`
- **Range:** `256` - `4096`
- **Description:** Controls the resolution of the dye (visual) field. Higher values provide sharper, more detailed visual trails.
- **Performance Impact:** Medium - affects visual quality and memory usage

#### `CAPTURE_RESOLUTION?: number`
- **Default:** `512`
- **Range:** `256` - `2048`
- **Description:** Resolution for capture operations (currently unused in basic implementation).
- **Performance Impact:** Low

### Physics Parameters

#### `DENSITY_DISSIPATION?: number`
- **Default:** `3.5`
- **Range:** `0.1` - `10.0`
- **Description:** Controls how quickly the dye fades over time. Lower values make trails last longer.
- **Visual Effect:** Higher = faster fade, Lower = longer trails

#### `VELOCITY_DISSIPATION?: number`
- **Default:** `2.0`
- **Range:** `0.1` - `5.0`
- **Description:** Controls how quickly velocity decays in the fluid. Lower values maintain motion longer.
- **Visual Effect:** Higher = motion stops faster, Lower = more persistent swirling

#### `PRESSURE?: number`
- **Default:** `0.1`
- **Range:** `0.01` - `1.0`
- **Description:** Pressure projection strength for maintaining incompressible flow.
- **Visual Effect:** Affects how the fluid maintains its volume and flow characteristics

#### `PRESSURE_ITERATIONS?: number`
- **Default:** `20`
- **Range:** `5` - `50`
- **Description:** Number of iterations for pressure solver. More iterations = more accurate fluid physics.
- **Performance Impact:** High - directly affects computation time per frame

#### `CURL?: number`
- **Default:** `3.0`
- **Range:** `0.0` - `10.0`
- **Description:** Vorticity confinement strength. Controls how much the fluid swirls and creates vortices.
- **Visual Effect:** Higher = more swirling motion, Lower = straighter flow

### Input Response

#### `SPLAT_RADIUS?: number`
- **Default:** `0.2`
- **Range:** `0.05` - `1.0`
- **Description:** Radius of influence when mouse input injects velocity and dye into the simulation.
- **Visual Effect:** Larger = broader brush effect, Smaller = more precise trails

#### `SPLAT_FORCE?: number`
- **Default:** `6000`
- **Range:** `1000` - `15000`
- **Description:** Strength of velocity injection from mouse movement.
- **Visual Effect:** Higher = more dramatic fluid motion, Lower = subtler effects

### Visual Settings

#### `SHADING?: boolean`
- **Default:** `true`
- **Description:** Enables 3D-like shading effects on the fluid surface using normal mapping.
- **Visual Effect:** Adds depth and dimensionality to the fluid appearance
- **Performance Impact:** Medium - adds fragment shader complexity

#### `COLOR_UPDATE_SPEED?: number`
- **Default:** `10`
- **Range:** `1` - `50`
- **Description:** Speed at which the fluid colors cycle through the spectrum.
- **Visual Effect:** Higher = faster color changes, Lower = slower color transitions

#### `BACK_COLOR?: ColorRGB`
- **Default:** `{ r: 0.5, g: 0, b: 0 }`
- **Description:** Background color when `TRANSPARENT` is false.
- **Format:** RGB values between 0 and 1

#### `TRANSPARENT?: boolean`
- **Default:** `true`
- **Description:** Whether the background should be transparent, allowing content behind to show through.
- **Visual Effect:** `true` = see-through background, `false` = solid background color

## Performance Recommendations

### High Performance (Desktop/Gaming)
```tsx
<FluidCursor
  SIM_RESOLUTION={256}
  DYE_RESOLUTION={2048}
  PRESSURE_ITERATIONS={30}
  SHADING={true}
/>
```

### Balanced (Most Devices)
```tsx
<FluidCursor
  SIM_RESOLUTION={128}
  DYE_RESOLUTION={1440}
  PRESSURE_ITERATIONS={20}
  SHADING={true}
/>
```

### Mobile/Low-End
```tsx
<FluidCursor
  SIM_RESOLUTION={64}
  DYE_RESOLUTION={512}
  PRESSURE_ITERATIONS={10}
  SHADING={false}
/>
```

## Browser Compatibility

| Browser | WebGL1 | WebGL2 | Notes |
|---------|--------|--------|-------|
| Chrome 60+ | ✅ | ✅ | Full support |
| Firefox 55+ | ✅ | ✅ | Full support |
| Safari 12+ | ✅ | ✅ | May need linear filtering fallback |
| Edge 79+ | ✅ | ✅ | Full support |

### WebGL Requirements

- **Minimum:** WebGL 1.0 with `OES_texture_half_float` extension
- **Recommended:** WebGL 2.0 with `EXT_color_buffer_float` extension
- **Fallbacks:** Automatic fallback to lower precision formats when extensions unavailable

## Error Handling

The component includes automatic error handling for:

- WebGL context creation failures
- Shader compilation errors
- Texture format incompatibilities
- Performance degradation

When WebGL is unavailable, the component will fail gracefully without breaking your application.

## Styling and Layout

The FluidCursor component renders a full-screen canvas with the following default styles:

```css
canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allows interaction with content behind */
}
```

### Container Requirements

The parent container should have:
- `position: relative` or `position: absolute`
- Defined width and height
- `overflow: hidden` (optional, for clean edges)

## Advanced Usage

### Dynamic Configuration

```tsx
function DynamicFluidCursor() {
  const [intensity, setIntensity] = useState(1.0);
  
  return (
    <FluidCursor
      SPLAT_FORCE={6000 * intensity}
      SPLAT_RADIUS={0.2 * intensity}
      CURL={3 * intensity}
    />
  );
}
```

### Performance Monitoring

```tsx
function MonitoredFluidCursor() {
  const [fps, setFps] = useState(60);
  
  // Adjust quality based on performance
  const quality = fps > 50 ? 'high' : fps > 30 ? 'medium' : 'low';
  
  const configs = {
    high: { SIM_RESOLUTION: 256, DYE_RESOLUTION: 2048 },
    medium: { SIM_RESOLUTION: 128, DYE_RESOLUTION: 1440 },
    low: { SIM_RESOLUTION: 64, DYE_RESOLUTION: 512 }
  };
  
  return <FluidCursor {...configs[quality]} />;
}
```

## Troubleshooting

### Common Issues

1. **Black screen or no effect**
   - Check WebGL support in browser
   - Verify container has proper dimensions
   - Check browser console for WebGL errors

2. **Poor performance**
   - Reduce `SIM_RESOLUTION` and `DYE_RESOLUTION`
   - Lower `PRESSURE_ITERATIONS`
   - Disable `SHADING`

3. **Effect too subtle**
   - Increase `SPLAT_FORCE`
   - Increase `SPLAT_RADIUS`
   - Decrease `DENSITY_DISSIPATION`

4. **Effect too intense**
   - Decrease `SPLAT_FORCE`
   - Increase `DENSITY_DISSIPATION`
   - Increase `VELOCITY_DISSIPATION`

### Debug Mode

For debugging, you can access WebGL context information:

```tsx
// Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
console.log('WebGL supported:', !!gl);
console.log('WebGL version:', gl ? gl.getParameter(gl.VERSION) : 'None');
```

## Examples

See the `/examples` directory for complete working examples:

- `fluid-cursor-basic.tsx` - Simple usage
- `fluid-cursor-custom.tsx` - Interactive controls
- `fluid-cursor-performance.tsx` - Performance optimization
- `fluid-cursor-demo.html` - Standalone HTML demo
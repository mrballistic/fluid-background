# Design Document

## Overview

The WebGL fluid cursor effect will be implemented as a real-time fluid dynamics simulation using WebGL shaders, following the exact approach from the original reference code. The system uses velocity fields, pressure projection, and dye advection to create authentic fluid motion that responds to mouse input.

## Architecture

### Single-File Approach (Phase 1)

Following the original code structure exactly, we'll create one React component file that contains:

```
FluidCursor.tsx (Single File Implementation)
├── All WebGL shader sources (inline strings)
├── WebGL context initialization and extension detection
├── Shader compilation and program creation functions
├── Framebuffer and texture management functions
├── Complete fluid simulation pipeline (inline in useEffect)
├── Mouse/touch event handlers
├── Animation loop with requestAnimationFrame
└── All utility functions (color generation, math helpers)
```

This mirrors the original code's structure where everything is contained in one React component with a large useEffect hook containing all the WebGL logic.

### Future Refactoring (Phase 2 - Optional)

After we have a working single-file implementation, we can optionally break it down:

```
WebGL Fluid Cursor System (Refactored)
├── FluidCursor.tsx (Main React component)
├── shaders/ (Extracted shader sources)
├── webgl/ (WebGL utility functions)
└── simulation/ (Simulation pipeline functions)
```

## Components and Interfaces

### 1. FluidCursor React Component (Single File Implementation)

**Purpose:** Exact clone of the original code structure in a single React component file

```typescript
// Match the original props interface exactly
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
  r: number;
  g: number;
  b: number;
}

// Match the original Pointer interface exactly
interface Pointer {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: ColorRGB;
}
```

### Implementation Structure

The component will contain all logic inline, matching the original:

1. **Props with exact same names and defaults**
2. **All shader sources as inline template strings**
3. **Complete WebGL initialization in useEffect**
4. **All helper functions defined inline**
5. **Event listeners attached directly to window**
6. **Animation loop with requestAnimationFrame**

### 2. Inline Implementation Details

**All logic will be contained within the single React component, matching the original structure:**

1. **Shader Sources** - All shader code as template strings within the component
2. **WebGL Functions** - All WebGL helper functions defined inline in useEffect
3. **Classes** - Program and Material classes defined inline
4. **Simulation Loop** - Complete fluid simulation pipeline in the animation loop
5. **Event Handlers** - Mouse and touch handlers attached directly to window

### Key Functions to Implement (Inline)

```typescript
// WebGL Context and Extension Detection
function getWebGLContext(canvas: HTMLCanvasElement): { gl: WebGL2RenderingContext, ext: Extensions }

// Shader Compilation
function compileShader(type: number, source: string, keywords?: string[]): WebGLShader
function createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram

// Framebuffer Management  
function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO
function createDoubleFBO(...): DoubleFBO

// Simulation Steps
function step(dt: number): void // Complete fluid simulation pipeline
function render(target: FBO | null): void
function splat(x: number, y: number, dx: number, dy: number, color: ColorRGB): void

// Input Handling
function updatePointerDownData(pointer: Pointer, id: number, posX: number, posY: number): void
function updatePointerMoveData(pointer: Pointer, posX: number, posY: number, color: ColorRGB): void

// Utility Functions
function generateColor(): ColorRGB
function HSVtoRGB(h: number, s: number, v: number): ColorRGB
```

## Data Models

### Exact Original Interfaces

```typescript
// Match original exactly - no changes
interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface Pointer {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: ColorRGB;
}

// Internal WebGL structures (from original)
interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}
```

### Shader Sources (Inline Template Strings)

All shader sources will be defined as template strings within the component, exactly matching the original:

- Base vertex shader with texture coordinate calculations
- Copy, clear, splat fragment shaders
- Advection shader with bilinear interpolation
- Divergence, curl, vorticity shaders
- Pressure iteration and gradient subtraction shaders
- Display shader with optional shading

## Error Handling

### WebGL Context Management

```typescript
class WebGLContextManager {
  static getContext(canvas: HTMLCanvasElement): {
    gl: WebGLRenderingContext | WebGL2RenderingContext;
    ext: WebGLExtensions;
  } | null;
  
  static detectExtensions(gl: WebGLRenderingContext | WebGL2RenderingContext): WebGLExtensions;
  static getSupportedFormat(gl: WebGLRenderingContext | WebGL2RenderingContext, 
                           internalFormat: number, format: number, type: number): TextureFormat | null;
}
```

### Error Recovery Strategies

1. **Shader Compilation Errors**
   - Log detailed shader compilation errors
   - Attempt fallback shader versions
   - Graceful degradation to simpler effects

2. **Texture Format Errors**
   - Try multiple texture formats in order of preference
   - Fall back to lower precision formats
   - Disable features requiring unsupported formats

3. **Performance Issues**
   - Monitor frame rate and automatically reduce quality
   - Scale down simulation resolution
   - Reduce pressure iteration count

4. **Context Loss**
   - Detect WebGL context loss events
   - Attempt context restoration
   - Reinitialize all WebGL resources

## Testing Strategy

### Unit Tests

1. **Shader Compilation Tests**
   - Test all shader sources compile successfully
   - Test shader program linking
   - Test uniform location retrieval

2. **Framebuffer Tests**
   - Test FBO creation with different formats
   - Test double-buffering swap operations
   - Test texture attachment and binding

3. **Math Utilities Tests**
   - Test coordinate transformations
   - Test color space conversions
   - Test vector operations

### Integration Tests

1. **Simulation Pipeline Tests**
   - Test complete simulation step execution
   - Test input injection and response
   - Test configuration updates

2. **React Component Tests**
   - Test component mounting and unmounting
   - Test prop updates and re-rendering
   - Test cleanup and resource disposal

### Performance Tests

1. **Frame Rate Tests**
   - Measure FPS under different loads
   - Test automatic quality adjustment
   - Benchmark different devices

2. **Memory Tests**
   - Monitor WebGL resource usage
   - Test for memory leaks
   - Verify proper cleanup

## Performance Optimizations

### WebGL Optimizations

1. **Texture Management**
   - Use appropriate texture formats (half-float when available)
   - Minimize texture creation and deletion
   - Reuse textures when possible

2. **Shader Optimizations**
   - Use precision qualifiers appropriately
   - Minimize branching in fragment shaders
   - Use built-in functions when available

3. **Rendering Optimizations**
   - Minimize state changes
   - Batch similar operations
   - Use efficient blending modes

### Adaptive Quality

1. **Resolution Scaling**
   - Automatically reduce simulation resolution on low-end devices
   - Scale dye resolution independently from velocity resolution
   - Provide quality presets

2. **Feature Toggling**
   - Disable expensive features (shading, high iteration counts)
   - Reduce pressure solver iterations under load
   - Simplify color calculations

## Browser Compatibility

### WebGL Support Matrix

| Browser | WebGL1 | WebGL2 | Float Textures | Linear Filtering |
|---------|--------|--------|----------------|------------------|
| Chrome  | ✓      | ✓      | ✓              | ✓                |
| Firefox | ✓      | ✓      | ✓              | ✓                |
| Safari  | ✓      | ✓      | ✓              | ⚠️               |
| Edge    | ✓      | ✓      | ✓              | ✓                |

### Fallback Strategies

1. **WebGL2 → WebGL1 Fallback**
   - Use RGBA textures instead of RG/R formats
   - Manual bilinear filtering in shaders
   - Alternative extension detection

2. **Float Texture Fallbacks**
   - Use half-float when full float unavailable
   - Fall back to 8-bit textures with reduced precision
   - Adjust simulation parameters for lower precision

3. **Linear Filtering Fallbacks**
   - Implement manual bilinear interpolation in shaders
   - Use MANUAL_FILTERING shader define
   - Maintain visual quality with software filtering

## Security Considerations

### Input Validation

1. **Configuration Validation**
   - Clamp all numeric parameters to safe ranges
   - Validate resolution limits to prevent excessive memory usage
   - Sanitize color inputs

2. **WebGL Resource Limits**
   - Respect maximum texture size limits
   - Monitor memory usage and prevent exhaustion
   - Implement automatic cleanup on errors

### Performance Safeguards

1. **Frame Rate Monitoring**
   - Automatically reduce quality if FPS drops below threshold
   - Implement emergency stop for severe performance issues
   - Provide user controls for manual quality adjustment

2. **Memory Management**
   - Set maximum limits for all WebGL resources
   - Implement proper cleanup on component unmount
   - Monitor for memory leaks and resource exhaustion
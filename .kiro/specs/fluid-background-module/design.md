# Design Document

## Overview

The fluid background module will be a standalone npm package that exports a React component for Next.js applications. The design focuses on creating a clean, performant, and easy-to-use component that encapsulates the WebGL fluid simulation while providing a simple API for customization.

## Architecture

### Package Structure
```
fluid-background/
├── src/
│   ├── index.ts                 # Main export
│   ├── FluidBackground.tsx      # Main component (~50 lines)
│   ├── hooks/
│   │   ├── useFluidSimulation.ts # Main simulation orchestrator (~100 lines)
│   │   ├── useResponsive.ts     # Responsive behavior (~50 lines)
│   │   └── usePerformance.ts    # Performance monitoring (~75 lines)
│   ├── simulation/
│   │   ├── WebGLContext.ts      # WebGL setup and context (~100 lines)
│   │   ├── ShaderManager.ts     # Shader compilation and management (~150 lines)
│   │   ├── FramebufferManager.ts # FBO creation and management (~100 lines)
│   │   ├── SimulationStep.ts    # Single simulation step logic (~75 lines)
│   │   ├── RenderPass.ts        # Individual render passes (~50 lines each)
│   │   │   ├── AdvectionPass.ts
│   │   │   ├── DivergencePass.ts
│   │   │   ├── PressurePass.ts
│   │   │   ├── CurlPass.ts
│   │   │   ├── VorticityPass.ts
│   │   │   └── SplatPass.ts
│   │   └── InputHandler.ts      # Mouse/touch input processing (~75 lines)
│   ├── shaders/
│   │   ├── vertex.ts            # Base vertex shader
│   │   ├── fragments/           # Fragment shaders (each ~30-50 lines)
│   │   │   ├── copy.ts
│   │   │   ├── clear.ts
│   │   │   ├── advection.ts
│   │   │   ├── divergence.ts
│   │   │   ├── pressure.ts
│   │   │   ├── curl.ts
│   │   │   ├── vorticity.ts
│   │   │   ├── gradientSubtract.ts
│   │   │   ├── splat.ts
│   │   │   └── display.ts
│   │   └── index.ts             # Shader exports
│   ├── utils/
│   │   ├── webgl.ts             # WebGL utilities (~100 lines)
│   │   ├── math.ts              # Math helpers (~50 lines)
│   │   ├── color.ts             # Color utilities (~50 lines)
│   │   └── config.ts            # Default configuration (~50 lines)
│   └── types/
│       └── index.ts             # TypeScript definitions (~100 lines)
├── package.json
├── tsconfig.json
├── README.md
└── examples/
    ├── basic-usage.tsx
    ├── custom-colors.tsx
    └── performance-optimized.tsx
```

### Component Hierarchy
- `FluidBackground` (main component)
  - Uses `useFluidSimulation` hook (orchestrator)
    - Uses `WebGLContext` for GL setup
    - Uses `ShaderManager` for shader compilation
    - Uses `FramebufferManager` for FBO management
    - Uses `SimulationStep` for physics calculations
    - Uses individual `RenderPass` classes for each simulation step
    - Uses `InputHandler` for user interactions
  - Uses `useResponsive` hook for viewport handling
  - Uses `usePerformance` hook for optimization
  - Renders a canvas element with proper positioning

### Simulation Architecture
Each render pass is isolated into its own class:
- **AdvectionPass**: Handles fluid advection
- **DivergencePass**: Calculates velocity divergence
- **PressurePass**: Solves pressure equations
- **CurlPass**: Computes velocity curl
- **VorticityPass**: Applies vorticity confinement
- **SplatPass**: Handles input splats

This modular approach ensures:
- Each file stays under 150 lines
- Easy testing of individual components
- Clear separation of concerns
- Simplified debugging

## Components and Interfaces

### Main Component Interface
```typescript
interface FluidBackgroundProps {
  // Visual Configuration
  colors?: {
    background?: { r: number; g: number; b: number };
    fluid?: 'rainbow' | 'monochrome' | { r: number; g: number; b: number }[];
  };
  
  // Physics Configuration
  physics?: {
    viscosity?: number;
    density?: number;
    pressure?: number;
    curl?: number;
    splatRadius?: number;
    splatForce?: number;
  };
  
  // Performance Configuration
  performance?: {
    resolution?: 'low' | 'medium' | 'high' | 'auto';
    frameRate?: number;
    pauseOnHidden?: boolean;
  };
  
  // Interaction Configuration
  interaction?: {
    enabled?: boolean;
    mouse?: boolean;
    touch?: boolean;
    intensity?: number;
  };
  
  // Layout Configuration
  style?: React.CSSProperties;
  className?: string;
  zIndex?: number;
}
```

### Core Interfaces

```typescript
// Base render pass interface
interface RenderPass {
  execute(gl: WebGL2RenderingContext, inputs: RenderPassInputs): void;
  cleanup(): void;
}

// Simulation orchestrator
interface SimulationStep {
  advection: AdvectionPass;
  divergence: DivergencePass;
  pressure: PressurePass;
  curl: CurlPass;
  vorticity: VorticityPass;
  splat: SplatPass;
  
  execute(deltaTime: number): void;
}

// WebGL context manager
interface WebGLContext {
  gl: WebGL2RenderingContext;
  extensions: WebGLExtensions;
  capabilities: WebGLCapabilities;
  
  initialize(canvas: HTMLCanvasElement): boolean;
  resize(width: number, height: number): void;
  cleanup(): void;
}

// Shader management
interface ShaderManager {
  compileShader(type: number, source: string): WebGLShader;
  createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram;
  getUniforms(program: WebGLProgram): Record<string, WebGLUniformLocation>;
}

// Main hook interface
interface UseFluidSimulationReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isInitialized: boolean;
  updateConfig: (config: Partial<FluidSimulationConfig>) => void;
}
```

## Data Models

### Configuration Model
The component will use a hierarchical configuration system:
1. **Default Configuration**: Sensible defaults for all parameters
2. **User Configuration**: Props passed by the developer
3. **Performance Configuration**: Auto-adjusted based on device capabilities
4. **Runtime Configuration**: Dynamic adjustments based on performance monitoring

### State Management
- Component state will be managed through React hooks
- WebGL state will be encapsulated within the simulation hook
- Performance metrics will be tracked and used for auto-optimization

## Error Handling

### WebGL Support Detection
```typescript
const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};
```

### Graceful Degradation
- If WebGL is not supported, render a static gradient background
- If performance is too low, automatically reduce quality settings
- Provide fallback options for unsupported features

### Error Boundaries
- Wrap the component in an error boundary to prevent crashes
- Log errors to console with helpful debugging information
- Provide recovery mechanisms for common issues

## Testing Strategy

### Unit Tests
- Test configuration merging and validation
- Test utility functions (color conversion, math helpers)
- Test hook behavior with mocked WebGL context

### Integration Tests
- Test component mounting and unmounting
- Test responsive behavior with viewport changes
- Test performance optimization triggers

### Visual Regression Tests
- Capture screenshots of different configurations
- Test across different browsers and devices
- Validate visual consistency

### Performance Tests
- Measure frame rate under different loads
- Test memory usage over time
- Validate auto-optimization behavior

## Implementation Considerations

### Next.js Compatibility
- Use dynamic imports for client-side only rendering
- Provide proper TypeScript definitions
- Ensure compatibility with both pages and app router
- Handle SSR gracefully with `useEffect` and `typeof window` checks

### Performance Optimization
- Implement automatic quality adjustment based on frame rate
- Use `requestAnimationFrame` for smooth animations
- Implement viewport-based rendering (pause when not visible)
- Optimize shader compilation and WebGL state management

### Accessibility
- Provide `prefers-reduced-motion` support
- Include ARIA labels for screen readers
- Offer option to disable animations entirely
- Ensure keyboard navigation is not affected

### Browser Compatibility
- Support modern browsers with WebGL support
- Provide polyfills where necessary
- Test on mobile Safari, Chrome, Firefox, and Edge
- Handle vendor-specific WebGL extensions gracefully

## Deployment Strategy

### NPM Package
- Configure package.json with proper entry points
- Include TypeScript definitions in the build
- Set up automated testing and building with CI/CD
- Use semantic versioning for releases

### Documentation
- Create comprehensive README with examples
- Set up documentation website with live demos
- Provide migration guides for updates
- Include troubleshooting section

### Examples and Templates
- Create Next.js starter templates
- Provide CodeSandbox examples
- Include common use case implementations
- Document integration with popular UI libraries
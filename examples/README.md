# FluidCursor Examples

This directory contains comprehensive examples demonstrating how to use the FluidCursor component in various scenarios and configurations.

## FluidCursor Examples

### FluidCursor Component
The FluidCursor component creates a WebGL-based fluid dynamics simulation that responds to mouse movement, creating beautiful smoke-like trails through real-time fluid physics.

#### 1. Basic FluidCursor (`fluid-cursor-basic.tsx`)
The simplest way to use FluidCursor with default settings.

**Features:**
- Zero configuration required
- Full-screen WebGL fluid simulation
- Mouse and touch interaction
- Automatic WebGL fallbacks

**Usage:**
```tsx
import FluidCursor from 'fluid-background/FluidCursor';

export default function MyPage() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <FluidCursor />
      {/* Your content here */}
    </div>
  );
}
```

#### 2. Custom FluidCursor (`fluid-cursor-custom.tsx`)
Demonstrates how to customize the fluid simulation with interactive controls.

**Features:**
- Real-time parameter adjustment
- Interactive control panel
- Preset configurations
- Performance monitoring

**Key Props:**
```tsx
<FluidCursor
  SIM_RESOLUTION={128}
  DYE_RESOLUTION={1440}
  SPLAT_RADIUS={0.2}
  SPLAT_FORCE={6000}
  DENSITY_DISSIPATION={3.5}
  VELOCITY_DISSIPATION={2}
  CURL={3}
  SHADING={true}
  TRANSPARENT={true}
/>
```

#### 3. Performance-Optimized FluidCursor (`fluid-cursor-performance.tsx`)
Shows how to configure FluidCursor for optimal performance on different devices.

**Features:**
- Automatic performance adjustment
- FPS monitoring
- Quality presets (high, medium, low)
- Device-specific optimizations

**Performance Modes:**
- **High:** Desktop/gaming performance (256 sim resolution, 2048 dye resolution)
- **Medium:** Balanced performance (128 sim resolution, 1440 dye resolution)
- **Low:** Mobile/weak GPU optimization (64 sim resolution, 512 dye resolution)

#### 4. Cross-Browser Compatibility Test (`fluid-cursor-compatibility-test.html`)
Comprehensive WebGL compatibility testing across different browsers.

**Features:**
- WebGL 1.0/2.0 support detection
- Extension compatibility testing
- Texture format support verification
- Performance benchmarking
- Browser-specific recommendations

#### 5. Interactive Demo (`fluid-cursor-demo.html`)
Standalone HTML demo with interactive controls.

**Features:**
- Real-time parameter adjustment
- Visual performance monitoring
- Cross-browser testing
- No build process required



## Running the Examples

### Prerequisites
- Node.js 16+ 
- Next.js 13+ (for App Router examples)
- TypeScript (for TypeScript examples)

### Installation
```bash
npm install fluid-cursor
```

### Usage in Next.js
1. Copy the example file to your Next.js project
2. Import and use the component in your pages or components
3. Customize the configuration as needed

### Testing
All examples include comprehensive tests:
```bash
npm test examples/__tests__
```

## Best Practices

### Performance
- Use 'auto' performance mode for most applications
- Test on actual mobile devices, not just browser dev tools
- Monitor frame rate and adjust settings accordingly
- Consider user preferences (reduced motion, battery saver)

### Accessibility
- FluidCursor automatically respects `prefers-reduced-motion`
- Includes proper ARIA labels and screen reader support
- Provides keyboard navigation compatibility
- Offers fallback options for devices without WebGL

### Next.js Integration
- Always use dynamic imports for client-side only components
- Implement proper loading states with Suspense
- Use 'use client' directive for App Router compatibility
- Provide fallback content for better UX

### TypeScript
- Leverage the provided type definitions for better development experience
- Use type guards for runtime validation
- Implement custom hooks for reusable configuration logic
- Take advantage of IntelliSense and compile-time checking

## Troubleshooting

### Common Issues

1. **Hydration Mismatch in Next.js**
   - Use dynamic imports with `ssr: false`
   - Implement proper client-side only rendering

2. **Performance Issues on Mobile**
   - Use 'mobile' or 'battery' performance presets
   - Reduce resolution and frame rate
   - Disable interaction if needed

3. **TypeScript Errors**
   - Ensure proper type imports
   - Use type assertions carefully
   - Implement runtime validation for user inputs

4. **Layout Issues**
   - Set proper z-index values
   - Use `position: relative` on parent containers
   - Ensure proper CSS layering

### Getting Help
- Check the main documentation in the repository
- Review the test files for usage patterns
- Open an issue on GitHub for bugs or feature requests

## Contributing

To add new examples:
1. Create a new `.tsx` file in the examples directory
2. Add corresponding test file in `__tests__/`
3. Update this README with documentation
4. Ensure all tests pass

Example contributions are welcome, especially for:
- Framework integrations (Remix, Gatsby, etc.)
- UI library integrations (Material-UI, Chakra UI, etc.)
- Advanced use cases and patterns
- Performance optimization techniques
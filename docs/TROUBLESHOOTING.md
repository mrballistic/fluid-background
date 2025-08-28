# FluidCursor Troubleshooting Guide

## Common Issues and Solutions

### WebGL Issues

#### "WebGL not supported" Error

**Symptoms:**
- Console error: "WebGL not supported"
- FluidCursor shows no animation
- Component renders but no visual effect occurs

**Causes:**
1. Browser doesn't support WebGL
2. WebGL is disabled in browser settings
3. Hardware acceleration is disabled
4. Graphics drivers are outdated
5. Browser extensions blocking WebGL

**Solutions:**

1. **Check Browser Support:**
   ```javascript
   // Test WebGL support
   const canvas = document.createElement('canvas');
   const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
   console.log('WebGL supported:', !!gl);
   ```

2. **Enable Hardware Acceleration:**
   - **Chrome:** Settings → Advanced → System → "Use hardware acceleration when available"
   - **Firefox:** about:config → layers.acceleration.force-enabled → true
   - **Safari:** Develop → Experimental Features → WebGL 2.0

3. **Update Graphics Drivers:**
   - Visit your graphics card manufacturer's website
   - Download and install the latest drivers

4. **Disable Conflicting Extensions:**
   - Try running in incognito/private mode
   - Disable ad blockers and privacy extensions temporarily

#### WebGL Context Lost

**Symptoms:**
- Animation stops suddenly
- Console error: "WebGL context lost"
- Black screen or frozen animation

**Solutions:**

```tsx
import FluidCursor from 'fluid-cursor';

// The component automatically handles context loss
// No additional code needed - it will attempt to restore
<FluidCursor />
```

**Manual Recovery:**
```javascript
// Listen for context loss events
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  console.log('WebGL context lost');
});

canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored');
  // Component will automatically reinitialize
});
```

### Performance Issues

#### Poor Performance on Mobile

**Symptoms:**
- Low frame rate (< 20 FPS)
- Choppy animation
- Device heating up
- Battery draining quickly

**Solutions:**

1. **Use Mobile-Optimized Settings:**
   ```tsx
   <FluidCursor 
     SIM_RESOLUTION={64}
     DYE_RESOLUTION={512}
     PRESSURE_ITERATIONS={10}
     SHADING={false}
     DENSITY_DISSIPATION={5.0}
     VELOCITY_DISSIPATION={3.0}
   />
   ```

2. **Detect Mobile Devices:**
   ```tsx
   import { useState, useEffect } from 'react';
   import FluidCursor from 'fluid-cursor';
   
   function ResponsiveFluidCursor() {
     const [isMobile, setIsMobile] = useState(false);
     
     useEffect(() => {
       const checkMobile = () => {
         setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
       };
       checkMobile();
       window.addEventListener('resize', checkMobile);
       return () => window.removeEventListener('resize', checkMobile);
     }, []);
     
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

#### High CPU Usage

**Symptoms:**
- Fan spinning loudly
- System slowdown
- High CPU usage in task manager

**Solutions:**

1. **Reduce Simulation Complexity:**
   ```tsx
   <FluidCursor 
     SIM_RESOLUTION={64}        // Lower simulation resolution
     CURL={1}                   // Lower curl = fewer calculations
     PRESSURE_ITERATIONS={5}    // Fewer pressure iterations
     DENSITY_DISSIPATION={5.0}  // Faster dissipation = less computation
     VELOCITY_DISSIPATION={3.0}
   />
   ```

2. **Use Visibility API for Pausing:**
   ```tsx
   import { useState, useEffect } from 'react';
   import FluidCursor from 'fluid-cursor';
   
   function ConditionalFluidCursor() {
     const [isVisible, setIsVisible] = useState(true);
     
     useEffect(() => {
       const handleVisibilityChange = () => {
         setIsVisible(!document.hidden);
       };
       
       document.addEventListener('visibilitychange', handleVisibilityChange);
       return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
     }, []);
     
     return isVisible ? <FluidCursor /> : null;
   }
   ```

### Next.js Integration Issues

#### Hydration Mismatch

**Symptoms:**
- Console warning: "Hydration failed"
- Different content on server vs client
- Flash of different content

**Solutions:**

1. **Use Dynamic Import (Recommended):**
   ```tsx
   import dynamic from 'next/dynamic';
   
   const FluidCursor = dynamic(
     () => import('fluid-cursor'),
     { 
       ssr: false,
       loading: () => null
     }
   );
   ```

2. **Client-Side Only Rendering:**
   ```tsx
   import { useState, useEffect } from 'react';
   import FluidCursor from 'fluid-cursor';
   
   function ClientOnlyFluidCursor() {
     const [mounted, setMounted] = useState(false);
     
     useEffect(() => {
       setMounted(true);
     }, []);
     
     if (!mounted) return null;
     
     return <FluidCursor />;
   }
   ```

#### App Router Issues

**Symptoms:**
- Component not rendering in app directory
- TypeScript errors with app router

**Solutions:**

1. **Use Client Component:**
   ```tsx
   'use client';
   
   import FluidCursor from 'fluid-cursor';
   
   export default function ClientFluidCursor() {
     return <FluidCursor />;
   }
   ```

2. **Server Component Wrapper:**
   ```tsx
   // app/components/FluidCursorWrapper.tsx
   import dynamic from 'next/dynamic';
   
   const FluidCursor = dynamic(
     () => import('fluid-cursor'),
     { ssr: false }
   );
   
   export default function FluidCursorWrapper() {
     return <FluidCursor />;
   }
   ```

### Styling Issues

#### FluidCursor Not Visible

**Symptoms:**
- No visual effect
- Component renders but no cursor trail appears

**Solutions:**

1. **Ensure Container Height:**
   ```css
   html, body {
     height: 100%;
     margin: 0;
   }
   
   #__next {
     height: 100%;
   }
   ```

2. **Check Background Color:**
   ```tsx
   <FluidCursor 
     BACK_COLOR={{ r: 0.1, g: 0.1, b: 0.1 }}  // Not pure black
     TRANSPARENT={true}
   />
   ```

3. **Increase Intensity:**
   ```tsx
   <FluidCursor 
     SPLAT_FORCE={8000}
     SPLAT_RADIUS={0.3}
     DENSITY_DISSIPATION={2.0}  // Slower fade
   />
   ```

#### Content Not Clickable

**Symptoms:**
- Cannot click buttons or links
- Mouse events not working on content

**Solutions:**

1. **FluidCursor automatically sets pointer-events: none:**
   ```tsx
   // FluidCursor canvas doesn't block interactions by default
   <FluidCursor />
   <main>
     Content here (clickable)
   </main>
   ```

2. **Proper Layering:**
   ```css
   .fluid-cursor-canvas {
     position: fixed;
     top: 0;
     left: 0;
     width: 100%;
     height: 100%;
     pointer-events: none;
   }
   
   .content {
     position: relative;
     z-index: 1;
   }
   ```

### Build and Deployment Issues

#### Module Not Found

**Symptoms:**
- Import error: "Cannot resolve 'fluid-cursor'"
- Build fails with module resolution error

**Solutions:**

1. **Check Installation:**
   ```bash
   npm list fluid-cursor
   npm install fluid-cursor
   ```

2. **Clear Cache:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Import Syntax:**
   ```tsx
   // Correct
   import FluidCursor from 'fluid-cursor';
   
   // Incorrect
   import { FluidCursor } from 'fluid-cursor';
   ```

#### TypeScript Errors

**Symptoms:**
- Type errors during build
- Missing type definitions

**Solutions:**

1. **Update TypeScript:**
   ```bash
   npm install typescript@latest
   ```

2. **Check tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true,
       "allowSyntheticDefaultImports": true
     }
   }
   ```

3. **Explicit Type Import:**
   ```tsx
   import type { FluidCursorProps } from 'fluid-cursor';
   import FluidCursor from 'fluid-cursor';
   ```

## Debug Mode

Check browser console for WebGL and performance information:

```javascript
// Check WebGL context in browser console
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
console.log('WebGL supported:', !!gl);
if (gl) {
  console.log('WebGL version:', gl.getParameter(gl.VERSION));
  console.log('Renderer:', gl.getParameter(gl.RENDERER));
}
```

## Performance Monitoring

Monitor FluidCursor performance manually:

```tsx
import { useEffect, useRef } from 'react';
import FluidCursor from 'fluid-cursor';

function PerformanceMonitor() {
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const fps = (frameCount.current * 1000) / (now - lastTime.current);
      console.log('Estimated FPS:', fps.toFixed(1));
      frameCount.current = 0;
      lastTime.current = now;
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const countFrames = () => {
      frameCount.current++;
      requestAnimationFrame(countFrames);
    };
    countFrames();
  }, []);
  
  return <FluidCursor />;
}
```

## Browser-Specific Issues

### Safari

**Issue:** WebGL context creation fails
**Solution:** Enable WebGL in Safari preferences

**Issue:** Performance is poor
**Solution:** Use lower resolution settings

```tsx
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

<FluidBackground 
  performance={{
    resolution: isSafari ? 'low' : 'medium'
  }}
/>
```

### Firefox

**Issue:** Shader compilation errors
**Solution:** Use WebGL 1.0 fallback

**Issue:** Memory leaks over time
**Solution:** Enable automatic cleanup

```tsx
<FluidBackground 
  performance={{
    pauseOnHidden: true  // Helps with memory management
  }}
/>
```

### Chrome

**Issue:** Hardware acceleration disabled
**Solution:** Enable in chrome://settings/system

**Issue:** Extension conflicts
**Solution:** Test in incognito mode

## Getting Help

If you're still experiencing issues:

1. **Check Browser Console** for error messages
2. **Test in Different Browsers** to isolate the issue
3. **Try Minimal Configuration** to identify problematic settings
4. **Check Device Capabilities** with WebGL report tools
5. **Create Minimal Reproduction** for bug reports

**Minimal Test Case:**
```tsx
import FluidCursor from 'fluid-cursor';

export default function MinimalTest() {
  return (
    <div style={{ height: '100vh' }}>
      <FluidCursor />
      <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
        <h1>Test Content</h1>
        <p>Move your cursor to see the fluid effect</p>
      </div>
    </div>
  );
}
```
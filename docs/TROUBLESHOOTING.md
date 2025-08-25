# Troubleshooting Guide

## Common Issues and Solutions

### WebGL Issues

#### "WebGL not supported" Error

**Symptoms:**
- Console error: "WebGL not supported"
- Background shows static gradient instead of fluid animation
- Component renders but no animation occurs

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
import { FluidBackground } from 'fluid-background';

// The component automatically handles context loss
// No additional code needed - it will attempt to restore
<FluidBackground />
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
   <FluidBackground 
     performance={{
       resolution: 'low',
       frameRate: 24
     }}
     physics={{
       viscosity: 0.6,
       curl: 15,
       splatForce: 3000
     }}
   />
   ```

2. **Detect Mobile Devices:**
   ```tsx
   import { detectMobileDevice } from 'fluid-background';
   
   const isMobile = detectMobileDevice();
   
   <FluidBackground 
     performance={{
       resolution: isMobile ? 'low' : 'medium',
       frameRate: isMobile ? 24 : 60
     }}
   />
   ```

3. **Use Performance Monitoring:**
   ```tsx
   import { usePerformance } from 'fluid-background';
   
   function AdaptiveFluid() {
     const { fps, shouldOptimize } = usePerformance();
     
     return (
       <FluidBackground 
         performance={{
           resolution: shouldOptimize ? 'low' : 'medium',
           frameRate: fps < 30 ? 24 : 60
         }}
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
   <FluidBackground 
     physics={{
       viscosity: 0.8,    // Higher viscosity = less computation
       curl: 10,          // Lower curl = fewer calculations
       iterations: 1      // Fewer pressure iterations
     }}
     performance={{
       frameRate: 30      // Lower frame rate
     }}
   />
   ```

2. **Enable Automatic Pausing:**
   ```tsx
   <FluidBackground 
     performance={{
       pauseOnHidden: true  // Pause when tab is hidden
     }}
   />
   ```

3. **Use Visibility API:**
   ```tsx
   import { useState, useEffect } from 'react';
   
   function ConditionalFluid() {
     const [isVisible, setIsVisible] = useState(true);
     
     useEffect(() => {
       const handleVisibilityChange = () => {
         setIsVisible(!document.hidden);
       };
       
       document.addEventListener('visibilitychange', handleVisibilityChange);
       return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
     }, []);
     
     return isVisible ? <FluidBackground /> : null;
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
   
   const FluidBackground = dynamic(
     () => import('fluid-background').then(mod => mod.FluidBackground),
     { 
       ssr: false,
       loading: () => <div style={{ 
         position: 'fixed', 
         inset: 0, 
         background: 'linear-gradient(45deg, #000, #111)' 
       }} />
     }
   );
   ```

2. **Client-Side Only Rendering:**
   ```tsx
   import { useState, useEffect } from 'react';
   import { FluidBackground } from 'fluid-background';
   
   function ClientOnlyFluid() {
     const [mounted, setMounted] = useState(false);
     
     useEffect(() => {
       setMounted(true);
     }, []);
     
     if (!mounted) return null;
     
     return <FluidBackground />;
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
   
   import { FluidBackground } from 'fluid-background';
   
   export default function ClientFluid() {
     return <FluidBackground />;
   }
   ```

2. **Server Component Wrapper:**
   ```tsx
   // app/components/FluidWrapper.tsx
   import dynamic from 'next/dynamic';
   
   const FluidBackground = dynamic(
     () => import('fluid-background').then(mod => mod.FluidBackground),
     { ssr: false }
   );
   
   export default function FluidWrapper() {
     return <FluidBackground />;
   }
   ```

### Styling Issues

#### Background Not Visible

**Symptoms:**
- No visual effect
- Component renders but no background appears

**Solutions:**

1. **Check Z-Index:**
   ```tsx
   <div>
     <FluidBackground zIndex={-1} />
     <main style={{ position: 'relative', zIndex: 1 }}>
       Content here
     </main>
   </div>
   ```

2. **Ensure Container Height:**
   ```css
   html, body {
     height: 100%;
     margin: 0;
   }
   
   #__next {
     height: 100%;
   }
   ```

3. **Check Opacity:**
   ```tsx
   <FluidBackground 
     style={{ opacity: 1 }}  // Ensure it's visible
     colors={{
       background: { r: 0.1, g: 0.1, b: 0.1 }  // Not pure black
     }}
   />
   ```

#### Content Not Clickable

**Symptoms:**
- Cannot click buttons or links
- Mouse events not working on content

**Solutions:**

1. **Fix Pointer Events:**
   ```tsx
   <FluidBackground 
     style={{ pointerEvents: 'none' }}
   />
   <main style={{ 
     position: 'relative', 
     zIndex: 1,
     pointerEvents: 'auto'
   }}>
     Content here
   </main>
   ```

2. **Proper Layering:**
   ```css
   .fluid-background {
     position: fixed;
     top: 0;
     left: 0;
     width: 100%;
     height: 100%;
     z-index: -1;
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
- Import error: "Cannot resolve 'fluid-background'"
- Build fails with module resolution error

**Solutions:**

1. **Check Installation:**
   ```bash
   npm list fluid-background
   npm install fluid-background
   ```

2. **Clear Cache:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Import Syntax:**
   ```tsx
   // Correct
   import { FluidBackground } from 'fluid-background';
   
   // Incorrect
   import FluidBackground from 'fluid-background';
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
   import type { FluidBackgroundProps } from 'fluid-background';
   import { FluidBackground } from 'fluid-background';
   ```

## Debug Mode

Enable debug logging to get more information about issues:

```bash
# Development
DEBUG=fluid-background npm run dev

# Production
DEBUG=fluid-background npm start
```

**Debug Output Example:**
```
fluid-background WebGL context created successfully
fluid-background Shaders compiled: 12/12
fluid-background Framebuffers initialized: 6
fluid-background Performance: 60 FPS, resolution: medium
fluid-background Auto-optimization: disabled (good performance)
```

## Performance Monitoring

Use the built-in performance monitoring to identify issues:

```tsx
import { usePerformance } from 'fluid-background';

function PerformanceMonitor() {
  const { fps, getMetrics } = usePerformance();
  
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = getMetrics();
      console.log('Performance:', {
        fps: metrics.fps,
        averageFps: metrics.averageFps,
        droppedFrames: metrics.droppedFrames
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [getMetrics]);
  
  return <FluidBackground />;
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
import { FluidBackground } from 'fluid-background';

export default function MinimalTest() {
  return (
    <div style={{ height: '100vh' }}>
      <FluidBackground />
      <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
        <h1>Test Content</h1>
      </div>
    </div>
  );
}
```
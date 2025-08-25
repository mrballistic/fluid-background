# Performance Guide

## Understanding Performance

The fluid simulation is computationally intensive, involving real-time WebGL rendering and physics calculations. This guide helps you optimize performance for different devices and use cases.

## Performance Factors

### Hardware Factors
- **GPU Power**: Dedicated GPUs perform much better than integrated graphics
- **Memory Bandwidth**: Affects texture operations and framebuffer swapping
- **WebGL Version**: WebGL 2.0 provides better performance than WebGL 1.0
- **Device Type**: Desktop > Tablet > Mobile phone

### Software Factors
- **Resolution**: Higher resolution = more pixels to compute
- **Physics Complexity**: More iterations and effects = more computation
- **Frame Rate**: Higher FPS = more frequent calculations
- **Browser**: Chrome/Edge generally perform best, Safari can be slower

## Optimization Strategies

### 1. Resolution Scaling

The most impactful optimization is adjusting the simulation resolution:

```tsx
// Automatic resolution (recommended)
<FluidBackground 
  performance={{ resolution: 'auto' }}
/>

// Manual resolution for specific devices
const getResolution = () => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency <= 2;
  
  if (isMobile || isLowEnd) return 'low';
  if (window.innerWidth > 1920) return 'high';
  return 'medium';
};

<FluidBackground 
  performance={{ resolution: getResolution() }}
/>
```

**Resolution Impact:**
- `low` (128x128): ~4x faster than medium, suitable for mobile
- `medium` (256x256): Balanced performance and quality
- `high` (512x512): Best quality, requires powerful GPU

### 2. Frame Rate Management

Reduce frame rate for better battery life and thermal management:

```tsx
// Adaptive frame rate based on device
const getFrameRate = () => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isBatteryLow = 'getBattery' in navigator && 
    (await navigator.getBattery()).level < 0.2;
  
  if (isBatteryLow) return 15;
  if (isMobile) return 30;
  return 60;
};

<FluidBackground 
  performance={{ 
    frameRate: getFrameRate(),
    pauseOnHidden: true  // Pause when tab is hidden
  }}
/>
```

### 3. Physics Optimization

Simplify physics calculations for better performance:

```tsx
// Performance-optimized physics
<FluidBackground 
  physics={{
    viscosity: 0.6,      // Higher = less turbulence = fewer calculations
    curl: 20,            // Lower = less vorticity computation
    iterations: 1,       // Fewer pressure solver iterations
    splatForce: 4000     // Moderate force to reduce extreme calculations
  }}
/>

// Quality-focused physics (for powerful devices)
<FluidBackground 
  physics={{
    viscosity: 0.2,      // More fluid behavior
    curl: 40,            // More swirls and detail
    iterations: 3,       // More accurate pressure solving
    splatForce: 8000     // Stronger interactions
  }}
/>
```

### 4. Automatic Performance Scaling

Implement dynamic quality adjustment based on performance:

```tsx
import { useState, useEffect } from 'react';
import { FluidBackground } from 'fluid-background';

function AdaptiveFluidBackground() {
  const [config, setConfig] = useState({
    performance: { resolution: 'medium' as const, frameRate: 60 },
    physics: { viscosity: 0.3, curl: 30 }
  });
  
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    averageFps: 60,
    frameTime: 16
  });
  
  useEffect(() => {
    // Adjust quality based on performance
    if (performanceMetrics.averageFps < 30) {
      setConfig(prev => ({
        performance: { 
          resolution: 'low', 
          frameRate: 30 
        },
        physics: { 
          viscosity: 0.6, 
          curl: 15 
        }
      }));
    } else if (performanceMetrics.averageFps > 55) {
      setConfig(prev => ({
        performance: { 
          resolution: 'high', 
          frameRate: 60 
        },
        physics: { 
          viscosity: 0.2, 
          curl: 40 
        }
      }));
    }
  }, [performanceMetrics.averageFps]);
  
  return (
    <FluidBackground 
      {...config}
      onPerformanceUpdate={setPerformanceMetrics}
    />
  );
}
```

## Device-Specific Optimizations

### Mobile Devices

```tsx
const mobileConfig = {
  performance: {
    resolution: 'low',
    frameRate: 24,
    pauseOnHidden: true
  },
  physics: {
    viscosity: 0.7,
    curl: 15,
    splatForce: 3000,
    iterations: 1
  },
  interaction: {
    intensity: 0.7  // Reduce interaction strength
  }
};

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

<FluidBackground {...(isMobile ? mobileConfig : {})} />
```

### Tablets

```tsx
const tabletConfig = {
  performance: {
    resolution: 'medium',
    frameRate: 30
  },
  physics: {
    viscosity: 0.5,
    curl: 25,
    splatForce: 4500
  }
};

const isTablet = /iPad|Android/i.test(navigator.userAgent) && 
  window.innerWidth >= 768;

<FluidBackground {...(isTablet ? tabletConfig : {})} />
```

### Desktop

```tsx
const desktopConfig = {
  performance: {
    resolution: 'high',
    frameRate: 60
  },
  physics: {
    viscosity: 0.3,
    curl: 35,
    splatForce: 6000,
    iterations: 2
  }
};

const isDesktop = !(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

<FluidBackground {...(isDesktop ? desktopConfig : {})} />
```

## Performance Monitoring

### Built-in Metrics

```tsx
import { useState } from 'react';
import { FluidBackground } from 'fluid-background';

function MonitoredFluid() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    averageFps: 0,
    frameTime: 0,
    droppedFrames: 0
  });
  
  return (
    <>
      <FluidBackground 
        onPerformanceUpdate={setMetrics}
      />
      
      {/* Performance overlay */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div>FPS: {metrics.fps.toFixed(1)}</div>
        <div>Avg: {metrics.averageFps.toFixed(1)}</div>
        <div>Frame: {metrics.frameTime.toFixed(1)}ms</div>
        <div>Dropped: {metrics.droppedFrames}</div>
      </div>
    </>
  );
}
```

### Custom Performance Tracking

```tsx
import { useEffect, useRef } from 'react';

function usePerformanceTracker() {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fps = useRef(60);
  
  useEffect(() => {
    const trackFrame = () => {
      const now = performance.now();
      const delta = now - lastTime.current;
      
      if (delta >= 1000) {
        fps.current = (frameCount.current * 1000) / delta;
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      frameCount.current++;
      requestAnimationFrame(trackFrame);
    };
    
    trackFrame();
  }, []);
  
  return fps.current;
}
```

## Battery Optimization

### Battery-Aware Configuration

```tsx
import { useState, useEffect } from 'react';

function useBatteryStatus() {
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [isCharging, setIsCharging] = useState(true);
  
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level);
        });
        
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }
  }, []);
  
  return { batteryLevel, isCharging };
}

function BatteryAwareFluid() {
  const { batteryLevel, isCharging } = useBatteryStatus();
  
  const getConfig = () => {
    if (!isCharging && batteryLevel < 0.2) {
      // Ultra low power mode
      return {
        performance: { resolution: 'low', frameRate: 15 },
        physics: { viscosity: 0.8, curl: 10 }
      };
    } else if (!isCharging && batteryLevel < 0.5) {
      // Power saving mode
      return {
        performance: { resolution: 'low', frameRate: 24 },
        physics: { viscosity: 0.6, curl: 20 }
      };
    }
    
    // Normal mode
    return {
      performance: { resolution: 'auto', frameRate: 60 },
      physics: { viscosity: 0.3, curl: 30 }
    };
  };
  
  return <FluidBackground {...getConfig()} />;
}
```

## Memory Management

### Preventing Memory Leaks

```tsx
import { useEffect, useRef } from 'react';
import { FluidBackground } from 'fluid-background';

function ManagedFluid() {
  const fluidRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      // Component automatically handles cleanup
      // but you can force garbage collection
      if (window.gc) {
        window.gc();
      }
    };
  }, []);
  
  return (
    <div ref={fluidRef}>
      <FluidBackground 
        performance={{
          pauseOnHidden: true  // Helps with memory management
        }}
      />
    </div>
  );
}
```

### Memory Usage Monitoring

```tsx
function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState({
    used: 0,
    total: 0,
    limit: 0
  });
  
  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: memory.usedJSHeapSize / 1024 / 1024, // MB
          total: memory.totalJSHeapSize / 1024 / 1024,
          limit: memory.jsHeapSizeLimit / 1024 / 1024
        });
      }
    };
    
    const interval = setInterval(updateMemory, 5000);
    updateMemory();
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
}
```

## Thermal Management

### CPU Temperature Awareness

```tsx
function useThermalState() {
  const [thermalState, setThermalState] = useState('nominal');
  
  useEffect(() => {
    if ('deviceMemory' in navigator && 'hardwareConcurrency' in navigator) {
      // Estimate thermal state based on device capabilities
      const deviceMemory = (navigator as any).deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 4;
      
      if (deviceMemory < 4 || cores < 4) {
        setThermalState('restricted');
      }
    }
    
    // Listen for thermal state changes (if available)
    if ('thermal' in navigator) {
      (navigator as any).thermal.addEventListener('change', (event: any) => {
        setThermalState(event.state);
      });
    }
  }, []);
  
  return thermalState;
}

function ThermalAwareFluid() {
  const thermalState = useThermalState();
  
  const getConfig = () => {
    switch (thermalState) {
      case 'critical':
        return {
          performance: { resolution: 'low', frameRate: 10 },
          physics: { viscosity: 0.9, curl: 5 }
        };
      case 'serious':
        return {
          performance: { resolution: 'low', frameRate: 20 },
          physics: { viscosity: 0.7, curl: 15 }
        };
      case 'fair':
        return {
          performance: { resolution: 'medium', frameRate: 30 },
          physics: { viscosity: 0.5, curl: 25 }
        };
      default:
        return {
          performance: { resolution: 'auto', frameRate: 60 },
          physics: { viscosity: 0.3, curl: 30 }
        };
    }
  };
  
  return <FluidBackground {...getConfig()} />;
}
```

## Performance Best Practices

### 1. Use Auto Resolution
```tsx
// Let the component choose the best resolution
<FluidBackground performance={{ resolution: 'auto' }} />
```

### 2. Enable Pause on Hidden
```tsx
// Save resources when tab is not visible
<FluidBackground performance={{ pauseOnHidden: true }} />
```

### 3. Optimize for Mobile
```tsx
// Detect mobile and adjust accordingly
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

<FluidBackground 
  performance={{
    resolution: isMobile ? 'low' : 'medium',
    frameRate: isMobile ? 24 : 60
  }}
/>
```

### 4. Monitor Performance
```tsx
// Track performance and adjust dynamically
<FluidBackground 
  onPerformanceUpdate={(metrics) => {
    if (metrics.averageFps < 30) {
      // Reduce quality
    }
  }}
/>
```

### 5. Respect User Preferences
```tsx
// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

{!prefersReducedMotion && <FluidBackground />}
```

## Debugging Performance Issues

### 1. Enable Performance Overlay
```tsx
<FluidBackground 
  debug={true}  // Shows FPS and performance metrics
/>
```

### 2. Use Browser DevTools
- **Chrome**: Performance tab, WebGL inspector extension
- **Firefox**: Performance tools, about:config WebGL settings
- **Safari**: Web Inspector, WebGL debugging

### 3. Test on Target Devices
- Use real devices, not just desktop browser simulation
- Test on low-end devices to ensure minimum performance
- Monitor battery usage and thermal behavior

### 4. Profile WebGL Usage
```javascript
// Enable WebGL debugging
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2', { 
  antialias: false,
  alpha: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false
});
```

## Performance Checklist

- [ ] Use `resolution: 'auto'` for automatic optimization
- [ ] Enable `pauseOnHidden: true` for better resource management
- [ ] Test on mobile devices with appropriate settings
- [ ] Monitor FPS and adjust quality dynamically
- [ ] Respect `prefers-reduced-motion` user preference
- [ ] Use appropriate physics settings for target devices
- [ ] Implement battery-aware optimizations
- [ ] Test memory usage over extended periods
- [ ] Profile performance on target browsers
- [ ] Consider thermal management for intensive usage
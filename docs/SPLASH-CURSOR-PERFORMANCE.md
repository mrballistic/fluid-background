# SplashCursor Performance Guide

This guide provides comprehensive information on optimizing SplashCursor performance for different devices and use cases.

## Table of Contents

- [Performance Overview](#performance-overview)
- [Automatic Quality Management](#automatic-quality-management)
- [Manual Optimization](#manual-optimization)
- [Device-Specific Optimization](#device-specific-optimization)
- [Performance Monitoring](#performance-monitoring)
- [Troubleshooting Performance Issues](#troubleshooting-performance-issues)
- [Best Practices](#best-practices)

## Performance Overview

SplashCursor is designed to provide smooth, 60fps performance on modern devices while gracefully degrading on older hardware. The component uses several optimization techniques:

### Core Optimizations

1. **Particle Pooling**: Reuses particle objects to minimize garbage collection
2. **Spatial Partitioning**: Optimizes collision detection and rendering
3. **Adaptive Quality**: Automatically adjusts settings based on performance
4. **Dirty Rectangle Tracking**: Only redraws changed areas when possible
5. **Frame Rate Limiting**: Prevents excessive CPU usage

### Performance Factors

The main factors affecting performance are:

- **Particle Count**: More particles = higher CPU usage
- **Canvas Size**: Larger canvas = more pixels to process
- **Metaball Quality**: Higher quality = more complex calculations
- **Device Capabilities**: CPU speed, memory, graphics acceleration

## Automatic Quality Management

SplashCursor includes built-in adaptive quality management that automatically adjusts settings based on real-time performance.

### Quality Levels

| Level | Particles | Metaball Quality | Blur | Skip Pixels |
|-------|-----------|------------------|------|-------------|
| **High** | 100% | Full | 2px | 1 |
| **Medium** | 70% | Optimized | 1px | 2 |
| **Low** | 40% | Simplified | 0px | 3 |
| **Minimal** | 20% | Basic | 0px | 4 |

### Automatic Adjustment Triggers

```typescript
// Quality is automatically reduced when:
- FPS drops below 60% of target (e.g., 36fps for 60fps target)
- Frame time exceeds 20ms consistently
- Memory usage increases significantly

// Quality is increased when:
- FPS exceeds 95% of target consistently
- System has been stable for 2+ seconds
- No performance warnings detected
```

### Monitoring Quality Changes

```tsx
import { useSplashCursor } from 'fluid-react';

function QualityMonitor() {
  const { fps, particleCount } = useSplashCursor();
  
  useEffect(() => {
    console.log(`Performance: ${fps}fps, ${particleCount} particles`);
  }, [fps, particleCount]);
  
  return null;
}
```

## Manual Optimization

### Performance Presets

#### Mobile Preset
```tsx
<SplashCursor 
  particleCount={50}
  targetFPS={30}
  intensity={0.5}
  drag={0.95}
  pauseOnHidden={true}
/>
```

#### Desktop Preset
```tsx
<SplashCursor 
  particleCount={150}
  targetFPS={60}
  intensity={0.8}
  drag={0.997}
  pauseOnHidden={false}
/>
```

#### High-End Preset
```tsx
<SplashCursor 
  particleCount={300}
  targetFPS={60}
  intensity={1.0}
  drag={0.998}
  colors={{ mode: 'rainbow', cycleSpeed: 2.0 }}
/>
```

#### Battery Saver Preset
```tsx
<SplashCursor 
  particleCount={25}
  targetFPS={20}
  intensity={0.3}
  drag={0.9}
  pauseOnHidden={true}
/>
```

### Configuration Guidelines

#### Particle Count Optimization

```tsx
// Choose particle count based on use case:

// Subtle background effect
<SplashCursor particleCount={50} />

// Standard interactive effect
<SplashCursor particleCount={150} />

// Dramatic showcase effect
<SplashCursor particleCount={300} />

// Performance-critical applications
<SplashCursor particleCount={25} />
```

#### Frame Rate Targeting

```tsx
// Match your application's needs:

// Smooth desktop experience
<SplashCursor targetFPS={60} />

// Balanced mobile experience
<SplashCursor targetFPS={30} />

// Battery-conscious mobile
<SplashCursor targetFPS={24} />

// High-refresh displays
<SplashCursor targetFPS={120} />
```

#### Physics Optimization

```tsx
// Optimize physics for performance:

// Fast-fading particles (less computation)
<SplashCursor drag={0.9} />

// Long-lasting trails (more computation)
<SplashCursor drag={0.999} />

// No gravity (simpler physics)
<SplashCursor gravity={0} />

// Disabled bouncing (fewer calculations)
<SplashCursor bounceEnabled={false} />
```

## Device-Specific Optimization

### Mobile Devices

#### Detection and Optimization
```tsx
import React, { useState, useEffect } from 'react';
import { SplashCursor } from 'fluid-react';

function MobileOptimizedSplash() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isLowEnd: false,
    batteryLevel: 1,
    isCharging: true
  });
  
  useEffect(() => {
    // Detect mobile device
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || window.innerWidth < 768;
    
    // Detect low-end device (simplified heuristic)
    const isLowEnd = navigator.hardwareConcurrency < 4 || navigator.deviceMemory < 4;
    
    setDeviceInfo(prev => ({ ...prev, isMobile, isLowEnd }));
    
    // Battery API (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setDeviceInfo(prev => ({
          ...prev,
          batteryLevel: battery.level,
          isCharging: battery.charging
        }));
        
        battery.addEventListener('levelchange', () => {
          setDeviceInfo(prev => ({ ...prev, batteryLevel: battery.level }));
        });
      });
    }
  }, []);
  
  // Calculate optimal settings
  const getOptimalSettings = () => {
    const { isMobile, isLowEnd, batteryLevel, isCharging } = deviceInfo;
    
    if (isLowEnd || (batteryLevel < 0.2 && !isCharging)) {
      return {
        particleCount: 25,
        targetFPS: 20,
        intensity: 0.3,
        drag: 0.9
      };
    }
    
    if (isMobile) {
      return {
        particleCount: 75,
        targetFPS: 30,
        intensity: 0.6,
        drag: 0.95
      };
    }
    
    return {
      particleCount: 150,
      targetFPS: 60,
      intensity: 0.8,
      drag: 0.997
    };
  };
  
  return <SplashCursor {...getOptimalSettings()} pauseOnHidden={true} />;
}
```

### Desktop Optimization

#### High-Performance Desktop
```tsx
function DesktopOptimizedSplash() {
  const [capabilities, setCapabilities] = useState({
    cores: navigator.hardwareConcurrency || 4,
    memory: (navigator as any).deviceMemory || 4,
    connection: (navigator as any).connection?.effectiveType || '4g'
  });
  
  const getDesktopSettings = () => {
    const { cores, memory } = capabilities;
    
    // High-end desktop
    if (cores >= 8 && memory >= 8) {
      return {
        particleCount: 300,
        targetFPS: 60,
        intensity: 1.0,
        colors: { mode: 'rainbow', cycleSpeed: 2.0 }
      };
    }
    
    // Mid-range desktop
    if (cores >= 4 && memory >= 4) {
      return {
        particleCount: 200,
        targetFPS: 60,
        intensity: 0.8,
        colors: { mode: 'rainbow' }
      };
    }
    
    // Low-end desktop
    return {
      particleCount: 100,
      targetFPS: 45,
      intensity: 0.6
    };
  };
  
  return <SplashCursor {...getDesktopSettings()} />;
}
```

### Tablet Optimization

```tsx
function TabletOptimizedSplash() {
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTabletSize = (width >= 768 && width <= 1024) || (height >= 768 && height <= 1024);
      const hasTouch = 'ontouchstart' in window;
      
      setIsTablet(isTabletSize && hasTouch);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);
  
  return (
    <SplashCursor 
      particleCount={isTablet ? 100 : 150}
      targetFPS={isTablet ? 45 : 60}
      intensity={isTablet ? 0.7 : 0.8}
      pauseOnHidden={true}
    />
  );
}
```

## Performance Monitoring

### Real-Time Performance Tracking

```tsx
import React, { useState, useEffect } from 'react';
import { useSplashCursor } from 'fluid-react';

function PerformanceTracker() {
  const { fps, particleCount, updateConfig } = useSplashCursor();
  const [performanceHistory, setPerformanceHistory] = useState<number[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  useEffect(() => {
    if (fps > 0) {
      setPerformanceHistory(prev => [...prev.slice(-29), fps]); // Keep last 30 readings
      
      // Performance warnings
      const newWarnings: string[] = [];
      
      if (fps < 20) {
        newWarnings.push('Critical: FPS below 20');
      } else if (fps < 30) {
        newWarnings.push('Warning: FPS below 30');
      }
      
      if (particleCount > 200 && fps < 45) {
        newWarnings.push('Too many particles for current performance');
      }
      
      setWarnings(newWarnings);
      
      // Auto-optimization
      if (fps < 25 && particleCount > 50) {
        updateConfig({ particleCount: Math.max(25, particleCount - 25) });
      }
    }
  }, [fps, particleCount, updateConfig]);
  
  const averageFPS = performanceHistory.length > 0 
    ? performanceHistory.reduce((a, b) => a + b, 0) / performanceHistory.length 
    : 0;
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      left: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 10000,
      minWidth: '200px'
    }}>
      <h4>Performance Monitor</h4>
      <div>Current FPS: {fps.toFixed(1)}</div>
      <div>Average FPS: {averageFPS.toFixed(1)}</div>
      <div>Particles: {particleCount}</div>
      <div>Status: {fps >= 55 ? '✅ Excellent' : fps >= 45 ? '⚡ Good' : fps >= 30 ? '⚠️ Fair' : '❌ Poor'}</div>
      
      {warnings.length > 0 && (
        <div style={{ marginTop: '10px', color: '#ff6b6b' }}>
          <strong>Warnings:</strong>
          {warnings.map((warning, i) => (
            <div key={i}>• {warning}</div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '10px', height: '30px', background: '#333', position: 'relative' }}>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}>FPS History</div>
        <svg width="170" height="20" style={{ background: '#222' }}>
          {performanceHistory.map((fps, i) => (
            <rect
              key={i}
              x={i * 5.67}
              y={20 - (fps / 60) * 20}
              width="4"
              height={(fps / 60) * 20}
              fill={fps >= 50 ? '#4CAF50' : fps >= 30 ? '#FFC107' : '#F44336'}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
```

### Vanilla JavaScript Monitoring

```javascript
const splashCursor = createSplashCursor({
  intensity: 0.8,
  particleCount: 150
});

// Performance monitoring
let performanceLog = [];
let lastLogTime = 0;

splashCursor.onPerformanceUpdate((metrics) => {
  const now = Date.now();
  
  // Log every second
  if (now - lastLogTime >= 1000) {
    performanceLog.push({
      timestamp: now,
      fps: metrics.fps,
      particles: metrics.particleCount,
      frameTime: metrics.frameTime
    });
    
    // Keep only last 60 seconds
    performanceLog = performanceLog.slice(-60);
    
    // Auto-adjust if performance is poor
    if (metrics.fps < 25) {
      const currentConfig = splashCursor.getConfig();
      splashCursor.updateConfig({
        particleCount: Math.max(25, currentConfig.particleCount - 25)
      });
      console.log('Auto-reduced particle count due to low FPS');
    }
    
    lastLogTime = now;
  }
});

// Export performance data
function exportPerformanceData() {
  const csv = performanceLog.map(entry => 
    `${entry.timestamp},${entry.fps},${entry.particles},${entry.frameTime}`
  ).join('\n');
  
  console.log('Performance Data (timestamp,fps,particles,frameTime):');
  console.log(csv);
}

splashCursor.start();
```

## Troubleshooting Performance Issues

### Common Performance Problems

#### Problem: Low FPS (< 30)

**Symptoms:**
- Choppy animation
- Delayed cursor response
- Browser feels sluggish

**Solutions:**
```tsx
// Immediate fixes
<SplashCursor 
  particleCount={50}        // Reduce particles
  targetFPS={30}           // Lower target
  drag={0.95}              // Faster particle decay
  intensity={0.5}          // Reduce visual complexity
/>

// Progressive optimization
const optimizeForLowFPS = (currentFPS: number) => {
  if (currentFPS < 15) {
    return { particleCount: 25, intensity: 0.3, drag: 0.9 };
  } else if (currentFPS < 25) {
    return { particleCount: 50, intensity: 0.5, drag: 0.95 };
  } else if (currentFPS < 35) {
    return { particleCount: 75, intensity: 0.6, drag: 0.97 };
  }
  return null; // No changes needed
};
```

#### Problem: High Memory Usage

**Symptoms:**
- Browser becomes slow over time
- Tab crashes after extended use
- System memory warnings

**Solutions:**
```tsx
// Memory-conscious settings
<SplashCursor 
  particleCount={75}       // Limit particle count
  pauseOnHidden={true}     // Pause when not visible
  drag={0.95}              // Faster cleanup
/>

// Periodic cleanup
useEffect(() => {
  const interval = setInterval(() => {
    // Reset the system every 5 minutes
    reset();
  }, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}, [reset]);
```

#### Problem: Inconsistent Performance

**Symptoms:**
- FPS varies wildly
- Stuttering during interaction
- Performance degrades over time

**Solutions:**
```tsx
// Stabilize performance
<SplashCursor 
  targetFPS={30}           // Conservative target
  particleCount={100}      // Moderate particle count
  pauseOnHidden={true}     // Reduce background load
/>

// Implement performance stabilization
const useStablePerformance = () => {
  const { fps, updateConfig } = useSplashCursor();
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  
  useEffect(() => {
    if (fps > 0) {
      setFpsHistory(prev => [...prev.slice(-9), fps]); // Last 10 readings
      
      if (fpsHistory.length >= 10) {
        const variance = calculateVariance(fpsHistory);
        
        // If performance is too variable, reduce complexity
        if (variance > 100) {
          updateConfig({ particleCount: 75, intensity: 0.6 });
        }
      }
    }
  }, [fps, fpsHistory, updateConfig]);
};
```

#### Problem: Mobile Performance Issues

**Symptoms:**
- Poor performance on mobile devices
- Battery drain
- Overheating

**Solutions:**
```tsx
// Mobile-optimized configuration
const MobileOptimized = () => {
  const [isMobile] = useState(() => 
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
  
  if (!isMobile) return <SplashCursor />;
  
  return (
    <SplashCursor 
      particleCount={40}
      targetFPS={24}
      intensity={0.4}
      drag={0.92}
      pauseOnHidden={true}
      gravity={0}              // Simplify physics
      bounceEnabled={false}    // Reduce calculations
    />
  );
};
```

### Performance Testing

#### Automated Performance Testing

```tsx
function PerformanceTester() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const { fps, particleCount, updateConfig } = useSplashCursor();
  
  const runPerformanceTest = async () => {
    const testConfigs = [
      { particleCount: 50, name: 'Low' },
      { particleCount: 100, name: 'Medium' },
      { particleCount: 150, name: 'High' },
      { particleCount: 200, name: 'Very High' },
      { particleCount: 300, name: 'Maximum' }
    ];
    
    const results = [];
    
    for (const config of testConfigs) {
      updateConfig(config);
      
      // Wait for stabilization
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Measure performance for 5 seconds
      const measurements: number[] = [];
      const startTime = Date.now();
      
      while (Date.now() - startTime < 5000) {
        measurements.push(fps);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const avgFPS = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const minFPS = Math.min(...measurements);
      
      results.push({
        ...config,
        avgFPS: avgFPS.toFixed(1),
        minFPS: minFPS.toFixed(1),
        stable: (Math.max(...measurements) - minFPS) < 10
      });
    }
    
    setTestResults(results);
  };
  
  return (
    <div>
      <button onClick={runPerformanceTest}>Run Performance Test</button>
      
      {testResults.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Config</th>
              <th>Particles</th>
              <th>Avg FPS</th>
              <th>Min FPS</th>
              <th>Stable</th>
            </tr>
          </thead>
          <tbody>
            {testResults.map((result, i) => (
              <tr key={i}>
                <td>{result.name}</td>
                <td>{result.particleCount}</td>
                <td>{result.avgFPS}</td>
                <td>{result.minFPS}</td>
                <td>{result.stable ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

## Best Practices

### Development Best Practices

1. **Start Conservative**: Begin with lower particle counts and increase gradually
2. **Test on Target Devices**: Always test on the lowest-spec device you support
3. **Monitor Performance**: Implement performance monitoring in development
4. **Use Presets**: Start with provided presets and customize from there
5. **Enable Auto-Pause**: Always enable `pauseOnHidden` for better resource management

### Production Best Practices

1. **Responsive Configuration**: Adjust settings based on device capabilities
2. **Graceful Degradation**: Provide fallbacks for low-performance scenarios
3. **User Control**: Allow users to disable or reduce the effect
4. **Battery Awareness**: Reduce performance on low battery
5. **Connection Awareness**: Consider network conditions for mobile users

### Code Examples

#### Production-Ready Component
```tsx
import React, { useState, useEffect } from 'react';
import { SplashCursor } from 'fluid-react';

interface OptimizedSplashCursorProps {
  enabled?: boolean;
  onPerformanceIssue?: (fps: number) => void;
}

export function OptimizedSplashCursor({ 
  enabled = true, 
  onPerformanceIssue 
}: OptimizedSplashCursorProps) {
  const [config, setConfig] = useState(() => {
    // Detect device capabilities
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency < 4;
    const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (hasReducedMotion || !enabled) {
      return null;
    }
    
    if (isLowEnd) {
      return {
        particleCount: 25,
        targetFPS: 20,
        intensity: 0.3,
        drag: 0.9,
        pauseOnHidden: true
      };
    }
    
    if (isMobile) {
      return {
        particleCount: 75,
        targetFPS: 30,
        intensity: 0.6,
        drag: 0.95,
        pauseOnHidden: true
      };
    }
    
    return {
      particleCount: 150,
      targetFPS: 60,
      intensity: 0.8,
      drag: 0.997,
      pauseOnHidden: true
    };
  });
  
  const { fps } = useSplashCursor(config || {});
  
  // Performance monitoring
  useEffect(() => {
    if (fps > 0 && fps < 20) {
      onPerformanceIssue?.(fps);
      
      // Auto-reduce quality
      setConfig(prev => prev ? {
        ...prev,
        particleCount: Math.max(25, prev.particleCount - 25),
        intensity: Math.max(0.2, prev.intensity - 0.1)
      } : null);
    }
  }, [fps, onPerformanceIssue]);
  
  if (!config) return null;
  
  return <SplashCursor {...config} />;
}
```

This comprehensive performance guide should help developers optimize SplashCursor for their specific use cases and target devices.
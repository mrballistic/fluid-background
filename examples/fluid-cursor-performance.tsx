import React, { useState, useEffect } from 'react';
import FluidCursor from '../src/components/FluidCursor/FluidCursor';

/**
 * Performance-Optimized FluidCursor Example
 * 
 * This example demonstrates how to configure the FluidCursor component
 * for optimal performance on different devices and use cases.
 */
export default function FluidCursorPerformanceExample() {
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('medium');
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(Date.now());

  // Performance configurations
  const configs = {
    high: {
      SIM_RESOLUTION: 256,
      DYE_RESOLUTION: 2048,
      PRESSURE_ITERATIONS: 30,
      DENSITY_DISSIPATION: 3.5,
      VELOCITY_DISSIPATION: 2,
      CURL: 3,
      SPLAT_RADIUS: 0.2,
      SPLAT_FORCE: 6000,
      SHADING: true,
      COLOR_UPDATE_SPEED: 10,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      TRANSPARENT: true
    },
    medium: {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1440,
      PRESSURE_ITERATIONS: 20,
      DENSITY_DISSIPATION: 3.5,
      VELOCITY_DISSIPATION: 2,
      CURL: 3,
      SPLAT_RADIUS: 0.2,
      SPLAT_FORCE: 6000,
      SHADING: true,
      COLOR_UPDATE_SPEED: 10,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      TRANSPARENT: true
    },
    low: {
      SIM_RESOLUTION: 64,
      DYE_RESOLUTION: 512,
      PRESSURE_ITERATIONS: 10,
      DENSITY_DISSIPATION: 5,
      VELOCITY_DISSIPATION: 3,
      CURL: 2,
      SPLAT_RADIUS: 0.3,
      SPLAT_FORCE: 4000,
      SHADING: false,
      COLOR_UPDATE_SPEED: 5,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      TRANSPARENT: true
    }
  };

  // FPS monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTime = now - lastTime;
      if (deltaTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / deltaTime));
        setFrameCount(0);
        setLastTime(now);
      } else {
        setFrameCount(prev => prev + 1);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [frameCount, lastTime]);

  // Auto-adjust performance based on FPS
  useEffect(() => {
    if (fps > 0) {
      if (fps < 30 && performanceMode !== 'low') {
        setPerformanceMode('low');
      } else if (fps > 50 && performanceMode === 'low') {
        setPerformanceMode('medium');
      }
    }
  }, [fps, performanceMode]);

  const currentConfig = configs[performanceMode];

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      background: '#000'
    }}>
      {/* Performance-optimized FluidCursor */}
      <FluidCursor {...currentConfig} />
      
      {/* Performance Monitor */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 10,
        minWidth: '200px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Performance Monitor</h4>
        <div>FPS: <span style={{ color: fps > 50 ? '#4CAF50' : fps > 30 ? '#FF9800' : '#F44336' }}>{fps}</span></div>
        <div>Mode: <span style={{ color: '#2196F3' }}>{performanceMode.toUpperCase()}</span></div>
        <div>Sim Resolution: {currentConfig.SIM_RESOLUTION}</div>
        <div>Dye Resolution: {currentConfig.DYE_RESOLUTION}</div>
        <div>Pressure Iterations: {currentConfig.PRESSURE_ITERATIONS}</div>
        <div>Shading: {currentConfig.SHADING ? 'ON' : 'OFF'}</div>
      </div>

      {/* Manual Performance Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        zIndex: 10,
        fontFamily: 'Arial, sans-serif'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Performance Settings</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Quality Mode:
          </label>
          <select
            value={performanceMode}
            onChange={(e) => setPerformanceMode(e.target.value as 'high' | 'medium' | 'low')}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: 'none',
              background: '#333',
              color: 'white'
            }}
          >
            <option value="high">High Quality (Desktop)</option>
            <option value="medium">Medium Quality (Balanced)</option>
            <option value="low">Low Quality (Mobile/Weak GPU)</option>
          </select>
        </div>

        <div style={{ fontSize: '12px', opacity: 0.8, lineHeight: '1.4' }}>
          <strong>High:</strong> Best visual quality, requires powerful GPU<br/>
          <strong>Medium:</strong> Balanced performance and quality<br/>
          <strong>Low:</strong> Optimized for mobile and weak GPUs
        </div>

        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>Auto-Optimization:</strong> The system automatically adjusts quality based on performance.
          Target: 30+ FPS
        </div>
      </div>
      
      {/* Content overlay */}
      <div style={{
        position: 'absolute',
        bottom: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        textAlign: 'center',
        zIndex: 5,
        pointerEvents: 'none'
      }}>
        <h1>Performance-Optimized FluidCursor</h1>
        <p>Automatically adjusts quality based on device performance</p>
        <p style={{ fontSize: '14px', opacity: 0.7 }}>
          Current mode: {performanceMode.toUpperCase()} | FPS: {fps}
        </p>
      </div>
    </div>
  );
}

/**
 * Performance Tips:
 * 
 * 1. Lower SIM_RESOLUTION and DYE_RESOLUTION for better performance
 * 2. Reduce PRESSURE_ITERATIONS on mobile devices
 * 3. Disable SHADING on weak GPUs
 * 4. Monitor FPS and adjust settings dynamically
 * 5. Use TRANSPARENT: false if you don't need transparency
 * 
 * Usage in your app:
 * 
 * import FluidCursorPerformanceExample from './examples/fluid-cursor-performance';
 * 
 * function App() {
 *   return <FluidCursorPerformanceExample />;
 * }
 */
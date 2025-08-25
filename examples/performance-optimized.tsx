/**
 * Performance Optimized Example
 * 
 * This example demonstrates how to configure the FluidBackground component
 * for optimal performance on different devices and use cases.
 */

import React, { useState, useEffect } from 'react';
import FluidBackground from 'fluid-background';

export default function PerformanceOptimizedPage() {
  const [performanceMode, setPerformanceMode] = useState<'auto' | 'mobile' | 'desktop' | 'battery'>('auto');
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean;
    pixelRatio: number;
    cores: number;
    memory?: number;
  }>({
    isMobile: false,
    pixelRatio: 1,
    cores: 1
  });

  // Detect device capabilities
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const pixelRatio = window.devicePixelRatio || 1;
    const cores = navigator.hardwareConcurrency || 1;
    const memory = (navigator as any).deviceMemory;

    setDeviceInfo({ isMobile, pixelRatio, cores, memory });
  }, []);

  // Performance configurations for different scenarios
  const performanceConfigs = {
    auto: {
      performance: {
        resolution: 'auto' as const,
        frameRate: 60,
        pauseOnHidden: true
      },
      physics: {
        viscosity: 0.3,
        density: 0.98,
        pressure: 0.8,
        curl: 20,
        splatRadius: 0.25,
        splatForce: 6000
      }
    },
    mobile: {
      performance: {
        resolution: 'low' as const,
        frameRate: 30,
        pauseOnHidden: true
      },
      physics: {
        viscosity: 0.4,
        density: 0.95,
        pressure: 0.6,
        curl: 15,
        splatRadius: 0.3,
        splatForce: 4000
      }
    },
    desktop: {
      performance: {
        resolution: 'high' as const,
        frameRate: 60,
        pauseOnHidden: false
      },
      physics: {
        viscosity: 0.2,
        density: 0.99,
        pressure: 1.0,
        curl: 30,
        splatRadius: 0.2,
        splatForce: 8000
      }
    },
    battery: {
      performance: {
        resolution: 'low' as const,
        frameRate: 20,
        pauseOnHidden: true
      },
      physics: {
        viscosity: 0.5,
        density: 0.9,
        pressure: 0.5,
        curl: 10,
        splatRadius: 0.4,
        splatForce: 3000
      },
      interaction: {
        enabled: false
      }
    }
  };

  const currentConfig = performanceConfigs[performanceMode];

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Performance-optimized fluid background */}
      <FluidBackground
        colors={{
          background: { r: 0.05, g: 0.1, b: 0.15 },
          fluid: 'rainbow'
        }}
        {...currentConfig}
      />
      
      {/* Performance controls */}
      <div style={{
        position: 'fixed',
        top: '2rem',
        left: '2rem',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Performance Mode</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(['auto', 'mobile', 'desktop', 'battery'] as const).map((mode) => (
            <label key={mode} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="performanceMode"
                value={mode}
                checked={performanceMode === mode}
                onChange={(e) => setPerformanceMode(e.target.value as any)}
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ textTransform: 'capitalize' }}>{mode}</span>
            </label>
          ))}
        </div>
        
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
          <h4 style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>Device Info</h4>
          <p>Type: {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}</p>
          <p>Pixel Ratio: {deviceInfo.pixelRatio}x</p>
          <p>CPU Cores: {deviceInfo.cores}</p>
          {deviceInfo.memory && <p>Memory: {deviceInfo.memory}GB</p>}
        </div>
      </div>
      
      {/* Configuration display */}
      <div style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        maxWidth: '300px'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Current Config</h4>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(currentConfig, null, 2)}
        </pre>
      </div>
      
      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        paddingTop: '8rem'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1>Performance Optimization Demo</h1>
          <p>
            This example demonstrates different performance configurations for
            various use cases and device types.
          </p>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>Performance Modes</h2>
            <ul>
              <li><strong>Auto:</strong> Automatically adjusts based on device capabilities</li>
              <li><strong>Mobile:</strong> Optimized for mobile devices with lower resolution and frame rate</li>
              <li><strong>Desktop:</strong> High-quality settings for powerful desktop computers</li>
              <li><strong>Battery:</strong> Minimal resource usage for battery-powered devices</li>
            </ul>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>Optimization Strategies</h2>
            <ul>
              <li><strong>Resolution Scaling:</strong> Lower resolution on mobile devices</li>
              <li><strong>Frame Rate Limiting:</strong> Reduce frame rate to save CPU/GPU</li>
              <li><strong>Physics Simplification:</strong> Reduce complexity for better performance</li>
              <li><strong>Visibility Detection:</strong> Pause when tab is not visible</li>
              <li><strong>Interaction Disabling:</strong> Remove interaction for battery mode</li>
            </ul>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>Best Practices</h2>
            <ul>
              <li>Use 'auto' mode for most applications</li>
              <li>Test on actual mobile devices, not just browser dev tools</li>
              <li>Monitor frame rate and adjust settings accordingly</li>
              <li>Consider user preferences (reduced motion, battery saver)</li>
              <li>Provide fallbacks for devices without WebGL support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * TypeScript Integration Example
 * 
 * This example demonstrates advanced TypeScript usage with the FluidBackground
 * component, including custom types, strict type checking, and type-safe
 * configuration management.
 */

import React, { useState, useCallback, useMemo } from 'react';
import FluidBackground, { 
  type FluidBackgroundProps,
  type FluidSimulationConfig 
} from 'fluid-background';

// Custom type definitions for our configuration presets
interface ConfigurationPreset {
  name: string;
  description: string;
  config: FluidBackgroundProps;
}

interface PerformanceMetrics {
  fps: number;
  quality: 'low' | 'medium' | 'high';
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

// Type-safe configuration presets
const CONFIGURATION_PRESETS: readonly ConfigurationPreset[] = [
  {
    name: 'Minimal',
    description: 'Lightweight configuration for maximum performance',
    config: {
      colors: {
        background: { r: 0.05, g: 0.05, b: 0.1 },
        fluid: 'monochrome'
      },
      physics: {
        viscosity: 0.5,
        density: 0.9,
        pressure: 0.5,
        curl: 10,
        splatRadius: 0.4,
        splatForce: 3000
      },
      performance: {
        resolution: 'low',
        frameRate: 30,
        pauseOnHidden: true
      },
      interaction: {
        enabled: true,
        mouse: true,
        touch: true,
        intensity: 0.5
      }
    }
  },
  {
    name: 'Balanced',
    description: 'Good balance between visual quality and performance',
    config: {
      colors: {
        background: { r: 0.1, g: 0.15, b: 0.2 },
        fluid: 'rainbow'
      },
      physics: {
        viscosity: 0.3,
        density: 0.95,
        pressure: 0.8,
        curl: 20,
        splatRadius: 0.25,
        splatForce: 6000
      },
      performance: {
        resolution: 'medium',
        frameRate: 45,
        pauseOnHidden: true
      },
      interaction: {
        enabled: true,
        mouse: true,
        touch: true,
        intensity: 0.8
      }
    }
  },
  {
    name: 'Premium',
    description: 'Maximum visual quality for high-end devices',
    config: {
      colors: {
        background: { r: 0.02, g: 0.05, b: 0.1 },
        fluid: [
          { r: 0.9, g: 0.3, b: 0.5 },
          { r: 0.3, g: 0.7, b: 0.9 },
          { r: 0.5, g: 0.9, b: 0.4 },
          { r: 0.9, g: 0.7, b: 0.2 },
          { r: 0.7, g: 0.4, b: 0.9 }
        ]
      },
      physics: {
        viscosity: 0.2,
        density: 0.99,
        pressure: 1.0,
        curl: 35,
        splatRadius: 0.15,
        splatForce: 8000
      },
      performance: {
        resolution: 'high',
        frameRate: 60,
        pauseOnHidden: false
      },
      interaction: {
        enabled: true,
        mouse: true,
        touch: true,
        intensity: 1.2
      }
    }
  }
] as const;

// Type guard for configuration validation
function isValidConfiguration(config: unknown): config is FluidBackgroundProps {
  if (!config || typeof config !== 'object') return false;
  
  const cfg = config as Record<string, unknown>;
  
  // Validate colors if present
  if (cfg.colors && typeof cfg.colors === 'object') {
    const colors = cfg.colors as Record<string, unknown>;
    if (colors.background && typeof colors.background === 'object') {
      const bg = colors.background as Record<string, unknown>;
      if (typeof bg.r !== 'number' || typeof bg.g !== 'number' || typeof bg.b !== 'number') {
        return false;
      }
    }
  }
  
  return true;
}

// Custom hook for type-safe configuration management
function useFluidConfiguration(initialPreset: ConfigurationPreset) {
  const [currentPreset, setCurrentPreset] = useState<ConfigurationPreset>(initialPreset);
  const [customConfig, setCustomConfig] = useState<Partial<FluidBackgroundProps>>({});
  
  // Memoized merged configuration
  const mergedConfig = useMemo((): FluidBackgroundProps => {
    return {
      ...currentPreset.config,
      ...customConfig,
      colors: {
        ...currentPreset.config.colors,
        ...customConfig.colors
      },
      physics: {
        ...currentPreset.config.physics,
        ...customConfig.physics
      },
      performance: {
        ...currentPreset.config.performance,
        ...customConfig.performance
      },
      interaction: {
        ...currentPreset.config.interaction,
        ...customConfig.interaction
      }
    };
  }, [currentPreset, customConfig]);
  
  // Type-safe preset switcher
  const switchPreset = useCallback((presetName: string) => {
    const preset = CONFIGURATION_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setCurrentPreset(preset);
      setCustomConfig({}); // Reset custom overrides
    }
  }, []);
  
  // Type-safe configuration updater
  const updateConfig = useCallback(<K extends keyof FluidBackgroundProps>(
    key: K,
    value: FluidBackgroundProps[K]
  ) => {
    setCustomConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  return {
    currentPreset,
    mergedConfig,
    switchPreset,
    updateConfig,
    isValid: isValidConfiguration(mergedConfig)
  };
}

// Performance monitoring component with TypeScript
const PerformanceMonitor: React.FC<{
  onMetricsUpdate: (metrics: PerformanceMetrics) => void;
}> = ({ onMetricsUpdate }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    quality: 'high',
    deviceType: 'desktop'
  });
  
  React.useEffect(() => {
    // Simulate performance monitoring
    const interval = setInterval(() => {
      const newMetrics: PerformanceMetrics = {
        fps: Math.floor(Math.random() * 20) + 45, // 45-65 fps
        quality: metrics.fps > 55 ? 'high' : metrics.fps > 35 ? 'medium' : 'low',
        deviceType: window.innerWidth > 1024 ? 'desktop' : window.innerWidth > 768 ? 'tablet' : 'mobile'
      };
      setMetrics(newMetrics);
      onMetricsUpdate(newMetrics);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [metrics.fps, onMetricsUpdate]);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      zIndex: 10
    }}>
      <div>FPS: {metrics.fps}</div>
      <div>Quality: {metrics.quality}</div>
      <div>Device: {metrics.deviceType}</div>
    </div>
  );
};

// Main TypeScript integration example component
export default function TypeScriptIntegrationPage() {
  const {
    currentPreset,
    mergedConfig,
    switchPreset,
    updateConfig,
    isValid
  } = useFluidConfiguration(CONFIGURATION_PRESETS[1]); // Start with balanced preset
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    quality: 'high',
    deviceType: 'desktop'
  });
  
  // Type-safe event handlers
  const handlePresetChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    switchPreset(event.target.value);
  }, [switchPreset]);
  
  const handleViscosityChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const viscosity = parseFloat(event.target.value);
    updateConfig('physics', {
      ...mergedConfig.physics,
      viscosity
    });
  }, [updateConfig, mergedConfig.physics]);
  
  const handlePerformanceMetrics = useCallback((metrics: PerformanceMetrics) => {
    setPerformanceMetrics(metrics);
    
    // Auto-adjust quality based on performance
    if (metrics.fps < 30 && mergedConfig.performance?.resolution !== 'low') {
      updateConfig('performance', {
        ...mergedConfig.performance,
        resolution: 'low',
        frameRate: 30
      });
    }
  }, [updateConfig, mergedConfig.performance]);
  
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Type-safe FluidBackground with validation */}
      {isValid && (
        <FluidBackground
          {...mergedConfig}
          style={{ zIndex: -1 }}
        />
      )}
      
      {/* Performance monitoring */}
      <PerformanceMonitor onMetricsUpdate={handlePerformanceMetrics} />
      
      {/* Configuration panel */}
      <div style={{
        position: 'fixed',
        top: '2rem',
        left: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        minWidth: '300px',
        zIndex: 10
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>TypeScript Configuration</h3>
        
        {/* Preset selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Preset:
          </label>
          <select
            value={currentPreset.name}
            onChange={handlePresetChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            {CONFIGURATION_PRESETS.map(preset => (
              <option key={preset.name} value={preset.name}>
                {preset.name} - {preset.description}
              </option>
            ))}
          </select>
        </div>
        
        {/* Viscosity control */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Viscosity: {mergedConfig.physics?.viscosity?.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={mergedConfig.physics?.viscosity || 0.3}
            onChange={handleViscosityChange}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Configuration status */}
        <div style={{
          padding: '0.5rem',
          borderRadius: '4px',
          backgroundColor: isValid ? '#d4edda' : '#f8d7da',
          color: isValid ? '#155724' : '#721c24',
          fontSize: '0.9rem'
        }}>
          Configuration: {isValid ? 'Valid ✓' : 'Invalid ✗'}
        </div>
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h1>TypeScript Integration Demo</h1>
          <p>
            This example demonstrates advanced TypeScript usage with the FluidBackground
            component, including type-safe configuration management and validation.
          </p>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>TypeScript Features</h2>
            <ul>
              <li><strong>Type Safety:</strong> Full TypeScript support with proper type definitions</li>
              <li><strong>Configuration Presets:</strong> Type-safe preset management</li>
              <li><strong>Custom Hooks:</strong> Type-safe configuration hooks</li>
              <li><strong>Validation:</strong> Runtime type checking and validation</li>
              <li><strong>Performance Monitoring:</strong> Typed performance metrics</li>
            </ul>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>Current Configuration</h2>
            <pre style={{
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.8rem',
              maxHeight: '300px'
            }}>
              {JSON.stringify(mergedConfig, null, 2)}
            </pre>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>Performance Metrics</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {performanceMetrics.fps}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>FPS</div>
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {performanceMetrics.quality}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Quality</div>
              </div>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {performanceMetrics.deviceType}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Device</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
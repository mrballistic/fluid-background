import React, { useState } from 'react';
import FluidCursor from '../src/components/FluidCursor/FluidCursor';

/**
 * Custom FluidCursor Example
 * 
 * This example demonstrates how to customize the FluidCursor component
 * with different simulation parameters and interactive controls.
 */
export default function FluidCursorCustomExample() {
  const [config, setConfig] = useState({
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1440,
    DENSITY_DISSIPATION: 3.5,
    VELOCITY_DISSIPATION: 2,
    PRESSURE: 0.1,
    PRESSURE_ITERATIONS: 20,
    CURL: 3,
    SPLAT_RADIUS: 0.2,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLOR_UPDATE_SPEED: 10,
    BACK_COLOR: { r: 0.1, g: 0.1, b: 0.2 },
    TRANSPARENT: false
  });

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      background: '#000'
    }}>
      {/* Custom FluidCursor with configurable settings */}
      <FluidCursor {...config} />
      
      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        minWidth: '280px',
        zIndex: 10,
        fontFamily: 'Arial, sans-serif'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Fluid Controls</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Splat Radius: {config.SPLAT_RADIUS}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={config.SPLAT_RADIUS}
            onChange={(e) => updateConfig('SPLAT_RADIUS', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Splat Force: {config.SPLAT_FORCE}
          </label>
          <input
            type="range"
            min="1000"
            max="10000"
            step="500"
            value={config.SPLAT_FORCE}
            onChange={(e) => updateConfig('SPLAT_FORCE', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Density Dissipation: {config.DENSITY_DISSIPATION}
          </label>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.1"
            value={config.DENSITY_DISSIPATION}
            onChange={(e) => updateConfig('DENSITY_DISSIPATION', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Velocity Dissipation: {config.VELOCITY_DISSIPATION}
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={config.VELOCITY_DISSIPATION}
            onChange={(e) => updateConfig('VELOCITY_DISSIPATION', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Curl Strength: {config.CURL}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={config.CURL}
            onChange={(e) => updateConfig('CURL', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={config.SHADING}
              onChange={(e) => updateConfig('SHADING', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Enable Shading
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={config.TRANSPARENT}
              onChange={(e) => updateConfig('TRANSPARENT', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Transparent Background
          </label>
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', opacity: 0.7 }}>
          <strong>Presets:</strong>
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => setConfig({
                ...config,
                SPLAT_RADIUS: 0.1,
                SPLAT_FORCE: 8000,
                DENSITY_DISSIPATION: 5,
                CURL: 5
              })}
              style={{
                background: '#333',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                marginRight: '5px',
                cursor: 'pointer'
              }}
            >
              Sharp
            </button>
            <button
              onClick={() => setConfig({
                ...config,
                SPLAT_RADIUS: 0.5,
                SPLAT_FORCE: 3000,
                DENSITY_DISSIPATION: 1,
                CURL: 1
              })}
              style={{
                background: '#333',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Smooth
            </button>
          </div>
        </div>
      </div>
      
      {/* Content overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        textAlign: 'center',
        zIndex: 5,
        pointerEvents: 'none'
      }}>
        <h1>Custom FluidCursor</h1>
        <p>Use the controls to customize the fluid simulation</p>
      </div>
    </div>
  );
}

/**
 * Usage in your app:
 * 
 * import FluidCursorCustomExample from './examples/fluid-cursor-custom';
 * 
 * function App() {
 *   return <FluidCursorCustomExample />;
 * }
 */
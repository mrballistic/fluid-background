/**
 * Custom Colors Example
 * 
 * This example demonstrates how to customize the visual appearance
 * of the fluid simulation with custom colors and visual settings.
 */

import React, { useState } from 'react';
import FluidBackground from 'fluid-background';

export default function CustomColorsPage() {
  const [colorMode, setColorMode] = useState<'rainbow' | 'monochrome' | 'custom'>('rainbow');
  
  // Define custom color configurations
  const colorConfigs = {
    rainbow: {
      background: { r: 0.1, g: 0.1, b: 0.2 },
      fluid: 'rainbow' as const
    },
    monochrome: {
      background: { r: 0.05, g: 0.05, b: 0.05 },
      fluid: 'monochrome' as const
    },
    custom: {
      background: { r: 0.02, g: 0.05, b: 0.1 },
      fluid: [
        { r: 0.8, g: 0.2, b: 0.4 }, // Pink
        { r: 0.2, g: 0.6, b: 0.9 }, // Blue
        { r: 0.4, g: 0.9, b: 0.6 }, // Green
        { r: 0.9, g: 0.7, b: 0.2 }  // Orange
      ]
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Fluid background with custom colors */}
      <FluidBackground
        colors={colorConfigs[colorMode]}
        physics={{
          viscosity: 0.25,
          density: 0.98,
          curl: 30,
          splatRadius: 0.25
        }}
      />
      
      {/* Control panel */}
      <div style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '200px'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Color Mode</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(['rainbow', 'monochrome', 'custom'] as const).map((mode) => (
            <label key={mode} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="colorMode"
                value={mode}
                checked={colorMode === mode}
                onChange={(e) => setColorMode(e.target.value as any)}
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ textTransform: 'capitalize' }}>{mode}</span>
            </label>
          ))}
        </div>
        
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          <p><strong>Rainbow:</strong> Full spectrum colors</p>
          <p><strong>Monochrome:</strong> Grayscale fluid</p>
          <p><strong>Custom:</strong> Predefined color palette</p>
        </div>
      </div>
      
      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '2rem',
        maxWidth: '600px',
        margin: '0 auto',
        paddingTop: '6rem'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1>Custom Colors Demo</h1>
          <p>
            This example shows how to customize the visual appearance of the
            fluid simulation. Use the controls on the right to switch between
            different color modes.
          </p>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>Color Configuration Options</h2>
            <ul>
              <li><strong>Background:</strong> RGB values for the background color</li>
              <li><strong>Rainbow:</strong> Automatic rainbow color generation</li>
              <li><strong>Monochrome:</strong> Grayscale fluid simulation</li>
              <li><strong>Custom Array:</strong> Define your own color palette</li>
            </ul>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <h2>Physics Tweaks</h2>
            <p>
              This example also demonstrates custom physics parameters:
            </p>
            <ul>
              <li>Lower viscosity for more fluid movement</li>
              <li>Higher curl for more swirling effects</li>
              <li>Adjusted splat radius for interaction</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
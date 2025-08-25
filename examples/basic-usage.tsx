/**
 * Basic Usage Example
 * 
 * This example shows the simplest way to use the FluidBackground component
 * in a Next.js application. Just import and use with default settings.
 */

import React from 'react';
import FluidBackground from 'fluid-background';

export default function BasicUsagePage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Fluid background with default settings */}
      <FluidBackground />
      
      {/* Your page content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '8px',
        marginTop: '4rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1>Welcome to My App</h1>
        <p>
          This page demonstrates the basic usage of the FluidBackground component.
          The fluid simulation runs in the background with default settings.
        </p>
        <p>
          Try moving your mouse around to interact with the fluid simulation!
          The component automatically handles responsive design and performance
          optimization.
        </p>
        
        <div style={{ marginTop: '2rem' }}>
          <h2>Features</h2>
          <ul>
            <li>Zero configuration required</li>
            <li>Automatic performance optimization</li>
            <li>Responsive design support</li>
            <li>Accessibility features built-in</li>
            <li>SSR compatible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
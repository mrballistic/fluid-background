import React from 'react';
import FluidCursor from '../src/components/FluidCursor';

/**
 * Basic FluidCursor Example
 * 
 * This example demonstrates the simplest usage of the FluidCursor component
 * with default settings. The component creates a full-screen WebGL fluid
 * simulation that responds to mouse movement.
 */
export default function FluidCursorBasicExample() {
  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      background: '#000'
    }}>
      {/* Basic FluidCursor with default settings */}
      <FluidCursor />
      
      {/* Content overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        textAlign: 'center',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <h1>Basic FluidCursor</h1>
        <p>Move your mouse to see the fluid effect</p>
      </div>
    </div>
  );
}

/**
 * Usage in your app:
 * 
 * import FluidCursorBasicExample from './examples/fluid-cursor-basic';
 * 
 * function App() {
 *   return <FluidCursorBasicExample />;
 * }
 */
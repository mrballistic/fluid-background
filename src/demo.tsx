import React from 'react';
import { FluidBackground } from './index';

export default function Demo() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#111' }}>
      <FluidBackground
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        colors={{ background: { r: 17, g: 17, b: 17 } }}
      />
      <main style={{ position: 'relative', zIndex: 1, color: '#fff', textAlign: 'center', marginTop: '20vh' }}>
        <h1>Fluid Background Demo</h1>
        <p>Try interacting with the background!</p>
        <p style={{ fontSize: 14, opacity: 0.7 }}>Edit <code>src/demo.tsx</code> to customize this demo.</p>
      </main>
    </div>
  );
}

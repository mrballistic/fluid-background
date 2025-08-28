/**
 * Example: Importing FluidCursor from the dedicated fluid-cursor module
 * 
 * This example shows how to import FluidCursor from the dedicated
 * fluid-cursor module export instead of the main package.
 */

import React from 'react';
// Import from the dedicated fluid-cursor module
import { FluidCursor } from 'fluid-background/fluid-cursor';
// Alternative: import from main package
// import { FluidCursor } from 'fluid-background';

const FluidCursorModuleExample: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <h1 style={{ 
        position: 'relative', 
        zIndex: 10, 
        textAlign: 'center', 
        color: 'white',
        padding: '2rem'
      }}>
        FluidCursor from Module Import
      </h1>
      
      <FluidCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1024}
        DENSITY_DISSIPATION={1}
        VELOCITY_DISSIPATION={0.2}
        PRESSURE={0.8}
        PRESSURE_ITERATIONS={20}
        CURL={30}
        SPLAT_RADIUS={0.25}
        SPLAT_FORCE={6000}
        SHADING={true}
        COLOR_UPDATE_SPEED={10}
        BACK_COLOR={{ r: 0, g: 0, b: 0 }}
        TRANSPARENT={false}
      />
    </div>
  );
};

export default FluidCursorModuleExample;
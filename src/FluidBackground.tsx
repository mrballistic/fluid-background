import React from 'react';
import { FluidBackgroundProps } from './types';

// Main component - will be implemented in task 8.1
const FluidBackground: React.FC<FluidBackgroundProps> = (props) => {
  // Placeholder implementation
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: props.zIndex || -1,
        pointerEvents: 'none',
        ...props.style
      }}
      className={props.className}
    >
      {/* Canvas will be added in task 8.1 */}
    </div>
  );
};

export default FluidBackground;
/**
 * Responsive Design Example
 * 
 * This example demonstrates how to create responsive layouts with the
 * FluidBackground component, including breakpoint-based configurations
 * and adaptive performance settings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import FluidBackground from 'fluid-background';

// Breakpoint definitions
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  ultrawide: 1920
} as const;

type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'ultrawide';

// Responsive configuration for different screen sizes
const RESPONSIVE_CONFIGS = {
  mobile: {
    colors: {
      background: { r: 0.05, g: 0.1, b: 0.15 },
      fluid: 'monochrome' as const
    },
    physics: {
      viscosity: 0.4,
      density: 0.9,
      pressure: 0.6,
      curl: 15,
      splatRadius: 0.35,
      splatForce: 4000
    },
    performance: {
      resolution: 'low' as const,
      frameRate: 30,
      pauseOnHidden: true
    },
    interaction: {
      enabled: true,
      mouse: false, // Disable mouse on mobile
      touch: true,
      intensity: 0.8
    }
  },
  tablet: {
    colors: {
      background: { r: 0.08, g: 0.12, b: 0.18 },
      fluid: 'rainbow' as const
    },
    physics: {
      viscosity: 0.3,
      density: 0.95,
      pressure: 0.7,
      curl: 20,
      splatRadius: 0.28,
      splatForce: 5500
    },
    performance: {
      resolution: 'medium' as const,
      frameRate: 45,
      pauseOnHidden: true
    },
    interaction: {
      enabled: true,
      mouse: true,
      touch: true,
      intensity: 0.9
    }
  },
  desktop: {
    colors: {
      background: { r: 0.1, g: 0.15, b: 0.22 },
      fluid: 'rainbow' as const
    },
    physics: {
      viscosity: 0.25,
      density: 0.98,
      pressure: 0.85,
      curl: 25,
      splatRadius: 0.22,
      splatForce: 7000
    },
    performance: {
      resolution: 'high' as const,
      frameRate: 60,
      pauseOnHidden: true
    },
    interaction: {
      enabled: true,
      mouse: true,
      touch: true,
      intensity: 1.0
    }
  },
  ultrawide: {
    colors: {
      background: { r: 0.02, g: 0.08, b: 0.15 },
      fluid: [
        { r: 0.9, g: 0.2, b: 0.4 },
        { r: 0.2, g: 0.7, b: 0.9 },
        { r: 0.4, g: 0.9, b: 0.3 },
        { r: 0.9, g: 0.8, b: 0.2 },
        { r: 0.7, g: 0.3, b: 0.9 }
      ]
    },
    physics: {
      viscosity: 0.2,
      density: 0.99,
      pressure: 1.0,
      curl: 30,
      splatRadius: 0.18,
      splatForce: 8500
    },
    performance: {
      resolution: 'high' as const,
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
};

// Custom hook for responsive behavior
function useResponsiveConfig() {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  
  const updateDeviceType = useCallback((width: number) => {
    if (width < BREAKPOINTS.mobile) {
      setDeviceType('mobile');
    } else if (width < BREAKPOINTS.tablet) {
      setDeviceType('tablet');
    } else if (width < BREAKPOINTS.ultrawide) {
      setDeviceType('desktop');
    } else {
      setDeviceType('ultrawide');
    }
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      updateDeviceType(width);
    };
    
    // Initial setup
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDeviceType]);
  
  return {
    deviceType,
    windowSize,
    config: RESPONSIVE_CONFIGS[deviceType],
    breakpoints: BREAKPOINTS
  };
}

// Responsive grid component
const ResponsiveGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { deviceType } = useResponsiveConfig();
  
  const gridStyles = {
    mobile: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1rem',
      padding: '1rem'
    },
    tablet: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
      padding: '1.5rem'
    },
    desktop: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '2rem',
      padding: '2rem'
    },
    ultrawide: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '2rem',
      padding: '2rem'
    }
  };
  
  return (
    <div style={gridStyles[deviceType]}>
      {children}
    </div>
  );
};

// Device info display component
const DeviceInfo: React.FC = () => {
  const { deviceType, windowSize, breakpoints } = useResponsiveConfig();
  
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      zIndex: 10,
      minWidth: '200px'
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0' }}>Device Info</h4>
      <div>Type: {deviceType}</div>
      <div>Size: {windowSize.width} × {windowSize.height}</div>
      <div>Ratio: {(windowSize.width / windowSize.height).toFixed(2)}</div>
      
      <h5 style={{ margin: '1rem 0 0.5rem 0' }}>Breakpoints</h5>
      {Object.entries(breakpoints).map(([name, value]) => (
        <div key={name} style={{
          color: windowSize.width >= value ? '#4ade80' : '#94a3b8'
        }}>
          {name}: {value}px {windowSize.width >= value ? '✓' : ''}
        </div>
      ))}
    </div>
  );
};

// Main responsive design example component
export default function ResponsiveDesignPage() {
  const { deviceType, config, windowSize } = useResponsiveConfig();
  const [showGrid, setShowGrid] = useState(false);
  
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Responsive FluidBackground */}
      <FluidBackground
        {...config}
        style={{ zIndex: -1 }}
      />
      
      {/* Device info display */}
      <DeviceInfo />
      
      {/* Toggle button for grid demo */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          zIndex: 10
        }}
      >
        {showGrid ? 'Hide Grid Demo' : 'Show Grid Demo'}
      </button>
      
      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        paddingTop: deviceType === 'mobile' ? '1rem' : '2rem'
      }}>
        <div style={{
          maxWidth: deviceType === 'mobile' ? '100%' : 
                   deviceType === 'tablet' ? '768px' :
                   deviceType === 'desktop' ? '1200px' : '1400px',
          margin: '0 auto',
          padding: deviceType === 'mobile' ? '1rem' : '2rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: deviceType === 'mobile' ? '1.5rem' : '2rem',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h1 style={{
              fontSize: deviceType === 'mobile' ? '1.8rem' : 
                        deviceType === 'tablet' ? '2.2rem' : '2.5rem',
              marginBottom: '1rem'
            }}>
              Responsive Design Demo
            </h1>
            
            <p style={{
              fontSize: deviceType === 'mobile' ? '0.9rem' : '1rem',
              lineHeight: '1.6'
            }}>
              This example demonstrates how the FluidBackground component adapts
              to different screen sizes and device types with optimized configurations
              for each breakpoint.
            </p>
            
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{
                fontSize: deviceType === 'mobile' ? '1.3rem' : '1.5rem'
              }}>
                Current Configuration: {deviceType}
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: deviceType === 'mobile' ? '1fr' : 'repeat(2, 1fr)',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Performance</h3>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div>Resolution: {config.performance.resolution}</div>
                    <div>Frame Rate: {config.performance.frameRate} fps</div>
                    <div>Pause Hidden: {config.performance.pauseOnHidden ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Interaction</h3>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div>Mouse: {config.interaction.mouse ? 'Enabled' : 'Disabled'}</div>
                    <div>Touch: {config.interaction.touch ? 'Enabled' : 'Disabled'}</div>
                    <div>Intensity: {config.interaction.intensity}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{
                fontSize: deviceType === 'mobile' ? '1.3rem' : '1.5rem'
              }}>
                Responsive Features
              </h2>
              <ul style={{ fontSize: deviceType === 'mobile' ? '0.9rem' : '1rem' }}>
                <li><strong>Adaptive Performance:</strong> Lower settings on mobile devices</li>
                <li><strong>Touch Optimization:</strong> Enhanced touch interaction on mobile</li>
                <li><strong>Breakpoint-based:</strong> Different configs for each screen size</li>
                <li><strong>Fluid Layout:</strong> Content adapts to available space</li>
                <li><strong>Performance Monitoring:</strong> Real-time device detection</li>
              </ul>
            </div>
            
            {showGrid && (
              <div style={{ marginTop: '2rem' }}>
                <h2 style={{
                  fontSize: deviceType === 'mobile' ? '1.3rem' : '1.5rem'
                }}>
                  Responsive Grid Demo
                </h2>
                <ResponsiveGrid>
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '1rem',
                        backgroundColor: `hsl(${i * 45}, 70%, 85%)`,
                        borderRadius: '8px',
                        textAlign: 'center',
                        minHeight: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: deviceType === 'mobile' ? '0.8rem' : '0.9rem'
                      }}
                    >
                      Grid Item {i + 1}
                    </div>
                  ))}
                </ResponsiveGrid>
              </div>
            )}
            
            <div style={{ marginTop: '2rem' }}>
              <h2 style={{
                fontSize: deviceType === 'mobile' ? '1.3rem' : '1.5rem'
              }}>
                Implementation Tips
              </h2>
              <ul style={{ fontSize: deviceType === 'mobile' ? '0.9rem' : '1rem' }}>
                <li>Use CSS-in-JS or CSS custom properties for responsive styles</li>
                <li>Implement performance budgets for different device types</li>
                <li>Test on actual devices, not just browser dev tools</li>
                <li>Consider network conditions and battery life on mobile</li>
                <li>Provide fallbacks for devices without WebGL support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
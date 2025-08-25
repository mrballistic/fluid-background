# Usage Examples

## Basic Examples

### Simple Background

The most basic usage - just add a fluid background to your page:

```tsx
import { FluidBackground } from 'fluid-background';

export default function HomePage() {
  return (
    <div>
      <FluidBackground />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Welcome to My Site</h1>
        <p>This content appears over the fluid background.</p>
      </main>
    </div>
  );
}
```

### Custom Colors

Create a branded fluid background with your color scheme:

```tsx
import { FluidBackground } from 'fluid-background';

export default function BrandedPage() {
  return (
    <div>
      <FluidBackground 
        colors={{
          background: { r: 0.02, g: 0.02, b: 0.1 }, // Dark navy
          fluid: [
            { r: 0.2, g: 0.6, b: 1.0 }, // Bright blue
            { r: 0.8, g: 0.2, b: 0.8 }, // Purple
            { r: 0.2, g: 0.8, b: 0.6 }  // Teal
          ]
        }}
      />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Brand Colors</h1>
      </main>
    </div>
  );
}
```

### Subtle Monochrome

For a more professional, subtle effect:

```tsx
import { FluidBackground } from 'fluid-background';

export default function ProfessionalPage() {
  return (
    <div>
      <FluidBackground 
        colors={{
          background: { r: 0.95, g: 0.95, b: 0.97 }, // Light gray
          fluid: 'monochrome'
        }}
        physics={{
          viscosity: 0.8,
          curl: 15,
          splatForce: 2000
        }}
        style={{ opacity: 0.3 }}
      />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Professional Layout</h1>
      </main>
    </div>
  );
}
```

## Responsive Examples

### Mobile-Optimized

Automatically optimize for mobile devices:

```tsx
import { FluidBackground } from 'fluid-background';
import { useState, useEffect } from 'react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

export default function ResponsivePage() {
  const isMobile = useIsMobile();
  
  return (
    <div>
      <FluidBackground 
        performance={{
          resolution: isMobile ? 'low' : 'high',
          frameRate: isMobile ? 24 : 60
        }}
        physics={{
          splatForce: isMobile ? 3000 : 6000,
          curl: isMobile ? 20 : 35
        }}
      />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Responsive Fluid</h1>
        <p>Optimized for {isMobile ? 'mobile' : 'desktop'}</p>
      </main>
    </div>
  );
}
```

### Breakpoint-Based Configuration

Use different settings for different screen sizes:

```tsx
import { FluidBackground } from 'fluid-background';
import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) setBreakpoint('mobile');
      else if (width < 1024) setBreakpoint('tablet');
      else setBreakpoint('desktop');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
}

const configs = {
  mobile: {
    performance: { resolution: 'low' as const, frameRate: 24 },
    physics: { viscosity: 0.7, curl: 15, splatForce: 2000 }
  },
  tablet: {
    performance: { resolution: 'medium' as const, frameRate: 30 },
    physics: { viscosity: 0.5, curl: 25, splatForce: 4000 }
  },
  desktop: {
    performance: { resolution: 'high' as const, frameRate: 60 },
    physics: { viscosity: 0.3, curl: 35, splatForce: 6000 }
  }
};

export default function BreakpointPage() {
  const breakpoint = useBreakpoint();
  const config = configs[breakpoint];
  
  return (
    <div>
      <FluidBackground {...config} />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Breakpoint: {breakpoint}</h1>
      </main>
    </div>
  );
}
```

## Theme Integration

### With CSS Variables

Integrate with your CSS custom properties:

```css
:root {
  --bg-primary: 0.05, 0.05, 0.1;
  --accent-1: 0.2, 0.6, 1.0;
  --accent-2: 0.8, 0.2, 0.8;
  --accent-3: 0.2, 0.8, 0.6;
}

[data-theme="dark"] {
  --bg-primary: 0.02, 0.02, 0.05;
  --accent-1: 0.3, 0.7, 1.0;
  --accent-2: 0.9, 0.3, 0.9;
  --accent-3: 0.3, 0.9, 0.7;
}
```

```tsx
import { FluidBackground } from 'fluid-background';
import { useState, useEffect } from 'react';

function parseRGB(cssVar: string) {
  const values = cssVar.split(',').map(v => parseFloat(v.trim()));
  return { r: values[0], g: values[1], b: values[2] };
}

export default function ThemedPage() {
  const [colors, setColors] = useState({
    background: { r: 0.05, g: 0.05, b: 0.1 },
    fluid: [
      { r: 0.2, g: 0.6, b: 1.0 },
      { r: 0.8, g: 0.2, b: 0.8 },
      { r: 0.2, g: 0.8, b: 0.6 }
    ]
  });
  
  useEffect(() => {
    const updateColors = () => {
      const style = getComputedStyle(document.documentElement);
      setColors({
        background: parseRGB(style.getPropertyValue('--bg-primary')),
        fluid: [
          parseRGB(style.getPropertyValue('--accent-1')),
          parseRGB(style.getPropertyValue('--accent-2')),
          parseRGB(style.getPropertyValue('--accent-3'))
        ]
      });
    };
    
    updateColors();
    
    // Listen for theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div>
      <FluidBackground colors={colors} />
      <main style={{ position: 'relative', zIndex: 1 }}>
        <button onClick={() => {
          const current = document.documentElement.dataset.theme;
          document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark';
        }}>
          Toggle Theme
        </button>
      </main>
    </div>
  );
}
```

### With Styled Components

```tsx
import styled, { ThemeProvider } from 'styled-components';
import { FluidBackground } from 'fluid-background';

const theme = {
  colors: {
    background: { r: 0.02, g: 0.02, b: 0.08 },
    primary: { r: 0.2, g: 0.6, b: 1.0 },
    secondary: { r: 0.8, g: 0.2, b: 0.8 },
    accent: { r: 0.2, g: 0.8, b: 0.6 }
  }
};

const Container = styled.div`
  position: relative;
  min-height: 100vh;
`;

const Content = styled.main`
  position: relative;
  z-index: 1;
  padding: 2rem;
`;

export default function StyledPage() {
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <FluidBackground 
          colors={{
            background: theme.colors.background,
            fluid: [
              theme.colors.primary,
              theme.colors.secondary,
              theme.colors.accent
            ]
          }}
        />
        <Content>
          <h1>Styled Components Integration</h1>
        </Content>
      </Container>
    </ThemeProvider>
  );
}
```

## Advanced Examples

### Performance Monitoring

Monitor and display performance metrics:

```tsx
import { FluidBackground } from 'fluid-background';
import { useState, useEffect } from 'react';

export default function PerformancePage() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    averageFps: 0,
    droppedFrames: 0
  });
  
  return (
    <div>
      <FluidBackground 
        performance={{ resolution: 'auto' }}
        onPerformanceUpdate={(newMetrics) => {
          setMetrics(newMetrics);
        }}
      />
      <main style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'monospace'
        }}>
          <div>FPS: {metrics.fps.toFixed(1)}</div>
          <div>Avg: {metrics.averageFps.toFixed(1)}</div>
          <div>Dropped: {metrics.droppedFrames}</div>
        </div>
        <h1>Performance Monitor</h1>
      </main>
    </div>
  );
}
```

### Interactive Controls

Create a control panel for real-time adjustments:

```tsx
import { FluidBackground } from 'fluid-background';
import { useState } from 'react';

export default function InteractivePage() {
  const [config, setConfig] = useState({
    physics: {
      viscosity: 0.3,
      curl: 30,
      splatForce: 6000
    },
    colors: {
      fluid: 'rainbow' as const
    }
  });
  
  return (
    <div>
      <FluidBackground {...config} />
      <main style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: 'rgba(255,255,255,0.9)',
          padding: '20px',
          borderRadius: '10px',
          minWidth: '200px'
        }}>
          <h3>Controls</h3>
          
          <label>
            Viscosity: {config.physics.viscosity.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.physics.viscosity}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                physics: {
                  ...prev.physics,
                  viscosity: parseFloat(e.target.value)
                }
              }))}
            />
          </label>
          
          <label>
            Curl: {config.physics.curl}
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={config.physics.curl}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                physics: {
                  ...prev.physics,
                  curl: parseInt(e.target.value)
                }
              }))}
            />
          </label>
          
          <label>
            Force: {config.physics.splatForce}
            <input
              type="range"
              min="1000"
              max="10000"
              step="100"
              value={config.physics.splatForce}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                physics: {
                  ...prev.physics,
                  splatForce: parseInt(e.target.value)
                }
              }))}
            />
          </label>
          
          <label>
            Colors:
            <select
              value={config.colors.fluid}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                colors: {
                  ...prev.colors,
                  fluid: e.target.value as 'rainbow' | 'monochrome'
                }
              }))}
            >
              <option value="rainbow">Rainbow</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </label>
        </div>
        
        <div style={{ marginLeft: '250px' }}>
          <h1>Interactive Fluid Controls</h1>
          <p>Use the controls on the left to adjust the fluid simulation in real-time.</p>
        </div>
      </main>
    </div>
  );
}
```

### Multiple Fluid Layers

Create layered fluid effects:

```tsx
import { FluidBackground } from 'fluid-background';

export default function LayeredPage() {
  return (
    <div>
      {/* Background layer */}
      <FluidBackground 
        zIndex={-3}
        colors={{
          background: { r: 0.02, g: 0.02, b: 0.08 },
          fluid: 'monochrome'
        }}
        physics={{
          viscosity: 0.8,
          curl: 10,
          splatForce: 2000
        }}
        style={{ opacity: 0.6 }}
      />
      
      {/* Foreground layer */}
      <FluidBackground 
        zIndex={-2}
        colors={{
          background: { r: 0, g: 0, b: 0, a: 0 }, // Transparent
          fluid: [
            { r: 0.2, g: 0.6, b: 1.0 },
            { r: 0.8, g: 0.2, b: 0.8 }
          ]
        }}
        physics={{
          viscosity: 0.2,
          curl: 40,
          splatForce: 8000
        }}
        style={{ opacity: 0.4 }}
      />
      
      <main style={{ position: 'relative', zIndex: 1 }}>
        <h1>Layered Fluid Effects</h1>
        <p>Multiple fluid layers create depth and complexity.</p>
      </main>
    </div>
  );
}
```

### Conditional Rendering

Show fluid background based on user preferences:

```tsx
import { FluidBackground } from 'fluid-background';
import { useState, useEffect } from 'react';

export default function ConditionalPage() {
  const [showFluid, setShowFluid] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return (
    <div>
      {showFluid && !prefersReducedMotion && (
        <FluidBackground />
      )}
      
      {prefersReducedMotion && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          zIndex: -1
        }} />
      )}
      
      <main style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
        <h1>Accessibility-Aware Fluid</h1>
        
        <label>
          <input
            type="checkbox"
            checked={showFluid}
            onChange={(e) => setShowFluid(e.target.checked)}
            disabled={prefersReducedMotion}
          />
          Enable Fluid Background
          {prefersReducedMotion && ' (Disabled due to motion preference)'}
        </label>
        
        <p>
          This page respects your motion preferences and provides 
          a toggle for the fluid background.
        </p>
      </main>
    </div>
  );
}
```

## Next.js Specific Examples

### App Router Integration

```tsx
// app/layout.tsx
import { FluidBackground } from 'fluid-background';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <FluidBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
```

### Dynamic Import with Loading

```tsx
// components/FluidWrapper.tsx
import dynamic from 'next/dynamic';

const FluidBackground = dynamic(
  () => import('fluid-background').then(mod => mod.FluidBackground),
  {
    ssr: false,
    loading: () => (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(45deg, #000428 0%, #004e92 100%)',
        zIndex: -1
      }} />
    )
  }
);

export default function FluidWrapper() {
  return <FluidBackground />;
}
```

### Route-Specific Configurations

```tsx
// lib/fluidConfigs.ts
export const fluidConfigs = {
  home: {
    colors: { fluid: 'rainbow' as const },
    physics: { curl: 35 }
  },
  about: {
    colors: { fluid: 'monochrome' as const },
    physics: { viscosity: 0.8, curl: 15 }
  },
  contact: {
    colors: {
      fluid: [
        { r: 0.2, g: 0.6, b: 1.0 },
        { r: 0.8, g: 0.2, b: 0.8 }
      ]
    }
  }
};

// components/RouteFluid.tsx
import { FluidBackground } from 'fluid-background';
import { useRouter } from 'next/router';
import { fluidConfigs } from '../lib/fluidConfigs';

export default function RouteFluid() {
  const router = useRouter();
  const routeName = router.pathname.slice(1) || 'home';
  const config = fluidConfigs[routeName as keyof typeof fluidConfigs] || fluidConfigs.home;
  
  return <FluidBackground {...config} />;
}
```
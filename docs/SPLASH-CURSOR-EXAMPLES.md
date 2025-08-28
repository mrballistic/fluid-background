# SplashCursor Examples

This document provides comprehensive examples for using the SplashCursor component in various scenarios.

## Table of Contents

- [React Examples](#react-examples)
- [Vanilla JavaScript Examples](#vanilla-javascript-examples)
- [Integration Examples](#integration-examples)
- [Performance Examples](#performance-examples)
- [Creative Use Cases](#creative-use-cases)

## React Examples

### Basic Usage

#### Simple Setup
```tsx
import React from 'react';
import { SplashCursor } from 'fluid-react';

function App() {
  return (
    <div className="app">
      <SplashCursor />
      <header>
        <h1>Welcome to My Website</h1>
        <p>Move your cursor around to see the splash effect!</p>
      </header>
    </div>
  );
}

export default App;
```

#### With Custom Styling
```tsx
import React from 'react';
import { SplashCursor } from 'fluid-react';

function StyledApp() {
  return (
    <div className="app">
      <SplashCursor 
        className="custom-splash"
        style={{
          opacity: 0.8,
          filter: 'blur(0.5px)',
          mixBlendMode: 'screen'
        }}
        zIndex={100}
      />
      
      <main className="content">
        <h1>Styled Splash Cursor</h1>
      </main>
    </div>
  );
}
```

### Color Variations

#### Rainbow Theme
```tsx
function RainbowSplash() {
  return (
    <SplashCursor 
      colors={{
        mode: 'rainbow',
        saturation: 90,
        lightness: 65,
        cycleSpeed: 1.5
      }}
      intensity={0.9}
    />
  );
}
```

#### Brand Colors
```tsx
function BrandSplash() {
  return (
    <SplashCursor 
      colors={{
        mode: 'single',
        baseHue: 220,      // Brand blue
        saturation: 80,
        lightness: 60
      }}
      intensity={0.7}
    />
  );
}
```

#### Velocity-Based Colors
```tsx
function VelocitySplash() {
  return (
    <SplashCursor 
      colors={{
        mode: 'velocity',
        saturation: 85,
        lightness: 65
      }}
      intensity={0.8}
    />
  );
}
```

### Interactive Examples

#### Toggle Control
```tsx
import React, { useState } from 'react';
import { SplashCursor } from 'fluid-react';

function ToggleableSplash() {
  const [enabled, setEnabled] = useState(true);
  
  return (
    <div>
      {enabled && <SplashCursor intensity={0.8} />}
      
      <button 
        onClick={() => setEnabled(!enabled)}
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000 }}
      >
        {enabled ? 'Disable' : 'Enable'} Splash
      </button>
    </div>
  );
}
```

#### Dynamic Configuration
```tsx
import React, { useState } from 'react';
import { SplashCursor } from 'fluid-react';

function DynamicSplash() {
  const [intensity, setIntensity] = useState(0.8);
  const [particleCount, setParticleCount] = useState(150);
  const [colorMode, setColorMode] = useState<'rainbow' | 'single'>('rainbow');
  
  return (
    <div>
      <SplashCursor 
        intensity={intensity}
        particleCount={particleCount}
        colors={{ mode: colorMode }}
      />
      
      <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 10000 }}>
        <div>
          <label>
            Intensity: {intensity.toFixed(1)}
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
            />
          </label>
        </div>
        
        <div>
          <label>
            Particles: {particleCount}
            <input 
              type="range" 
              min="50" 
              max="300" 
              step="25" 
              value={particleCount}
              onChange={(e) => setParticleCount(parseInt(e.target.value))}
            />
          </label>
        </div>
        
        <div>
          <label>
            <input 
              type="radio" 
              checked={colorMode === 'rainbow'}
              onChange={() => setColorMode('rainbow')}
            />
            Rainbow
          </label>
          <label>
            <input 
              type="radio" 
              checked={colorMode === 'single'}
              onChange={() => setColorMode('single')}
            />
            Single Color
          </label>
        </div>
      </div>
    </div>
  );
}
```

#### Hook-Based Control
```tsx
import React, { useEffect } from 'react';
import { useSplashCursor } from 'fluid-react';

function HookControlledSplash() {
  const { 
    canvasRef, 
    isActive, 
    particleCount, 
    fps,
    start,
    stop,
    reset,
    updateConfig 
  } = useSplashCursor({
    intensity: 0.8,
    particleCount: 150
  });
  
  // Auto-adjust quality based on performance
  useEffect(() => {
    if (fps > 0 && fps < 30) {
      updateConfig({ particleCount: 75 });
    } else if (fps > 55) {
      updateConfig({ particleCount: 150 });
    }
  }, [fps, updateConfig]);
  
  return (
    <div>
      <canvas 
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999
        }}
      />
      
      <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 10000 }}>
        <div>Status: {isActive ? 'Active' : 'Inactive'}</div>
        <div>Particles: {particleCount}</div>
        <div>FPS: {fps}</div>
        
        <button onClick={start} disabled={isActive}>Start</button>
        <button onClick={stop} disabled={!isActive}>Stop</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
```

### Theme Integration

#### Dark Theme
```tsx
function DarkThemeSplash() {
  return (
    <div className="dark-theme">
      <SplashCursor 
        colors={{
          mode: 'single',
          baseHue: 200,
          saturation: 70,
          lightness: 80
        }}
        intensity={0.6}
        style={{ mixBlendMode: 'screen' }}
      />
      
      <div className="content">
        <h1>Dark Theme Website</h1>
      </div>
    </div>
  );
}
```

#### Light Theme
```tsx
function LightThemeSplash() {
  return (
    <div className="light-theme">
      <SplashCursor 
        colors={{
          mode: 'single',
          baseHue: 240,
          saturation: 60,
          lightness: 50
        }}
        intensity={0.4}
        style={{ mixBlendMode: 'multiply' }}
      />
      
      <div className="content">
        <h1>Light Theme Website</h1>
      </div>
    </div>
  );
}
```

## Vanilla JavaScript Examples

### Basic Setup

#### CDN Usage
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SplashCursor Demo</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      background: #1a1a1a;
      color: white;
      min-height: 100vh;
    }
    
    .content {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="content">
    <h1>SplashCursor Vanilla Demo</h1>
    <p>Move your cursor around to see the effect!</p>
  </div>

  <script src="https://unpkg.com/fluid-react/dist/vanilla.js"></script>
  <script>
    const splashCursor = FluidReact.createSplashCursor({
      intensity: 0.8,
      colors: { mode: 'rainbow' },
      particleCount: 150
    });
    
    splashCursor.start();
  </script>
</body>
</html>
```

#### ES Module Usage
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SplashCursor ES Module</title>
</head>
<body>
  <h1>ES Module Demo</h1>
  
  <script type="module">
    import { createSplashCursor } from './node_modules/fluid-react/dist/vanilla.js';
    
    const splashCursor = createSplashCursor({
      intensity: 0.8,
      colors: { mode: 'rainbow' }
    });
    
    splashCursor.start();
  </script>
</body>
</html>
```

### Interactive Controls

#### Full Control Panel
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SplashCursor Controls</title>
  <style>
    .controls {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: Arial, sans-serif;
    }
    
    .control-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
    }
    
    input[type="range"] {
      width: 200px;
    }
    
    button {
      margin-right: 10px;
      padding: 5px 10px;
    }
    
    .stats {
      margin-top: 15px;
      font-size: 12px;
      color: #ccc;
    }
  </style>
</head>
<body>
  <h1>SplashCursor Interactive Demo</h1>
  <p>Use the controls to customize the effect!</p>
  
  <div class="controls">
    <div class="control-group">
      <button id="start">Start</button>
      <button id="stop">Stop</button>
      <button id="reset">Reset</button>
    </div>
    
    <div class="control-group">
      <label for="intensity">Intensity: <span id="intensity-value">0.8</span></label>
      <input type="range" id="intensity" min="0" max="1" step="0.1" value="0.8">
    </div>
    
    <div class="control-group">
      <label for="particles">Particles: <span id="particles-value">150</span></label>
      <input type="range" id="particles" min="25" max="300" step="25" value="150">
    </div>
    
    <div class="control-group">
      <label for="gravity">Gravity: <span id="gravity-value">0.01</span></label>
      <input type="range" id="gravity" min="-0.1" max="0.1" step="0.01" value="0.01">
    </div>
    
    <div class="control-group">
      <label for="drag">Drag: <span id="drag-value">0.997</span></label>
      <input type="range" id="drag" min="0.9" max="1" step="0.001" value="0.997">
    </div>
    
    <div class="control-group">
      <label>Color Mode:</label>
      <select id="color-mode">
        <option value="rainbow">Rainbow</option>
        <option value="single">Single</option>
        <option value="velocity">Velocity</option>
        <option value="gradient">Gradient</option>
      </select>
    </div>
    
    <div class="stats">
      <div>FPS: <span id="fps">0</span></div>
      <div>Active Particles: <span id="active-particles">0</span></div>
      <div>Quality: <span id="quality">high</span></div>
    </div>
  </div>

  <script type="module">
    import { createSplashCursor } from './node_modules/fluid-react/dist/vanilla.js';
    
    const splashCursor = createSplashCursor({
      intensity: 0.8,
      particleCount: 150,
      colors: { mode: 'rainbow' }
    });
    
    // Control buttons
    document.getElementById('start').onclick = () => splashCursor.start();
    document.getElementById('stop').onclick = () => splashCursor.stop();
    document.getElementById('reset').onclick = () => splashCursor.reset();
    
    // Intensity control
    const intensitySlider = document.getElementById('intensity');
    const intensityValue = document.getElementById('intensity-value');
    intensitySlider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      intensityValue.textContent = value.toFixed(1);
      splashCursor.updateConfig({ intensity: value });
    };
    
    // Particle count control
    const particlesSlider = document.getElementById('particles');
    const particlesValue = document.getElementById('particles-value');
    particlesSlider.oninput = (e) => {
      const value = parseInt(e.target.value);
      particlesValue.textContent = value;
      splashCursor.updateConfig({ particleCount: value });
    };
    
    // Gravity control
    const gravitySlider = document.getElementById('gravity');
    const gravityValue = document.getElementById('gravity-value');
    gravitySlider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      gravityValue.textContent = value.toFixed(3);
      splashCursor.updateConfig({ gravity: value });
    };
    
    // Drag control
    const dragSlider = document.getElementById('drag');
    const dragValue = document.getElementById('drag-value');
    dragSlider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      dragValue.textContent = value.toFixed(3);
      splashCursor.updateConfig({ drag: value });
    };
    
    // Color mode control
    const colorModeSelect = document.getElementById('color-mode');
    colorModeSelect.onchange = (e) => {
      splashCursor.updateConfig({ 
        colors: { mode: e.target.value }
      });
    };
    
    // Performance monitoring
    splashCursor.onPerformanceUpdate((metrics) => {
      document.getElementById('fps').textContent = Math.round(metrics.fps);
      document.getElementById('active-particles').textContent = metrics.particleCount;
    });
    
    splashCursor.onQualityChange((quality) => {
      document.getElementById('quality').textContent = quality;
    });
    
    // Start the effect
    splashCursor.start();
  </script>
</body>
</html>
```

### Custom Container

#### Specific Element Container
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Container Demo</title>
  <style>
    .demo-area {
      width: 800px;
      height: 600px;
      margin: 50px auto;
      border: 2px solid #333;
      position: relative;
      background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
      overflow: hidden;
    }
    
    .content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
      z-index: 1;
    }
  </style>
</head>
<body>
  <h1>Container-Specific SplashCursor</h1>
  
  <div class="demo-area" id="demo-container">
    <div class="content">
      <h2>Move cursor in this area</h2>
      <p>The splash effect is contained within this box</p>
    </div>
  </div>

  <script type="module">
    import { createSplashCursor } from './node_modules/fluid-react/dist/vanilla.js';
    
    const splashCursor = createSplashCursor({
      container: '#demo-container',
      intensity: 0.9,
      colors: { mode: 'rainbow' },
      particleCount: 100,
      zIndex: 0  // Behind the content
    });
    
    splashCursor.start();
  </script>
</body>
</html>
```

## Integration Examples

### Next.js Integration

#### App Router (app/layout.tsx)
```tsx
import { SplashCursor } from 'fluid-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SplashCursor 
          intensity={0.7}
          colors={{ mode: 'rainbow' }}
          pauseOnHidden={true}
        />
        {children}
      </body>
    </html>
  );
}
```

#### Pages Router (_app.tsx)
```tsx
import type { AppProps } from 'next/app';
import { SplashCursor } from 'fluid-react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <SplashCursor 
        intensity={0.7}
        colors={{ mode: 'rainbow' }}
      />
      <Component {...pageProps} />
    </>
  );
}
```

### Gatsby Integration

#### gatsby-browser.js
```javascript
import React from 'react';
import { SplashCursor } from 'fluid-react';

export const wrapPageElement = ({ element }) => {
  return (
    <>
      <SplashCursor intensity={0.8} />
      {element}
    </>
  );
};
```

### Vite Integration

#### main.tsx
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SplashCursor } from 'fluid-react';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SplashCursor intensity={0.8} />
    <App />
  </React.StrictMode>
);
```

### WordPress Integration

#### functions.php
```php
function enqueue_splash_cursor() {
    wp_enqueue_script(
        'splash-cursor',
        'https://unpkg.com/fluid-react/dist/vanilla.js',
        array(),
        '1.0.0',
        true
    );
    
    wp_add_inline_script('splash-cursor', '
        document.addEventListener("DOMContentLoaded", function() {
            const splashCursor = FluidReact.createSplashCursor({
                intensity: 0.7,
                colors: { mode: "rainbow" }
            });
            splashCursor.start();
        });
    ');
}
add_action('wp_enqueue_scripts', 'enqueue_splash_cursor');
```

## Performance Examples

### Mobile Optimization

#### Responsive Configuration
```tsx
import React, { useState, useEffect } from 'react';
import { SplashCursor } from 'fluid-react';

function ResponsiveSplashCursor() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <SplashCursor 
      particleCount={isMobile ? 50 : 150}
      targetFPS={isMobile ? 30 : 60}
      intensity={isMobile ? 0.5 : 0.8}
      pauseOnHidden={true}
    />
  );
}
```

#### Battery-Aware Configuration
```tsx
import React, { useState, useEffect } from 'react';
import { SplashCursor } from 'fluid-react';

function BatteryAwareSplashCursor() {
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [isCharging, setIsCharging] = useState(true);
  
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level);
        });
        
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }
  }, []);
  
  // Reduce performance when battery is low and not charging
  const lowBattery = batteryLevel < 0.2 && !isCharging;
  
  return (
    <SplashCursor 
      particleCount={lowBattery ? 25 : 150}
      targetFPS={lowBattery ? 20 : 60}
      intensity={lowBattery ? 0.3 : 0.8}
      pauseOnHidden={true}
    />
  );
}
```

### Performance Monitoring

#### Real-time Performance Display
```tsx
import React from 'react';
import { useSplashCursor } from 'fluid-react';

function PerformanceMonitoredSplash() {
  const { canvasRef, fps, particleCount, updateConfig } = useSplashCursor({
    intensity: 0.8,
    particleCount: 150
  });
  
  // Auto-adjust based on performance
  React.useEffect(() => {
    if (fps > 0) {
      if (fps < 25) {
        updateConfig({ particleCount: 50, intensity: 0.5 });
      } else if (fps < 40) {
        updateConfig({ particleCount: 100, intensity: 0.6 });
      } else if (fps > 55) {
        updateConfig({ particleCount: 150, intensity: 0.8 });
      }
    }
  }, [fps, updateConfig]);
  
  return (
    <div>
      <canvas 
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999
        }}
      />
      
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 10000
      }}>
        <div>FPS: {fps}</div>
        <div>Particles: {particleCount}</div>
        <div>Status: {fps < 30 ? '⚠️ Low' : fps < 50 ? '⚡ OK' : '✅ Good'}</div>
      </div>
    </div>
  );
}
```

## Creative Use Cases

### Gaming Website

#### Retro Gaming Theme
```tsx
function RetroGamingSplash() {
  return (
    <SplashCursor 
      colors={{
        mode: 'single',
        baseHue: 120,  // Green like old CRT monitors
        saturation: 100,
        lightness: 50
      }}
      intensity={1.0}
      particleCount={200}
      gravity={0}
      drag={0.99}
      style={{ 
        filter: 'contrast(1.2) brightness(1.1)',
        mixBlendMode: 'screen'
      }}
    />
  );
}
```

### Art Portfolio

#### Artistic Brush Effect
```tsx
function ArtisticSplash() {
  const [currentColor, setCurrentColor] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentColor(prev => (prev + 30) % 360);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <SplashCursor 
      colors={{
        mode: 'single',
        baseHue: currentColor,
        saturation: 85,
        lightness: 65
      }}
      intensity={0.9}
      particleCount={100}
      gravity={-0.02}  // Slight upward drift
      drag={0.995}
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
```

### E-commerce Site

#### Product Highlight Effect
```tsx
function EcommerceSplash() {
  const [isProductPage, setIsProductPage] = useState(false);
  
  useEffect(() => {
    // Detect product pages
    setIsProductPage(window.location.pathname.includes('/product/'));
  }, []);
  
  return (
    <SplashCursor 
      intensity={isProductPage ? 0.9 : 0.5}
      colors={{
        mode: 'single',
        baseHue: 45,   // Gold/yellow for luxury feel
        saturation: 80,
        lightness: 60
      }}
      particleCount={isProductPage ? 200 : 100}
    />
  );
}
```

### Music Website

#### Audio-Reactive Effect
```tsx
function AudioReactiveSplash() {
  const [audioLevel, setAudioLevel] = useState(0);
  
  useEffect(() => {
    // Simplified audio analysis
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new AudioContext();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const updateAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average / 255);
            requestAnimationFrame(updateAudioLevel);
          };
          
          updateAudioLevel();
        })
        .catch(console.error);
    }
  }, []);
  
  return (
    <SplashCursor 
      intensity={0.5 + audioLevel * 0.5}
      particleCount={Math.floor(100 + audioLevel * 100)}
      colors={{
        mode: 'velocity',
        saturation: 70 + audioLevel * 30,
        lightness: 50 + audioLevel * 20
      }}
    />
  );
}
```

### Educational Site

#### Science Theme
```tsx
function ScienceSplash() {
  return (
    <SplashCursor 
      colors={{
        mode: 'gradient',
        baseHue: 200,  // Blue science theme
        saturation: 90,
        lightness: 70
      }}
      intensity={0.7}
      particleCount={120}
      gravity={0.02}   // Simulate molecular movement
      bounceEnabled={true}
      style={{ 
        filter: 'blur(1px)',
        opacity: 0.8
      }}
    />
  );
}
```

These examples demonstrate the versatility and creative potential of the SplashCursor component across different use cases and industries.
# SplashCursor Migration Guide

This guide helps you migrate from existing fluid simulation components to the new SplashCursor component.

## Table of Contents

- [Migration Overview](#migration-overview)
- [From FluidBackground to SplashCursor](#from-fluidbackground-to-splashcursor)
- [From Custom Cursor Effects](#from-custom-cursor-effects)
- [From Third-Party Libraries](#from-third-party-libraries)
- [Step-by-Step Migration](#step-by-step-migration)
- [Configuration Mapping](#configuration-mapping)
- [Common Migration Issues](#common-migration-issues)
- [Gradual Migration Strategy](#gradual-migration-strategy)

## Migration Overview

### Why Migrate to SplashCursor?

SplashCursor offers several advantages over traditional fluid background components:

- **Cursor-Focused**: Specifically designed for cursor-following effects
- **Better Performance**: Optimized for particle-based rendering
- **Adaptive Quality**: Automatic performance adjustment
- **Mobile Optimized**: Better mobile device support
- **Simpler API**: More intuitive configuration options

### Key Differences

| Feature | FluidBackground | SplashCursor |
|---------|----------------|--------------|
| **Interaction Model** | Full-screen fluid simulation | Cursor-following particles |
| **Performance** | GPU-intensive WebGL | CPU-optimized Canvas 2D |
| **Mobile Support** | Limited | Excellent |
| **Customization** | Complex physics parameters | Intuitive visual controls |
| **Resource Usage** | High memory/GPU | Moderate CPU |

## From FluidBackground to SplashCursor

### Basic Migration

#### Before (FluidBackground)
```tsx
import { FluidBackground } from 'fluid-react';

function App() {
  return (
    <div>
      <FluidBackground 
        colors={{ fluid: 'rainbow' }}
        physics={{ viscosity: 0.3, curl: 30 }}
        interaction={{ intensity: 0.8 }}
      />
      <main>Content</main>
    </div>
  );
}
```

#### After (SplashCursor)
```tsx
import { SplashCursor } from 'fluid-react';

function App() {
  return (
    <div>
      <SplashCursor 
        colors={{ mode: 'rainbow' }}
        intensity={0.8}
        drag={0.997}  // Similar to viscosity
      />
      <main>Content</main>
    </div>
  );
}
```

### Configuration Mapping

#### Colors Configuration

```tsx
// FluidBackground colors
const fluidColors = {
  background: { r: 0, g: 0, b: 0 },
  fluid: 'rainbow'
};

// SplashCursor equivalent
const splashColors = {
  mode: 'rainbow',
  saturation: 80,
  lightness: 60
};

// Custom color arrays
const fluidCustomColors = {
  fluid: [
    { r: 0.9, g: 0.3, b: 0.4 },
    { r: 0.3, g: 0.7, b: 0.9 }
  ]
};

// SplashCursor doesn't use RGB arrays, use single color with hue cycling
const splashCustomColors = {
  mode: 'gradient',
  baseHue: 280,  // Purple-pink range
  cycleSpeed: 1.5
};
```

#### Physics Configuration

```tsx
// FluidBackground physics
const fluidPhysics = {
  viscosity: 0.3,    // Fluid thickness
  density: 0.8,      // Fluid density
  pressure: 0.8,     // Pressure solver
  curl: 30,          // Vorticity
  splatRadius: 0.25, // Interaction size
  splatForce: 6000   // Interaction strength
};

// SplashCursor equivalent
const splashPhysics = {
  drag: 0.997,       // Similar to viscosity (higher = thicker)
  gravity: 0.01,     // Vertical force
  intensity: 0.8,    // Similar to splatForce
  particleCount: 150 // Controls visual density
};
```

#### Performance Configuration

```tsx
// FluidBackground performance
const fluidPerformance = {
  resolution: 'medium',
  frameRate: 60,
  pauseOnHidden: true
};

// SplashCursor equivalent
const splashPerformance = {
  particleCount: 150,  // Similar to resolution
  targetFPS: 60,
  pauseOnHidden: true
};
```

### Advanced Migration Examples

#### Complex FluidBackground Setup
```tsx
// Original FluidBackground configuration
<FluidBackground 
  colors={{
    background: { r: 0.05, g: 0.05, b: 0.1 },
    fluid: [
      { r: 0.9, g: 0.3, b: 0.4 },
      { r: 0.3, g: 0.7, b: 0.9 },
      { r: 0.9, g: 0.8, b: 0.3 }
    ]
  }}
  physics={{
    viscosity: 0.5,
    curl: 25,
    splatRadius: 0.3,
    splatForce: 4000
  }}
  performance={{
    resolution: 'high',
    frameRate: 60
  }}
  interaction={{
    mouse: true,
    touch: true,
    intensity: 0.9
  }}
/>
```

#### Equivalent SplashCursor Configuration
```tsx
// Migrated SplashCursor configuration
<SplashCursor 
  colors={{
    mode: 'rainbow',     // Covers the multi-color effect
    saturation: 85,
    lightness: 65,
    cycleSpeed: 1.2      // Dynamic color changes
  }}
  intensity={0.9}        // Direct mapping from interaction.intensity
  drag={0.995}           // Higher drag = more viscous (0.5 viscosity)
  gravity={0.005}        // Subtle downward movement
  particleCount={200}    // High resolution equivalent
  targetFPS={60}
  bounceEnabled={true}   // Adds interactivity
  style={{
    // Dark background effect through styling
    backgroundColor: 'rgba(13, 13, 26, 0.1)'
  }}
/>
```

## From Custom Cursor Effects

### CSS-Based Cursor Effects

#### Before (CSS + JavaScript)
```css
.custom-cursor {
  position: fixed;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, rgba(255,0,150,0.8) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transition: transform 0.1s ease;
}

.cursor-trail {
  position: fixed;
  width: 10px;
  height: 10px;
  background: rgba(255,0,150,0.4);
  border-radius: 50%;
  pointer-events: none;
  animation: fade-out 1s ease-out forwards;
}
```

```javascript
// JavaScript cursor tracking
let trails = [];

document.addEventListener('mousemove', (e) => {
  // Update cursor position
  const cursor = document.querySelector('.custom-cursor');
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  
  // Create trail
  const trail = document.createElement('div');
  trail.className = 'cursor-trail';
  trail.style.left = e.clientX + 'px';
  trail.style.top = e.clientY + 'px';
  document.body.appendChild(trail);
  
  trails.push(trail);
  
  // Cleanup old trails
  setTimeout(() => {
    trail.remove();
    trails = trails.filter(t => t !== trail);
  }, 1000);
});
```

#### After (SplashCursor)
```tsx
// Much simpler with SplashCursor
<SplashCursor 
  colors={{
    mode: 'single',
    baseHue: 320,      // Pink/magenta
    saturation: 100,
    lightness: 60
  }}
  intensity={0.8}
  particleCount={100}
  drag={0.98}          // Faster fade than CSS animation
/>
```

### Canvas-Based Cursor Effects

#### Before (Custom Canvas Implementation)
```javascript
class CustomCursorEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    
    this.setupEventListeners();
    this.animate();
  }
  
  setupEventListeners() {
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.createParticle();
    });
  }
  
  createParticle() {
    this.particles.push({
      x: this.mouse.x,
      y: this.mouse.y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1.0,
      decay: 0.02
    });
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = `hsl(${Date.now() * 0.1 % 360}, 70%, 60%)`;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      return particle.life > 0;
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

// Usage
const canvas = document.getElementById('cursor-canvas');
new CustomCursorEffect(canvas);
```

#### After (SplashCursor)
```tsx
// Replaces entire custom implementation
<SplashCursor 
  colors={{ mode: 'rainbow' }}
  intensity={0.7}
  particleCount={120}
  gravity={0}
  drag={0.98}
/>
```

## From Third-Party Libraries

### From react-cursor-effects

#### Before
```tsx
import { CursorEffects } from 'react-cursor-effects';

<CursorEffects 
  type="trail"
  color="#ff0080"
  size={20}
  trailLength={10}
/>
```

#### After
```tsx
<SplashCursor 
  colors={{
    mode: 'single',
    baseHue: 320,  // #ff0080 equivalent
    saturation: 100,
    lightness: 50
  }}
  particleCount={100}  // Similar to trailLength * 10
  intensity={0.8}
/>
```

### From cursor-effects

#### Before
```javascript
import { fairyDustCursor } from 'cursor-effects';

fairyDustCursor({
  colors: ['#ff0000', '#00ff00', '#0000ff'],
  element: document.body
});
```

#### After
```tsx
<SplashCursor 
  colors={{ mode: 'rainbow' }}
  intensity={0.6}
  particleCount={80}
  gravity={-0.01}  // Floating effect like fairy dust
/>
```

## Step-by-Step Migration

### Step 1: Install and Import

```bash
# If not already installed
npm install fluid-react
```

```tsx
// Add to your imports
import { SplashCursor } from 'fluid-react';
```

### Step 2: Replace Component

```tsx
// Comment out old component
{/* <FluidBackground {...oldConfig} /> */}

// Add new component with basic config
<SplashCursor intensity={0.8} />
```

### Step 3: Map Configuration

```tsx
// Create configuration mapping function
const mapFluidToSplash = (fluidConfig) => {
  return {
    intensity: fluidConfig.interaction?.intensity || 0.8,
    colors: {
      mode: fluidConfig.colors?.fluid === 'rainbow' ? 'rainbow' : 'single',
      baseHue: 240  // Default blue
    },
    drag: 1 - (fluidConfig.physics?.viscosity || 0.3),
    particleCount: fluidConfig.performance?.resolution === 'high' ? 200 : 150,
    targetFPS: fluidConfig.performance?.frameRate || 60
  };
};

// Apply mapped configuration
<SplashCursor {...mapFluidToSplash(oldFluidConfig)} />
```

### Step 4: Test and Adjust

```tsx
// Add performance monitoring during migration
const MigrationTestComponent = () => {
  const { fps, particleCount } = useSplashCursor({
    intensity: 0.8,
    particleCount: 150
  });
  
  useEffect(() => {
    console.log(`Migration test - FPS: ${fps}, Particles: ${particleCount}`);
  }, [fps, particleCount]);
  
  return null;
};
```

### Step 5: Optimize for Your Use Case

```tsx
// Fine-tune based on your specific needs
<SplashCursor 
  intensity={0.7}           // Adjust visual strength
  particleCount={120}       // Optimize for performance
  colors={{
    mode: 'single',
    baseHue: 220,           // Match brand colors
    saturation: 80
  }}
  drag={0.995}              // Adjust trail length
  pauseOnHidden={true}      // Optimize resource usage
/>
```

## Configuration Mapping

### Complete Mapping Reference

```tsx
// Comprehensive mapping function
const migrateConfiguration = (oldConfig: any) => {
  const splashConfig: any = {};
  
  // Colors mapping
  if (oldConfig.colors?.fluid === 'rainbow') {
    splashConfig.colors = { mode: 'rainbow' };
  } else if (oldConfig.colors?.fluid === 'monochrome') {
    splashConfig.colors = { mode: 'single', baseHue: 0, saturation: 0 };
  } else if (Array.isArray(oldConfig.colors?.fluid)) {
    // Convert RGB array to single hue (approximate)
    const firstColor = oldConfig.colors.fluid[0];
    const hue = rgbToHue(firstColor.r, firstColor.g, firstColor.b);
    splashConfig.colors = { mode: 'single', baseHue: hue };
  }
  
  // Physics mapping
  if (oldConfig.physics) {
    splashConfig.drag = Math.max(0.9, 1 - (oldConfig.physics.viscosity || 0.3));
    splashConfig.gravity = (oldConfig.physics.density || 0.8) * 0.02;
  }
  
  // Interaction mapping
  if (oldConfig.interaction) {
    splashConfig.intensity = oldConfig.interaction.intensity || 0.8;
  }
  
  // Performance mapping
  if (oldConfig.performance) {
    const resolutionMap = {
      'low': 75,
      'medium': 150,
      'high': 250,
      'auto': 150
    };
    splashConfig.particleCount = resolutionMap[oldConfig.performance.resolution] || 150;
    splashConfig.targetFPS = oldConfig.performance.frameRate || 60;
    splashConfig.pauseOnHidden = oldConfig.performance.pauseOnHidden !== false;
  }
  
  return splashConfig;
};

// Helper function
const rgbToHue = (r: number, g: number, b: number): number => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  if (delta === 0) return 0;
  
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  
  return Math.round(hue * 60);
};
```

## Common Migration Issues

### Issue 1: Performance Differences

**Problem**: SplashCursor performs differently than FluidBackground

**Solution**:
```tsx
// Start with conservative settings
<SplashCursor 
  particleCount={100}  // Lower than default
  targetFPS={45}       // Conservative target
  intensity={0.6}      // Moderate intensity
/>

// Gradually increase based on performance
const [config, setConfig] = useState({ particleCount: 100 });
const { fps } = useSplashCursor(config);

useEffect(() => {
  if (fps > 50) {
    setConfig(prev => ({ 
      ...prev, 
      particleCount: Math.min(200, prev.particleCount + 25) 
    }));
  }
}, [fps]);
```

### Issue 2: Visual Differences

**Problem**: SplashCursor looks different from FluidBackground

**Solution**:
```tsx
// Adjust visual parameters to match expectations
<SplashCursor 
  intensity={0.9}        // Increase for more visible effect
  colors={{
    mode: 'rainbow',
    saturation: 90,      // More vibrant colors
    lightness: 70        // Brighter appearance
  }}
  drag={0.999}           // Longer trails
  particleCount={200}    // Denser effect
/>
```

### Issue 3: Mobile Compatibility

**Problem**: Effect doesn't work well on mobile

**Solution**:
```tsx
// Mobile-specific optimization
const [isMobile] = useState(() => 
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
);

<SplashCursor 
  particleCount={isMobile ? 50 : 150}
  targetFPS={isMobile ? 30 : 60}
  intensity={isMobile ? 0.5 : 0.8}
  pauseOnHidden={true}
/>
```

## Gradual Migration Strategy

### Phase 1: Side-by-Side Testing

```tsx
function GradualMigration() {
  const [useSplashCursor, setUseSplashCursor] = useState(false);
  
  return (
    <div>
      {useSplashCursor ? (
        <SplashCursor intensity={0.8} />
      ) : (
        <FluidBackground interaction={{ intensity: 0.8 }} />
      )}
      
      <button 
        onClick={() => setUseSplashCursor(!useSplashCursor)}
        style={{ position: 'fixed', top: 10, right: 10, zIndex: 10000 }}
      >
        Switch to {useSplashCursor ? 'FluidBackground' : 'SplashCursor'}
      </button>
    </div>
  );
}
```

### Phase 2: A/B Testing

```tsx
function ABTestMigration() {
  const [variant] = useState(() => Math.random() > 0.5 ? 'splash' : 'fluid');
  
  useEffect(() => {
    // Track which variant performs better
    analytics.track('cursor_effect_variant', { variant });
  }, [variant]);
  
  return variant === 'splash' ? (
    <SplashCursor intensity={0.8} />
  ) : (
    <FluidBackground interaction={{ intensity: 0.8 }} />
  );
}
```

### Phase 3: Feature Flag Migration

```tsx
function FeatureFlagMigration() {
  const [enableSplashCursor] = useFeatureFlag('splash-cursor-enabled');
  
  return enableSplashCursor ? (
    <SplashCursor intensity={0.8} />
  ) : (
    <FluidBackground interaction={{ intensity: 0.8 }} />
  );
}
```

### Phase 4: Complete Migration

```tsx
// Remove old component entirely
function CompleteMigration() {
  return (
    <div>
      <SplashCursor 
        intensity={0.8}
        colors={{ mode: 'rainbow' }}
        particleCount={150}
        pauseOnHidden={true}
      />
      <main>Your app content</main>
    </div>
  );
}
```

This migration guide provides a comprehensive path for transitioning from existing fluid effects to the new SplashCursor component while maintaining visual consistency and performance.
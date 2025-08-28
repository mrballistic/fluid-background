# CodeSandbox and StackBlitz Examples

This document provides ready-to-use examples for CodeSandbox and StackBlitz online editors.

## CodeSandbox Examples

### 1. Basic React Example

**Create a new React sandbox and replace the files with:**

#### `package.json`
```json
{
  "name": "splash-cursor-basic",
  "version": "1.0.0",
  "description": "Basic SplashCursor example",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "fluid-react": "^1.0.0"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

#### `src/App.js`
```jsx
import React from 'react';
import { SplashCursor } from 'fluid-react';
import './App.css';

function App() {
  return (
    <div className="App">
      <SplashCursor 
        intensity={0.8}
        colors={{ mode: 'rainbow' }}
        particleCount={150}
      />
      
      <header className="App-header">
        <h1>SplashCursor Demo</h1>
        <p>Move your cursor around to see the beautiful splash effect!</p>
        
        <div className="feature-grid">
          <div className="feature-card">
            <h3>🌈 Dynamic Colors</h3>
            <p>Beautiful rainbow colors that cycle smoothly</p>
          </div>
          <div className="feature-card">
            <h3>⚡ High Performance</h3>
            <p>Optimized for smooth 60fps animation</p>
          </div>
          <div className="feature-card">
            <h3>📱 Mobile Friendly</h3>
            <p>Works great on touch devices</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
```

#### `src/App.css`
```css
.App {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
}

.App-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.App-header h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.App-header p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 800px;
  margin-top: 2rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.feature-card p {
  opacity: 0.8;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .App-header h1 {
    font-size: 2rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .feature-card {
    padding: 1.5rem;
  }
}
```

**CodeSandbox URL:** `https://codesandbox.io/s/splash-cursor-basic`

### 2. Interactive Configuration Example

#### `src/App.js`
```jsx
import React, { useState } from 'react';
import { SplashCursor } from 'fluid-react';
import './App.css';

function App() {
  const [config, setConfig] = useState({
    intensity: 0.8,
    particleCount: 150,
    colorMode: 'rainbow',
    baseHue: 240,
    gravity: 0.01,
    drag: 0.997
  });

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getColorsConfig = () => {
    if (config.colorMode === 'single') {
      return { mode: 'single', baseHue: config.baseHue };
    }
    return { mode: config.colorMode };
  };

  return (
    <div className="App">
      <SplashCursor 
        intensity={config.intensity}
        particleCount={config.particleCount}
        colors={getColorsConfig()}
        gravity={config.gravity}
        drag={config.drag}
      />
      
      <div className="controls-panel">
        <h1>Interactive SplashCursor</h1>
        <p>Adjust the settings below to customize the cursor effect</p>
        
        <div className="controls-grid">
          <div className="control-group">
            <label>
              Intensity: {config.intensity}
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={config.intensity}
                onChange={(e) => updateConfig('intensity', parseFloat(e.target.value))}
              />
            </label>
          </div>
          
          <div className="control-group">
            <label>
              Particle Count: {config.particleCount}
              <input 
                type="range" 
                min="25" 
                max="300" 
                step="25" 
                value={config.particleCount}
                onChange={(e) => updateConfig('particleCount', parseInt(e.target.value))}
              />
            </label>
          </div>
          
          <div className="control-group">
            <label>
              Color Mode:
              <select 
                value={config.colorMode}
                onChange={(e) => updateConfig('colorMode', e.target.value)}
              >
                <option value="rainbow">Rainbow</option>
                <option value="single">Single Color</option>
                <option value="velocity">Velocity</option>
              </select>
            </label>
          </div>
          
          {config.colorMode === 'single' && (
            <div className="control-group">
              <label>
                Base Hue: {config.baseHue}°
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  step="10" 
                  value={config.baseHue}
                  onChange={(e) => updateConfig('baseHue', parseInt(e.target.value))}
                />
              </label>
            </div>
          )}
          
          <div className="control-group">
            <label>
              Gravity: {config.gravity}
              <input 
                type="range" 
                min="-0.05" 
                max="0.05" 
                step="0.005" 
                value={config.gravity}
                onChange={(e) => updateConfig('gravity', parseFloat(e.target.value))}
              />
            </label>
          </div>
          
          <div className="control-group">
            <label>
              Drag: {config.drag}
              <input 
                type="range" 
                min="0.9" 
                max="1" 
                step="0.001" 
                value={config.drag}
                onChange={(e) => updateConfig('drag', parseFloat(e.target.value))}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
```

**CodeSandbox URL:** `https://codesandbox.io/s/splash-cursor-interactive`

### 3. Gaming Theme Example

#### `src/App.js`
```jsx
import React, { useState, useEffect } from 'react';
import { SplashCursor } from 'fluid-react';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);

  const gameConfigs = {
    menu: {
      intensity: 0.6,
      colors: { mode: 'single', baseHue: 120, saturation: 70 },
      particleCount: 100,
      gravity: 0.005
    },
    playing: {
      intensity: 1.0,
      colors: { mode: 'velocity', saturation: 100 },
      particleCount: 200,
      gravity: 0,
      drag: 0.99
    },
    victory: {
      intensity: 0.9,
      colors: { mode: 'rainbow', cycleSpeed: 2.0 },
      particleCount: 250,
      gravity: -0.02,
      drag: 0.995
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setScore(prev => prev + 10);
      }, 1000);
      
      const timeout = setTimeout(() => {
        setGameState('victory');
      }, 10000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  const resetGame = () => {
    setScore(0);
    setGameState('menu');
  };

  return (
    <div className={`App game-${gameState}`}>
      <SplashCursor {...gameConfigs[gameState]} />
      
      <div className="game-ui">
        {gameState === 'menu' && (
          <div className="menu-screen">
            <h1>🎮 Epic Game</h1>
            <p>Experience dynamic cursor effects that react to gameplay!</p>
            <button onClick={startGame} className="game-button">
              Start Game
            </button>
          </div>
        )}
        
        {gameState === 'playing' && (
          <div className="game-screen">
            <div className="hud">
              <div className="score">Score: {score}</div>
              <div className="status">🔥 Action Mode Active</div>
            </div>
            <div className="game-content">
              <h2>Game in Progress</h2>
              <p>High-intensity cursor effects for maximum immersion!</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(score / 100) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        {gameState === 'victory' && (
          <div className="victory-screen">
            <h1>🏆 Victory!</h1>
            <p>Final Score: {score}</p>
            <p>Celebrate with rainbow particle effects!</p>
            <button onClick={resetGame} className="game-button">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

**CodeSandbox URL:** `https://codesandbox.io/s/splash-cursor-gaming`

## StackBlitz Examples

### 1. Next.js Integration

**Create a new Next.js project on StackBlitz:**

#### `package.json`
```json
{
  "name": "splash-cursor-nextjs",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "13.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "fluid-react": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "8.40.0",
    "eslint-config-next": "13.4.0",
    "typescript": "^5.0.0"
  }
}
```

#### `pages/_app.tsx`
```tsx
import type { AppProps } from 'next/app';
import { SplashCursor } from 'fluid-react';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <SplashCursor 
        intensity={0.8}
        colors={{ mode: 'rainbow' }}
        particleCount={150}
        pauseOnHidden={true}
      />
      <Component {...pageProps} />
    </>
  );
}
```

#### `pages/index.tsx`
```tsx
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>SplashCursor + Next.js</title>
        <meta name="description" content="SplashCursor with Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span>SplashCursor</span> + Next.js!
        </h1>

        <p className={styles.description}>
          Move your cursor around to see the beautiful splash effect
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>🚀 Performance</h2>
            <p>Optimized for production with automatic quality adjustment</p>
          </div>

          <div className={styles.card}>
            <h2>📱 Responsive</h2>
            <p>Works seamlessly across desktop and mobile devices</p>
          </div>

          <div className={styles.card}>
            <h2>🎨 Customizable</h2>
            <p>Extensive configuration options for any design</p>
          </div>

          <div className={styles.card}>
            <h2>⚡ Easy Setup</h2>
            <p>Just add the component and you're ready to go!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**StackBlitz URL:** `https://stackblitz.com/edit/splash-cursor-nextjs`

### 2. Vanilla JavaScript Example

#### `index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SplashCursor Vanilla JS</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .container {
      text-align: center;
      max-width: 800px;
      padding: 2rem;
    }

    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }

    .control-group {
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem;
      border-radius: 10px;
      backdrop-filter: blur(10px);
    }

    .control-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }

    .control-group input,
    .control-group select {
      width: 100%;
      padding: 0.5rem;
      border: none;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .control-group input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }

    button {
      padding: 1rem 2rem;
      border: none;
      border-radius: 10px;
      background: linear-gradient(45deg, #4ecdc4, #45b7d1);
      color: white;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.3s ease;
      margin: 0.5rem;
    }

    button:hover {
      transform: translateY(-2px);
    }

    button:disabled {
      background: #666;
      cursor: not-allowed;
      transform: none;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 10px;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #4ecdc4;
    }

    .stat-label {
      font-size: 0.8rem;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>SplashCursor Vanilla JS</h1>
    <p>Pure JavaScript implementation with full control</p>

    <div class="controls">
      <div class="control-group">
        <label for="intensity">Intensity</label>
        <input type="range" id="intensity" min="0" max="1" step="0.1" value="0.8">
      </div>
      
      <div class="control-group">
        <label for="particles">Particles</label>
        <input type="range" id="particles" min="25" max="300" step="25" value="150">
      </div>
      
      <div class="control-group">
        <label for="color-mode">Color Mode</label>
        <select id="color-mode">
          <option value="rainbow">Rainbow</option>
          <option value="single">Single</option>
          <option value="velocity">Velocity</option>
        </select>
      </div>
      
      <div class="control-group">
        <label for="gravity">Gravity</label>
        <input type="range" id="gravity" min="-0.05" max="0.05" step="0.005" value="0.01">
      </div>
    </div>

    <div>
      <button onclick="startEffect()">Start</button>
      <button onclick="stopEffect()">Stop</button>
      <button onclick="resetEffect()">Reset</button>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-value" id="fps">0</div>
        <div class="stat-label">FPS</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="particles-count">0</div>
        <div class="stat-label">Particles</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="status">Stopped</div>
        <div class="stat-label">Status</div>
      </div>
    </div>
  </div>

  <script type="module">
    // Import SplashCursor (in real implementation)
    // import { createSplashCursor } from 'https://unpkg.com/fluid-react/dist/vanilla.js';
    
    // For demo, we'll simulate the API
    let splashCursor = null;

    // Simulate SplashCursor API
    class DemoSplashCursor {
      constructor(config) {
        this.config = config;
        this.active = false;
        this.fps = 0;
        this.particleCount = 0;
      }

      start() {
        this.active = true;
        this.animate();
      }

      stop() {
        this.active = false;
      }

      reset() {
        this.particleCount = 0;
        this.fps = 0;
      }

      updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
      }

      animate() {
        if (!this.active) return;
        
        // Simulate performance
        this.fps = Math.max(20, 60 - (this.config.particleCount - 50) * 0.1 + (Math.random() - 0.5) * 10);
        this.particleCount = Math.floor(this.config.particleCount * (0.8 + Math.random() * 0.2));
        
        requestAnimationFrame(() => this.animate());
      }

      getFPS() { return Math.round(this.fps); }
      getParticleCount() { return this.particleCount; }
      isActive() { return this.active; }
    }

    function initSplashCursor() {
      splashCursor = new DemoSplashCursor({
        intensity: 0.8,
        particleCount: 150,
        colors: { mode: 'rainbow' },
        gravity: 0.01
      });
      
      // Start monitoring
      setInterval(updateStats, 100);
      
      // Setup controls
      setupControls();
    }

    function setupControls() {
      document.getElementById('intensity').addEventListener('input', (e) => {
        splashCursor.updateConfig({ intensity: parseFloat(e.target.value) });
      });
      
      document.getElementById('particles').addEventListener('input', (e) => {
        splashCursor.updateConfig({ particleCount: parseInt(e.target.value) });
      });
      
      document.getElementById('color-mode').addEventListener('change', (e) => {
        splashCursor.updateConfig({ colors: { mode: e.target.value } });
      });
      
      document.getElementById('gravity').addEventListener('input', (e) => {
        splashCursor.updateConfig({ gravity: parseFloat(e.target.value) });
      });
    }

    function updateStats() {
      if (!splashCursor) return;
      
      document.getElementById('fps').textContent = splashCursor.getFPS();
      document.getElementById('particles-count').textContent = splashCursor.getParticleCount();
      document.getElementById('status').textContent = splashCursor.isActive() ? 'Running' : 'Stopped';
    }

    window.startEffect = () => {
      if (splashCursor) splashCursor.start();
    };

    window.stopEffect = () => {
      if (splashCursor) splashCursor.stop();
    };

    window.resetEffect = () => {
      if (splashCursor) splashCursor.reset();
    };

    // Initialize
    initSplashCursor();
  </script>
</body>
</html>
```

**StackBlitz URL:** `https://stackblitz.com/edit/splash-cursor-vanilla`

### 3. Vue.js Integration

#### `package.json`
```json
{
  "name": "splash-cursor-vue",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build"
  },
  "dependencies": {
    "vue": "^3.2.0",
    "fluid-react": "^1.0.0"
  },
  "devDependencies": {
    "@vue/cli-service": "~5.0.0"
  }
}
```

#### `src/App.vue`
```vue
<template>
  <div id="app">
    <div class="splash-cursor-container" ref="splashContainer"></div>
    
    <div class="content">
      <h1>SplashCursor + Vue.js</h1>
      <p>Beautiful cursor effects in Vue applications</p>
      
      <div class="controls">
        <div class="control-group">
          <label>Intensity: {{ intensity }}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            v-model="intensity"
            @input="updateConfig"
          />
        </div>
        
        <div class="control-group">
          <label>Particles: {{ particleCount }}</label>
          <input 
            type="range" 
            min="25" 
            max="300" 
            step="25" 
            v-model="particleCount"
            @input="updateConfig"
          />
        </div>
        
        <div class="control-group">
          <label>Color Mode:</label>
          <select v-model="colorMode" @change="updateConfig">
            <option value="rainbow">Rainbow</option>
            <option value="single">Single</option>
            <option value="velocity">Velocity</option>
          </select>
        </div>
      </div>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{{ fps }}</div>
          <div class="stat-label">FPS</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ activeParticles }}</div>
          <div class="stat-label">Particles</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import { createSplashCursor } from 'fluid-react/vanilla';

export default {
  name: 'App',
  data() {
    return {
      splashCursor: null,
      intensity: 0.8,
      particleCount: 150,
      colorMode: 'rainbow',
      fps: 0,
      activeParticles: 0
    };
  },
  mounted() {
    this.initSplashCursor();
    this.startMonitoring();
  },
  beforeUnmount() {
    if (this.splashCursor) {
      this.splashCursor.destroy();
    }
  },
  methods: {
    initSplashCursor() {
      // Simulate SplashCursor initialization
      this.splashCursor = {
        updateConfig: (config) => {
          console.log('Config updated:', config);
        },
        getFPS: () => Math.round(60 - (this.particleCount - 50) * 0.1 + (Math.random() - 0.5) * 10),
        getParticleCount: () => Math.floor(this.particleCount * (0.8 + Math.random() * 0.2))
      };
    },
    updateConfig() {
      if (this.splashCursor) {
        this.splashCursor.updateConfig({
          intensity: parseFloat(this.intensity),
          particleCount: parseInt(this.particleCount),
          colors: { mode: this.colorMode }
        });
      }
    },
    startMonitoring() {
      setInterval(() => {
        if (this.splashCursor) {
          this.fps = this.splashCursor.getFPS();
          this.activeParticles = this.splashCursor.getParticleCount();
        }
      }, 100);
    }
  }
};
</script>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-height: 100vh;
  padding: 2rem;
}

.content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.control-group {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 10px;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.control-group input,
.control-group select {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
}

.stat {
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 10px;
  min-width: 100px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #4ecdc4;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>
```

**StackBlitz URL:** `https://stackblitz.com/edit/splash-cursor-vue`

## Quick Setup Instructions

### For CodeSandbox:
1. Go to [codesandbox.io](https://codesandbox.io)
2. Click "Create Sandbox"
3. Choose your framework (React, Vue, etc.)
4. Replace the default files with the examples above
5. The sandbox will automatically install dependencies and run

### For StackBlitz:
1. Go to [stackblitz.com](https://stackblitz.com)
2. Click "Create Project"
3. Choose your framework template
4. Replace the default files with the examples above
5. The project will automatically build and run

### Direct Links (when available):
- Basic React: `https://codesandbox.io/s/splash-cursor-basic`
- Interactive: `https://codesandbox.io/s/splash-cursor-interactive`
- Gaming Theme: `https://codesandbox.io/s/splash-cursor-gaming`
- Next.js: `https://stackblitz.com/edit/splash-cursor-nextjs`
- Vanilla JS: `https://stackblitz.com/edit/splash-cursor-vanilla`
- Vue.js: `https://stackblitz.com/edit/splash-cursor-vue`

These examples provide a comprehensive starting point for developers to experiment with SplashCursor in their preferred development environment.
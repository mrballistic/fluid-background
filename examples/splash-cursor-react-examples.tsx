/**
 * SplashCursor React Examples
 * 
 * This file contains comprehensive examples of using SplashCursor in React applications
 * for various common use cases and scenarios.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SplashCursor, useSplashCursor } from 'fluid-react';

// ============================================================================
// Example 1: Basic Usage
// ============================================================================

export function BasicExample() {
  return (
    <div className="app">
      <SplashCursor />
      <main>
        <h1>Welcome to My Website</h1>
        <p>Move your cursor around to see the splash effect!</p>
      </main>
    </div>
  );
}

// ============================================================================
// Example 2: E-commerce Product Showcase
// ============================================================================

export function EcommerceExample() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductPage, setIsProductPage] = useState(false);

  return (
    <div className="ecommerce-site">
      <SplashCursor 
        intensity={isProductPage ? 0.9 : 0.6}
        colors={{
          mode: 'single',
          baseHue: 45,  // Gold for luxury feel
          saturation: 80,
          lightness: 60
        }}
        particleCount={isProductPage ? 200 : 120}
        style={{ mixBlendMode: 'screen' }}
      />
      
      <header>
        <h1>Luxury Store</h1>
        <nav>
          <button onClick={() => setIsProductPage(false)}>Home</button>
          <button onClick={() => setIsProductPage(true)}>Products</button>
        </nav>
      </header>
      
      <main>
        {isProductPage ? (
          <div className="product-showcase">
            <h2>Featured Product</h2>
            <div className="product-card">
              <img src="/api/placeholder/300/300" alt="Product" />
              <h3>Premium Item</h3>
              <p>$299.99</p>
            </div>
          </div>
        ) : (
          <div className="hero">
            <h2>Discover Luxury</h2>
            <p>Premium products with premium experience</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// Example 3: Gaming Website
// ============================================================================

export function GamingExample() {
  const [gameMode, setGameMode] = useState<'menu' | 'action' | 'victory'>('menu');
  
  const getGameConfig = () => {
    switch (gameMode) {
      case 'action':
        return {
          intensity: 1.0,
          colors: { mode: 'velocity' as const, saturation: 100, lightness: 60 },
          particleCount: 250,
          gravity: 0,
          drag: 0.99
        };
      case 'victory':
        return {
          intensity: 0.9,
          colors: { mode: 'rainbow' as const, cycleSpeed: 2.0 },
          particleCount: 300,
          gravity: -0.02,
          drag: 0.995
        };
      default:
        return {
          intensity: 0.7,
          colors: { mode: 'single' as const, baseHue: 120, saturation: 80 },
          particleCount: 150
        };
    }
  };

  return (
    <div className="gaming-site">
      <SplashCursor 
        {...getGameConfig()}
        style={{ 
          filter: 'contrast(1.2) brightness(1.1)',
          mixBlendMode: 'screen'
        }}
      />
      
      <div className="game-ui">
        <h1>Epic Game</h1>
        <div className="mode-selector">
          <button 
            onClick={() => setGameMode('menu')}
            className={gameMode === 'menu' ? 'active' : ''}
          >
            Menu
          </button>
          <button 
            onClick={() => setGameMode('action')}
            className={gameMode === 'action' ? 'active' : ''}
          >
            Action Mode
          </button>
          <button 
            onClick={() => setGameMode('victory')}
            className={gameMode === 'victory' ? 'active' : ''}
          >
            Victory!
          </button>
        </div>
        
        <div className="game-content">
          {gameMode === 'menu' && (
            <div>
              <h2>Main Menu</h2>
              <p>Select a game mode to see different cursor effects</p>
            </div>
          )}
          {gameMode === 'action' && (
            <div>
              <h2>Action Mode</h2>
              <p>High-intensity cursor effects for fast-paced gameplay</p>
            </div>
          )}
          {gameMode === 'victory' && (
            <div>
              <h2>Victory!</h2>
              <p>Celebratory rainbow effects with floating particles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Art Portfolio
// ============================================================================

export function ArtPortfolioExample() {
  const [currentArtwork, setCurrentArtwork] = useState(0);
  
  const artworks = [
    { name: 'Sunset', hue: 30, description: 'Warm orange and yellow tones' },
    { name: 'Ocean', hue: 200, description: 'Cool blue depths' },
    { name: 'Forest', hue: 120, description: 'Natural green harmony' },
    { name: 'Passion', hue: 340, description: 'Vibrant pink energy' }
  ];

  const currentArt = artworks[currentArtwork];

  return (
    <div className="art-portfolio">
      <SplashCursor 
        colors={{
          mode: 'gradient',
          baseHue: currentArt.hue,
          saturation: 85,
          lightness: 65,
          cycleSpeed: 0.8
        }}
        intensity={0.8}
        particleCount={120}
        gravity={-0.01}  // Slight upward drift for artistic feel
        drag={0.996}
        style={{ mixBlendMode: 'multiply' }}
      />
      
      <header>
        <h1>Artist Portfolio</h1>
        <p>Interactive art with dynamic cursor effects</p>
      </header>
      
      <main>
        <div className="artwork-display">
          <h2>{currentArt.name}</h2>
          <div className="artwork-frame">
            <div 
              className="artwork"
              style={{ 
                background: `linear-gradient(45deg, 
                  hsl(${currentArt.hue}, 70%, 80%), 
                  hsl(${(currentArt.hue + 60) % 360}, 70%, 60%))` 
              }}
            />
          </div>
          <p>{currentArt.description}</p>
        </div>
        
        <div className="artwork-navigation">
          {artworks.map((art, index) => (
            <button
              key={index}
              onClick={() => setCurrentArtwork(index)}
              className={index === currentArtwork ? 'active' : ''}
              style={{ 
                background: `hsl(${art.hue}, 60%, 70%)`,
                color: 'white'
              }}
            >
              {art.name}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Example 5: Music Website with Audio Reactivity
// ============================================================================

export function MusicExample() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentTrack, setCurrentTrack] = useState('ambient');

  // Simulate audio analysis (in real app, use Web Audio API)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      // Simulate audio level fluctuation
      setAudioLevel(Math.random() * 0.8 + 0.2);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const getTrackConfig = () => {
    const baseConfig = {
      intensity: 0.5 + audioLevel * 0.5,
      particleCount: Math.floor(100 + audioLevel * 100),
      drag: 0.995 + audioLevel * 0.004
    };

    switch (currentTrack) {
      case 'electronic':
        return {
          ...baseConfig,
          colors: { mode: 'velocity' as const, saturation: 90, lightness: 60 },
          gravity: 0
        };
      case 'classical':
        return {
          ...baseConfig,
          colors: { mode: 'single' as const, baseHue: 240, saturation: 60, lightness: 70 },
          gravity: -0.005
        };
      default:
        return {
          ...baseConfig,
          colors: { mode: 'rainbow' as const, cycleSpeed: 1 + audioLevel },
          gravity: audioLevel * 0.02
        };
    }
  };

  return (
    <div className="music-site">
      <SplashCursor 
        {...getTrackConfig()}
        style={{ 
          filter: `blur(${audioLevel}px) brightness(${1 + audioLevel * 0.3})`,
          mixBlendMode: 'screen'
        }}
      />
      
      <div className="music-player">
        <h1>Music Visualizer</h1>
        
        <div className="track-selector">
          <button 
            onClick={() => setCurrentTrack('ambient')}
            className={currentTrack === 'ambient' ? 'active' : ''}
          >
            Ambient
          </button>
          <button 
            onClick={() => setCurrentTrack('electronic')}
            className={currentTrack === 'electronic' ? 'active' : ''}
          >
            Electronic
          </button>
          <button 
            onClick={() => setCurrentTrack('classical')}
            className={currentTrack === 'classical' ? 'active' : ''}
          >
            Classical
          </button>
        </div>
        
        <div className="player-controls">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="play-button"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="audio-visualizer">
            <div 
              className="level-bar"
              style={{ 
                height: `${audioLevel * 100}%`,
                background: `hsl(${audioLevel * 120}, 70%, 60%)`
              }}
            />
          </div>
        </div>
        
        <p>
          {isPlaying 
            ? `Playing ${currentTrack} music - cursor reacts to audio!`
            : 'Press play to start audio-reactive cursor effects'
          }
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Performance-Optimized Mobile
// ============================================================================

export function MobileOptimizedExample() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isLowEnd: false,
    batteryLevel: 1,
    isCharging: true
  });

  useEffect(() => {
    // Detect device capabilities
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || window.innerWidth < 768;
    
    const isLowEnd = navigator.hardwareConcurrency < 4 || (navigator as any).deviceMemory < 4;
    
    setDeviceInfo(prev => ({ ...prev, isMobile, isLowEnd }));

    // Battery API (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setDeviceInfo(prev => ({
          ...prev,
          batteryLevel: battery.level,
          isCharging: battery.charging
        }));
        
        battery.addEventListener('levelchange', () => {
          setDeviceInfo(prev => ({ ...prev, batteryLevel: battery.level }));
        });
      });
    }
  }, []);

  const getOptimalConfig = () => {
    const { isMobile, isLowEnd, batteryLevel, isCharging } = deviceInfo;
    
    // Very conservative for low battery
    if (batteryLevel < 0.2 && !isCharging) {
      return {
        particleCount: 20,
        targetFPS: 15,
        intensity: 0.2,
        drag: 0.9
      };
    }
    
    // Low-end device optimization
    if (isLowEnd) {
      return {
        particleCount: 40,
        targetFPS: 24,
        intensity: 0.4,
        drag: 0.93
      };
    }
    
    // Mobile optimization
    if (isMobile) {
      return {
        particleCount: 75,
        targetFPS: 30,
        intensity: 0.6,
        drag: 0.95
      };
    }
    
    // Desktop default
    return {
      particleCount: 150,
      targetFPS: 60,
      intensity: 0.8,
      drag: 0.997
    };
  };

  return (
    <div className="mobile-optimized">
      <SplashCursor 
        {...getOptimalConfig()}
        colors={{ mode: 'rainbow' }}
        pauseOnHidden={true}
      />
      
      <div className="device-info">
        <h1>Mobile-Optimized Demo</h1>
        <div className="info-grid">
          <div>Device: {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}</div>
          <div>Performance: {deviceInfo.isLowEnd ? 'Low-end' : 'Standard'}</div>
          <div>Battery: {Math.round(deviceInfo.batteryLevel * 100)}%</div>
          <div>Charging: {deviceInfo.isCharging ? 'Yes' : 'No'}</div>
        </div>
        
        <p>
          This example automatically adjusts cursor effect settings based on your device 
          capabilities and battery status for optimal performance.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Example 7: Theme-Aware Integration
// ============================================================================

export function ThemeAwareExample() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Detect system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const currentTheme = theme === 'auto' ? systemTheme : theme;
  
  const getThemeConfig = () => {
    if (currentTheme === 'dark') {
      return {
        colors: {
          mode: 'single' as const,
          baseHue: 200,
          saturation: 70,
          lightness: 80
        },
        intensity: 0.7,
        style: { mixBlendMode: 'screen' as const }
      };
    } else {
      return {
        colors: {
          mode: 'single' as const,
          baseHue: 240,
          saturation: 60,
          lightness: 40
        },
        intensity: 0.5,
        style: { mixBlendMode: 'multiply' as const }
      };
    }
  };

  return (
    <div className={`theme-aware ${currentTheme}`}>
      <SplashCursor 
        {...getThemeConfig()}
        particleCount={120}
      />
      
      <div className="theme-controls">
        <h1>Theme-Aware Cursor</h1>
        
        <div className="theme-selector">
          <button 
            onClick={() => setTheme('light')}
            className={theme === 'light' ? 'active' : ''}
          >
            ☀️ Light
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={theme === 'dark' ? 'active' : ''}
          >
            🌙 Dark
          </button>
          <button 
            onClick={() => setTheme('auto')}
            className={theme === 'auto' ? 'active' : ''}
          >
            🔄 Auto
          </button>
        </div>
        
        <p>
          Current theme: <strong>{currentTheme}</strong>
          {theme === 'auto' && ' (following system preference)'}
        </p>
        
        <p>
          The cursor effect automatically adapts its colors and blend mode 
          to work well with both light and dark themes.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Example 8: Hook-Based Custom Implementation
// ============================================================================

export function CustomHookExample() {
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
    particleCount: 150,
    colors: { mode: 'rainbow' }
  });

  const [showStats, setShowStats] = useState(true);
  const [autoOptimize, setAutoOptimize] = useState(true);

  // Auto-optimization based on performance
  useEffect(() => {
    if (!autoOptimize) return;

    if (fps > 0 && fps < 30) {
      updateConfig({ 
        particleCount: Math.max(50, particleCount - 25),
        intensity: 0.6
      });
    } else if (fps > 55 && particleCount < 150) {
      updateConfig({ 
        particleCount: Math.min(150, particleCount + 25),
        intensity: 0.8
      });
    }
  }, [fps, particleCount, autoOptimize, updateConfig]);

  return (
    <div className="custom-hook-example">
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
      
      <div className="controls">
        <h1>Custom Hook Implementation</h1>
        
        <div className="control-buttons">
          <button onClick={start} disabled={isActive}>
            Start
          </button>
          <button onClick={stop} disabled={!isActive}>
            Stop
          </button>
          <button onClick={reset}>
            Reset
          </button>
        </div>
        
        <div className="options">
          <label>
            <input 
              type="checkbox" 
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
            />
            Show Performance Stats
          </label>
          
          <label>
            <input 
              type="checkbox" 
              checked={autoOptimize}
              onChange={(e) => setAutoOptimize(e.target.checked)}
            />
            Auto-Optimize Performance
          </label>
        </div>
        
        {showStats && (
          <div className="stats">
            <div>Status: {isActive ? '✅ Active' : '❌ Inactive'}</div>
            <div>FPS: {fps}</div>
            <div>Particles: {particleCount}</div>
            <div>Performance: {
              fps >= 50 ? '🟢 Excellent' : 
              fps >= 30 ? '🟡 Good' : 
              '🔴 Poor'
            }</div>
          </div>
        )}
        
        <div className="config-controls">
          <button onClick={() => updateConfig({ colors: { mode: 'rainbow' } })}>
            Rainbow Colors
          </button>
          <button onClick={() => updateConfig({ colors: { mode: 'single', baseHue: 240 } })}>
            Blue Theme
          </button>
          <button onClick={() => updateConfig({ intensity: 0.3 })}>
            Subtle Effect
          </button>
          <button onClick={() => updateConfig({ intensity: 1.0 })}>
            Intense Effect
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 9: Conditional Rendering Based on User Preferences
// ============================================================================

export function AccessibilityAwareExample() {
  const [userPreferences, setUserPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    enableEffects: true
  });

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    setUserPreferences(prev => ({ ...prev, reducedMotion, highContrast }));
  }, []);

  // Don't render if user prefers reduced motion and hasn't explicitly enabled
  if (userPreferences.reducedMotion && !userPreferences.enableEffects) {
    return (
      <div className="accessibility-aware">
        <div className="no-effects-message">
          <h1>Accessibility-Friendly Mode</h1>
          <p>Cursor effects are disabled based on your system preferences.</p>
          <button onClick={() => setUserPreferences(prev => ({ ...prev, enableEffects: true }))}>
            Enable Effects Anyway
          </button>
        </div>
      </div>
    );
  }

  const getAccessibleConfig = () => {
    return {
      intensity: userPreferences.reducedMotion ? 0.3 : 0.8,
      particleCount: userPreferences.reducedMotion ? 50 : 150,
      colors: {
        mode: 'single' as const,
        baseHue: 240,
        saturation: userPreferences.highContrast ? 100 : 70,
        lightness: userPreferences.highContrast ? 80 : 60
      },
      drag: userPreferences.reducedMotion ? 0.9 : 0.997
    };
  };

  return (
    <div className="accessibility-aware">
      <SplashCursor {...getAccessibleConfig()} />
      
      <div className="accessibility-controls">
        <h1>Accessibility-Aware Cursor</h1>
        
        <div className="preferences">
          <h3>Accessibility Preferences</h3>
          
          <label>
            <input 
              type="checkbox" 
              checked={userPreferences.enableEffects}
              onChange={(e) => setUserPreferences(prev => ({ 
                ...prev, 
                enableEffects: e.target.checked 
              }))}
            />
            Enable Cursor Effects
          </label>
          
          <div className="system-preferences">
            <div>Reduced Motion: {userPreferences.reducedMotion ? '✅' : '❌'}</div>
            <div>High Contrast: {userPreferences.highContrast ? '✅' : '❌'}</div>
          </div>
        </div>
        
        <p>
          This example respects system accessibility preferences and provides 
          user controls for customizing the experience.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Example 10: Multi-Instance Demo
// ============================================================================

export function MultiInstanceExample() {
  const [activeInstances, setActiveInstances] = useState([true, false, false]);

  const toggleInstance = (index: number) => {
    setActiveInstances(prev => 
      prev.map((active, i) => i === index ? !active : active)
    );
  };

  const instances = [
    {
      name: 'Main Cursor',
      config: {
        intensity: 0.8,
        colors: { mode: 'rainbow' as const },
        zIndex: 9999
      }
    },
    {
      name: 'Background Effect',
      config: {
        intensity: 0.3,
        colors: { mode: 'single' as const, baseHue: 240, saturation: 40 },
        particleCount: 75,
        gravity: -0.01,
        zIndex: 1
      }
    },
    {
      name: 'Accent Layer',
      config: {
        intensity: 0.5,
        colors: { mode: 'single' as const, baseHue: 60, saturation: 80 },
        particleCount: 50,
        drag: 0.99,
        zIndex: 5000
      }
    }
  ];

  return (
    <div className="multi-instance">
      {instances.map((instance, index) => 
        activeInstances[index] && (
          <SplashCursor 
            key={index}
            {...instance.config}
          />
        )
      )}
      
      <div className="instance-controls">
        <h1>Multi-Instance Demo</h1>
        <p>Multiple cursor effects can run simultaneously with different configurations.</p>
        
        <div className="instance-toggles">
          {instances.map((instance, index) => (
            <div key={index} className="instance-control">
              <label>
                <input 
                  type="checkbox"
                  checked={activeInstances[index]}
                  onChange={() => toggleInstance(index)}
                />
                {instance.name}
              </label>
              <div className="instance-info">
                Z-Index: {instance.config.zIndex}, 
                Intensity: {instance.config.intensity}
              </div>
            </div>
          ))}
        </div>
        
        <div className="layering-explanation">
          <h3>Layer Configuration:</h3>
          <ul>
            <li><strong>Main Cursor</strong> (z-index: 9999) - Primary interactive effect</li>
            <li><strong>Accent Layer</strong> (z-index: 5000) - Mid-layer decorative effect</li>
            <li><strong>Background Effect</strong> (z-index: 1) - Subtle background ambiance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CSS Styles (would typically be in separate CSS files)
// ============================================================================

export const exampleStyles = `
  .app {
    min-height: 100vh;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .ecommerce-site {
    min-height: 100vh;
    background: #1a1a1a;
    color: white;
  }

  .gaming-site {
    min-height: 100vh;
    background: radial-gradient(circle, #0a0a0a 0%, #1a1a1a 100%);
    color: #00ff00;
    font-family: 'Courier New', monospace;
  }

  .art-portfolio {
    min-height: 100vh;
    background: #f8f8f8;
    color: #333;
  }

  .music-site {
    min-height: 100vh;
    background: linear-gradient(45deg, #1a1a2e, #16213e);
    color: white;
  }

  .mobile-optimized {
    min-height: 100vh;
    padding: 20px;
    background: linear-gradient(135deg, #2c3e50, #3498db);
    color: white;
  }

  .theme-aware.light {
    background: #ffffff;
    color: #333333;
  }

  .theme-aware.dark {
    background: #1a1a1a;
    color: #ffffff;
  }

  .custom-hook-example {
    min-height: 100vh;
    padding: 20px;
    background: #2c3e50;
    color: white;
  }

  .accessibility-aware {
    min-height: 100vh;
    padding: 20px;
    background: #34495e;
    color: white;
  }

  .multi-instance {
    min-height: 100vh;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  /* Common styles */
  .controls, .device-info, .theme-controls, .accessibility-controls, .instance-controls {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    backdrop-filter: blur(10px);
  }

  .button-group, .control-buttons {
    display: flex;
    gap: 10px;
    margin: 20px 0;
  }

  .button-group button, .control-buttons button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background: #3498db;
    color: white;
    cursor: pointer;
    transition: background 0.3s;
  }

  .button-group button:hover, .control-buttons button:hover {
    background: #2980b9;
  }

  .button-group button:disabled, .control-buttons button:disabled {
    background: #7f8c8d;
    cursor: not-allowed;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin: 20px 0;
    padding: 15px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 5px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
    margin: 20px 0;
  }

  .mode-selector, .theme-selector {
    display: flex;
    gap: 10px;
    margin: 20px 0;
  }

  .mode-selector button, .theme-selector button {
    padding: 8px 16px;
    border: 2px solid transparent;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
    cursor: pointer;
    transition: all 0.3s;
  }

  .mode-selector button.active, .theme-selector button.active {
    border-color: #3498db;
    background: rgba(52, 152, 219, 0.2);
  }

  .artwork-navigation {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
  }

  .artwork-frame {
    width: 300px;
    height: 300px;
    margin: 20px auto;
    border: 10px solid #333;
    border-radius: 10px;
    overflow: hidden;
  }

  .artwork {
    width: 100%;
    height: 100%;
  }

  .player-controls {
    display: flex;
    align-items: center;
    gap: 20px;
    margin: 20px 0;
  }

  .play-button {
    width: 60px;
    height: 60px;
    border: none;
    border-radius: 50%;
    background: #3498db;
    color: white;
    font-size: 20px;
    cursor: pointer;
  }

  .audio-visualizer {
    width: 100px;
    height: 40px;
    background: #333;
    border-radius: 5px;
    position: relative;
    overflow: hidden;
  }

  .level-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    transition: height 0.1s ease;
  }

  .instance-toggles {
    margin: 20px 0;
  }

  .instance-control {
    margin: 10px 0;
    padding: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 5px;
  }

  .instance-info {
    font-size: 0.9em;
    opacity: 0.7;
    margin-top: 5px;
  }

  .layering-explanation {
    margin-top: 30px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 5px;
  }

  .layering-explanation ul {
    margin: 10px 0;
    padding-left: 20px;
  }

  .no-effects-message {
    text-align: center;
    padding: 60px 20px;
  }

  .no-effects-message button {
    margin-top: 20px;
    padding: 12px 24px;
    border: none;
    border-radius: 5px;
    background: #3498db;
    color: white;
    cursor: pointer;
    font-size: 16px;
  }
`;
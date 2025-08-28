import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import FluidCursor from './components/FluidCursor/FluidCursor';

function FluidCursorDemo() {
  const [config, setConfig] = useState({
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    CURL: 30,
    COLOR_UPDATE_SPEED: 10,
    TRANSPARENT: true,
  });

  const updateConfig = (key: string, value: number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <FluidCursor
        SPLAT_RADIUS={config.SPLAT_RADIUS}
        SPLAT_FORCE={config.SPLAT_FORCE}
        DENSITY_DISSIPATION={config.DENSITY_DISSIPATION}
        VELOCITY_DISSIPATION={config.VELOCITY_DISSIPATION}
        PRESSURE={config.PRESSURE}
        CURL={config.CURL}
        COLOR_UPDATE_SPEED={config.COLOR_UPDATE_SPEED}
        TRANSPARENT={config.TRANSPARENT}
        BACK_COLOR={{ r: 0, g: 0, b: 0 }}
      />
      
      <div className="demo-content">
        <h1>FluidCursor Demo</h1>
        <p>Move your mouse around to create beautiful fluid effects!</p>
      </div>

      <div className="controls">
        <h3>Controls</h3>
        
        <div className="control-group">
          <label>Splat Radius: {config.SPLAT_RADIUS}</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={config.SPLAT_RADIUS}
            onChange={(e) => updateConfig('SPLAT_RADIUS', parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Splat Force: {config.SPLAT_FORCE}</label>
          <input
            type="range"
            min="1000"
            max="15000"
            step="500"
            value={config.SPLAT_FORCE}
            onChange={(e) => updateConfig('SPLAT_FORCE', parseInt(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Density Dissipation: {config.DENSITY_DISSIPATION}</label>
          <input
            type="range"
            min="0.9"
            max="1"
            step="0.01"
            value={config.DENSITY_DISSIPATION}
            onChange={(e) => updateConfig('DENSITY_DISSIPATION', parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Velocity Dissipation: {config.VELOCITY_DISSIPATION}</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={config.VELOCITY_DISSIPATION}
            onChange={(e) => updateConfig('VELOCITY_DISSIPATION', parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Pressure: {config.PRESSURE}</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={config.PRESSURE}
            onChange={(e) => updateConfig('PRESSURE', parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Curl: {config.CURL}</label>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={config.CURL}
            onChange={(e) => updateConfig('CURL', parseInt(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Color Speed: {config.COLOR_UPDATE_SPEED}</label>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={config.COLOR_UPDATE_SPEED}
            onChange={(e) => updateConfig('COLOR_UPDATE_SPEED', parseInt(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={config.TRANSPARENT}
              onChange={(e) => updateConfig('TRANSPARENT', e.target.checked)}
            />
            Transparent Background
          </label>
        </div>
      </div>
    </>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<FluidCursorDemo />);
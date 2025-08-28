import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import FluidCursorCustomExample from '../fluid-cursor-custom';

// Mock the FluidCursor component
vi.mock('../../src/components/FluidCursor', () => ({
  default:
  function MockFluidCursor(props: any) {
    return (
      <canvas 
        data-testid="fluid-cursor-canvas"
        data-props={JSON.stringify(props)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    );
  }
}));

describe('FluidCursorCustomExample', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('renders without crashing', () => {
    render(<FluidCursorCustomExample />);
    expect(screen.getByTestId('fluid-cursor-canvas')).toBeInTheDocument();
  });

  it('displays the control panel', () => {
    render(<FluidCursorCustomExample />);
    
    expect(screen.getByText('Fluid Controls')).toBeInTheDocument();
    expect(screen.getByText(/Splat Radius:/)).toBeInTheDocument();
    expect(screen.getByText(/Splat Force:/)).toBeInTheDocument();
    expect(screen.getByText(/Density Dissipation:/)).toBeInTheDocument();
    expect(screen.getByText(/Velocity Dissipation:/)).toBeInTheDocument();
    expect(screen.getByText(/Curl Strength:/)).toBeInTheDocument();
  });

  it('has interactive range controls', () => {
    render(<FluidCursorCustomExample />);
    
    const splatRadiusSlider = screen.getByDisplayValue('0.2');
    const splatForceSlider = screen.getByDisplayValue('6000');
    
    expect(splatRadiusSlider).toBeInTheDocument();
    expect(splatForceSlider).toBeInTheDocument();
    
    // Test that sliders are interactive
    expect(splatRadiusSlider).toHaveAttribute('type', 'range');
    expect(splatForceSlider).toHaveAttribute('type', 'range');
  });

  it('has checkbox controls for boolean options', () => {
    render(<FluidCursorCustomExample />);
    
    const shadingCheckbox = screen.getByLabelText('Enable Shading');
    const transparentCheckbox = screen.getByLabelText('Transparent Background');
    
    expect(shadingCheckbox).toBeInTheDocument();
    expect(transparentCheckbox).toBeInTheDocument();
    expect(shadingCheckbox).toBeChecked();
    expect(transparentCheckbox).not.toBeChecked(); // Default is false in custom example
  });

  it('updates FluidCursor props when controls change', async () => {
    render(<FluidCursorCustomExample />);
    
    const splatRadiusSlider = screen.getByDisplayValue('0.2');
    
    // Change the slider value
    fireEvent.change(splatRadiusSlider, { target: { value: '0.5' } });
    
    await waitFor(() => {
      const canvas = screen.getByTestId('fluid-cursor-canvas');
      const props = JSON.parse(canvas.getAttribute('data-props') || '{}');
      expect(props.SPLAT_RADIUS).toBe(0.5);
    });
  });

  it('updates checkbox values correctly', async () => {
    render(<FluidCursorCustomExample />);
    
    const shadingCheckbox = screen.getByLabelText('Enable Shading');
    
    // Toggle the checkbox
    fireEvent.click(shadingCheckbox);
    
    await waitFor(() => {
      const canvas = screen.getByTestId('fluid-cursor-canvas');
      const props = JSON.parse(canvas.getAttribute('data-props') || '{}');
      expect(props.SHADING).toBe(false);
    });
  });

  it('has preset buttons that update configuration', async () => {
    render(<FluidCursorCustomExample />);
    
    const sharpButton = screen.getByText('Sharp');
    const smoothButton = screen.getByText('Smooth');
    
    expect(sharpButton).toBeInTheDocument();
    expect(smoothButton).toBeInTheDocument();
    
    // Click sharp preset
    fireEvent.click(sharpButton);
    
    await waitFor(() => {
      const canvas = screen.getByTestId('fluid-cursor-canvas');
      const props = JSON.parse(canvas.getAttribute('data-props') || '{}');
      expect(props.SPLAT_RADIUS).toBe(0.1);
      expect(props.SPLAT_FORCE).toBe(8000);
      expect(props.DENSITY_DISSIPATION).toBe(5);
      expect(props.CURL).toBe(5);
    });
  });

  it('displays current values in the UI', () => {
    render(<FluidCursorCustomExample />);
    
    // Check that current values are displayed
    expect(screen.getByText('Splat Radius: 0.2')).toBeInTheDocument();
    expect(screen.getByText('Splat Force: 6000')).toBeInTheDocument();
    expect(screen.getByText('Density Dissipation: 3.5')).toBeInTheDocument();
    expect(screen.getByText('Velocity Dissipation: 2')).toBeInTheDocument();
    expect(screen.getByText('Curl Strength: 3')).toBeInTheDocument();
  });

  it('has proper styling for the control panel', () => {
    render(<FluidCursorCustomExample />);
    
    const controlPanel = screen.getByText('Fluid Controls').parentElement;
    
    expect(controlPanel).toHaveStyle('position: absolute');
    expect(controlPanel).toHaveStyle('top: 20px');
    expect(controlPanel).toHaveStyle('right: 20px');
    expect(controlPanel).toHaveStyle('padding: 20px');
  });

  it('renders with initial configuration values', () => {
    render(<FluidCursorCustomExample />);
    
    const canvas = screen.getByTestId('fluid-cursor-canvas');
    const props = JSON.parse(canvas.getAttribute('data-props') || '{}');
    
    // Check initial values match the component's default state
    expect(props.SIM_RESOLUTION).toBe(128);
    expect(props.DYE_RESOLUTION).toBe(1440);
    expect(props.DENSITY_DISSIPATION).toBe(3.5);
    expect(props.VELOCITY_DISSIPATION).toBe(2);
    expect(props.PRESSURE).toBe(0.1);
    expect(props.PRESSURE_ITERATIONS).toBe(20);
    expect(props.CURL).toBe(3);
    expect(props.SPLAT_RADIUS).toBe(0.2);
    expect(props.SPLAT_FORCE).toBe(6000);
    expect(props.SHADING).toBe(true);
    expect(props.COLOR_UPDATE_SPEED).toBe(10);
    expect(props.TRANSPARENT).toBe(false);
    expect(props.BACK_COLOR).toEqual({ r: 0.1, g: 0.1, b: 0.2 });
  });
});
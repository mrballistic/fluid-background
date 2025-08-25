/**
 * Tests for TypeScript integration example
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TypeScriptIntegrationPage from '../typescript-integration';

// Mock FluidBackground component
vi.mock('fluid-background', () => ({
  default: vi.fn(() => <div data-testid="fluid-background" />),
  // Mock type exports (these would normally come from the actual module)
  type: {
    FluidBackgroundProps: {},
    FluidSimulationConfig: {}
  }
}));

describe('TypeScriptIntegrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window properties for responsive behavior
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    });
  });

  it('renders the main content correctly', () => {
    render(<TypeScriptIntegrationPage />);
    
    expect(screen.getByText('TypeScript Integration Demo')).toBeInTheDocument();
    expect(screen.getByText(/This example demonstrates advanced TypeScript usage/)).toBeInTheDocument();
  });

  it('includes configuration panel', () => {
    render(<TypeScriptIntegrationPage />);
    
    expect(screen.getByText('TypeScript Configuration')).toBeInTheDocument();
    expect(screen.getByText('Preset:')).toBeInTheDocument();
    
    // Check for preset selector
    const presetSelect = screen.getByRole('combobox');
    expect(presetSelect).toBeInTheDocument();
  });

  it('allows preset selection', () => {
    render(<TypeScriptIntegrationPage />);
    
    const presetSelect = screen.getByRole('combobox') as HTMLSelectElement;
    
    // Should start with balanced preset
    expect(presetSelect.value).toBe('Balanced');
    
    // Change to minimal preset
    fireEvent.change(presetSelect, { target: { value: 'Minimal' } });
    expect(presetSelect.value).toBe('Minimal');
  });

  it('includes viscosity control slider', () => {
    render(<TypeScriptIntegrationPage />);
    
    expect(screen.getByText(/Viscosity:/)).toBeInTheDocument();
    
    const viscositySlider = screen.getByRole('slider');
    expect(viscositySlider).toBeInTheDocument();
    expect(viscositySlider).toHaveAttribute('type', 'range');
  });

  it('updates viscosity value when slider changes', () => {
    render(<TypeScriptIntegrationPage />);
    
    const viscositySlider = screen.getByRole('slider') as HTMLInputElement;
    
    // Change viscosity value
    fireEvent.change(viscositySlider, { target: { value: '0.5' } });
    
    // Check that the displayed value updates
    expect(screen.getByText(/Viscosity: 0\.50/)).toBeInTheDocument();
  });

  it('displays configuration status', () => {
    render(<TypeScriptIntegrationPage />);
    
    // Should show valid configuration by default
    expect(screen.getByText(/Configuration: Valid ✓/)).toBeInTheDocument();
  });

  it('includes TypeScript features section', () => {
    render(<TypeScriptIntegrationPage />);
    
    expect(screen.getByText('TypeScript Features')).toBeInTheDocument();
    expect(screen.getByText('Full TypeScript support with proper type definitions')).toBeInTheDocument();
    expect(screen.getByText('Type-safe preset management')).toBeInTheDocument();
    expect(screen.getByText('Type-safe configuration hooks')).toBeInTheDocument();
  });

  it('displays current configuration JSON', () => {
    render(<TypeScriptIntegrationPage />);
    
    expect(screen.getByText('Current Configuration')).toBeInTheDocument();
    
    // Check for JSON display (should contain configuration properties)
    const configDisplay = screen.getByText('Current Configuration').parentElement;
    expect(configDisplay?.textContent).toContain('colors');
    expect(configDisplay?.textContent).toContain('physics');
    expect(configDisplay?.textContent).toContain('performance');
  });

  it('includes performance monitoring', async () => {
    render(<TypeScriptIntegrationPage />);
    
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    
    // Check for performance metric displays
    expect(screen.getByText('FPS')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Device')).toBeInTheDocument();
    
    // Performance monitor should update values
    await waitFor(() => {
      const fpsElements = screen.getAllByText(/\d+/);
      expect(fpsElements.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('includes performance monitor component', () => {
    render(<TypeScriptIntegrationPage />);
    
    // Check for performance monitor elements
    expect(screen.getByText('FPS')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('Device')).toBeInTheDocument();
  });

  it('renders FluidBackground component', () => {
    render(<TypeScriptIntegrationPage />);
    
    expect(screen.getByTestId('fluid-background')).toBeInTheDocument();
  });

  it('has proper responsive layout', () => {
    const { container } = render(<TypeScriptIntegrationPage />);
    
    // Check for main container
    const mainContainer = container.querySelector('div[style*="min-height: 100vh"]');
    expect(mainContainer).toBeInTheDocument();
    
    // Check for content with proper z-index
    const contentContainer = container.querySelector('div[style*="z-index: 1"]');
    expect(contentContainer).toBeInTheDocument();
  });

  it('handles preset changes correctly', () => {
    render(<TypeScriptIntegrationPage />);
    
    const presetSelect = screen.getByRole('combobox') as HTMLSelectElement;
    
    // Change to premium preset
    fireEvent.change(presetSelect, { target: { value: 'Premium' } });
    
    // Configuration should update (check that the select value changed)
    expect(presetSelect.value).toBe('Premium');
  });
});
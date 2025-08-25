/**
 * Tests for custom colors example
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomColorsPage from '../custom-colors';

// Mock the FluidBackground component
vi.mock('fluid-background', () => ({
  default: vi.fn(() => <div data-testid="fluid-background" />)
}));

import FluidBackground from 'fluid-background';
const mockFluidBackground = vi.mocked(FluidBackground);

describe('CustomColorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page content correctly', () => {
    render(<CustomColorsPage />);
    
    // Check for main heading
    expect(screen.getByText('Custom Colors Demo')).toBeInTheDocument();
    
    // Check for color mode controls
    expect(screen.getByText('Color Mode')).toBeInTheDocument();
    expect(screen.getByDisplayValue('rainbow')).toBeInTheDocument();
    expect(screen.getByDisplayValue('monochrome')).toBeInTheDocument();
    expect(screen.getByDisplayValue('custom')).toBeInTheDocument();
  });

  it('starts with rainbow mode selected by default', () => {
    render(<CustomColorsPage />);
    
    const rainbowRadio = screen.getByDisplayValue('rainbow') as HTMLInputElement;
    expect(rainbowRadio.checked).toBe(true);
  });

  it('allows switching between color modes', () => {
    render(<CustomColorsPage />);
    
    const monochromeRadio = screen.getByDisplayValue('monochrome') as HTMLInputElement;
    const customRadio = screen.getByDisplayValue('custom') as HTMLInputElement;
    
    // Switch to monochrome
    fireEvent.click(monochromeRadio);
    expect(monochromeRadio.checked).toBe(true);
    
    // Switch to custom
    fireEvent.click(customRadio);
    expect(customRadio.checked).toBe(true);
  });

  it('passes correct props to FluidBackground based on color mode', () => {
    render(<CustomColorsPage />);
    
    // Check that FluidBackground is called with some configuration
    expect(mockFluidBackground).toHaveBeenCalled();
    
    // Switch to monochrome and verify it's called again
    const monochromeRadio = screen.getByDisplayValue('monochrome');
    fireEvent.click(monochromeRadio);
    
    // Should be called at least twice (initial + after click)
    expect(mockFluidBackground.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('includes physics configuration', () => {
    render(<CustomColorsPage />);
    
    // Verify FluidBackground is called with physics props
    expect(mockFluidBackground).toHaveBeenCalled();
    const firstCall = mockFluidBackground.mock.calls[0];
    expect(firstCall[0]).toHaveProperty('physics');
  });

  it('has proper control panel layout', () => {
    const { container } = render(<CustomColorsPage />);
    
    // Check for fixed positioned control panel
    const controlPanel = container.querySelector('div[style*="position: fixed"]');
    expect(controlPanel).toBeInTheDocument();
    expect(controlPanel).toHaveStyle({
      position: 'fixed',
      top: '2rem',
      right: '2rem'
    });
  });

  it('includes color mode descriptions', () => {
    render(<CustomColorsPage />);
    
    expect(screen.getByText('Full spectrum colors')).toBeInTheDocument();
    expect(screen.getByText('Grayscale fluid')).toBeInTheDocument();
    expect(screen.getByText('Predefined color palette')).toBeInTheDocument();
  });

  it('has accessible form controls', () => {
    render(<CustomColorsPage />);
    
    // Check that radio buttons are properly labeled
    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(3);
    
    radioButtons.forEach(radio => {
      expect(radio).toHaveAttribute('name', 'colorMode');
    });
  });

  it('includes educational content about configuration', () => {
    render(<CustomColorsPage />);
    
    expect(screen.getByText('Color Configuration Options')).toBeInTheDocument();
    expect(screen.getByText('Physics Tweaks')).toBeInTheDocument();
    expect(screen.getByText(/Lower viscosity for more fluid movement/)).toBeInTheDocument();
  });
});
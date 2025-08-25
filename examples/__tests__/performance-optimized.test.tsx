/**
 * Tests for performance optimized example
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PerformanceOptimizedPage from '../performance-optimized';

// Mock the FluidBackground component
vi.mock('fluid-background', () => ({
  default: vi.fn(() => <div data-testid="fluid-background" />)
}));

import FluidBackground from 'fluid-background';
const mockFluidBackground = vi.mocked(FluidBackground);

// Mock navigator properties
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  hardwareConcurrency: 8,
  deviceMemory: 8
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
});

Object.defineProperty(window, 'devicePixelRatio', {
  value: 2,
  writable: true
});

describe('PerformanceOptimizedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page content correctly', () => {
    render(<PerformanceOptimizedPage />);
    
    // Check for main heading
    expect(screen.getByText('Performance Optimization Demo')).toBeInTheDocument();
    
    // Check for performance mode controls
    expect(screen.getByText('Performance Mode')).toBeInTheDocument();
    expect(screen.getByDisplayValue('auto')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mobile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('desktop')).toBeInTheDocument();
    expect(screen.getByDisplayValue('battery')).toBeInTheDocument();
  });

  it('starts with auto mode selected by default', () => {
    render(<PerformanceOptimizedPage />);
    
    const autoRadio = screen.getByDisplayValue('auto') as HTMLInputElement;
    expect(autoRadio.checked).toBe(true);
  });

  it('allows switching between performance modes', () => {
    render(<PerformanceOptimizedPage />);
    
    const mobileRadio = screen.getByDisplayValue('mobile') as HTMLInputElement;
    const desktopRadio = screen.getByDisplayValue('desktop') as HTMLInputElement;
    const batteryRadio = screen.getByDisplayValue('battery') as HTMLInputElement;
    
    // Switch to mobile
    fireEvent.click(mobileRadio);
    expect(mobileRadio.checked).toBe(true);
    
    // Switch to desktop
    fireEvent.click(desktopRadio);
    expect(desktopRadio.checked).toBe(true);
    
    // Switch to battery
    fireEvent.click(batteryRadio);
    expect(batteryRadio.checked).toBe(true);
  });

  it('passes correct configuration for auto mode', () => {
    render(<PerformanceOptimizedPage />);
    
    // Verify FluidBackground is called with configuration
    expect(mockFluidBackground).toHaveBeenCalled();
    const firstCall = mockFluidBackground.mock.calls[0];
    expect(firstCall[0]).toHaveProperty('colors');
    expect(firstCall[0]).toHaveProperty('performance');
    expect(firstCall[0]).toHaveProperty('physics');
  });

  it('passes correct configuration for mobile mode', () => {
    render(<PerformanceOptimizedPage />);
    
    const mobileRadio = screen.getByDisplayValue('mobile');
    fireEvent.click(mobileRadio);
    
    // Should be called multiple times (initial + after click)
    expect(mockFluidBackground.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('passes correct configuration for battery mode', () => {
    render(<PerformanceOptimizedPage />);
    
    const batteryRadio = screen.getByDisplayValue('battery');
    fireEvent.click(batteryRadio);
    
    // Should be called multiple times and include interaction config
    expect(mockFluidBackground.mock.calls.length).toBeGreaterThanOrEqual(2);
    const lastCall = mockFluidBackground.mock.calls[mockFluidBackground.mock.calls.length - 1];
    expect(lastCall[0]).toHaveProperty('interaction');
  });

  it('detects and displays device information', async () => {
    render(<PerformanceOptimizedPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Type: Desktop')).toBeInTheDocument();
      expect(screen.getByText('Pixel Ratio: 2x')).toBeInTheDocument();
      expect(screen.getByText('CPU Cores: 8')).toBeInTheDocument();
      expect(screen.getByText('Memory: 8GB')).toBeInTheDocument();
    });
  });

  it('detects mobile devices correctly', async () => {
    // Mock mobile user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      writable: true
    });
    
    render(<PerformanceOptimizedPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Type: Mobile')).toBeInTheDocument();
    });
  });

  it('displays current configuration in JSON format', () => {
    render(<PerformanceOptimizedPage />);
    
    // Check for configuration display
    expect(screen.getByText('Current Config')).toBeInTheDocument();
    
    // Should show JSON configuration
    const configDisplay = screen.getByText('Current Config').parentElement;
    expect(configDisplay).toHaveTextContent('performance');
    expect(configDisplay).toHaveTextContent('physics');
  });

  it('has proper layout with fixed positioned elements', () => {
    const { container } = render(<PerformanceOptimizedPage />);
    
    // Check for performance controls (left side)
    const leftPanel = container.querySelector('div[style*="left: 2rem"]');
    expect(leftPanel).toBeInTheDocument();
    
    // Check for config display (right side)
    const rightPanel = container.querySelector('div[style*="right: 2rem"]');
    expect(rightPanel).toBeInTheDocument();
  });

  it('includes educational content about performance optimization', () => {
    render(<PerformanceOptimizedPage />);
    
    expect(screen.getByText('Performance Modes')).toBeInTheDocument();
    expect(screen.getByText('Optimization Strategies')).toBeInTheDocument();
    expect(screen.getByText('Best Practices')).toBeInTheDocument();
    
    // Check for specific optimization strategies
    expect(screen.getByText(/Resolution Scaling/)).toBeInTheDocument();
    expect(screen.getByText(/Frame Rate Limiting/)).toBeInTheDocument();
    expect(screen.getByText(/Physics Simplification/)).toBeInTheDocument();
  });

  it('has accessible form controls', () => {
    render(<PerformanceOptimizedPage />);
    
    // Check that radio buttons are properly labeled
    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(4);
    
    radioButtons.forEach(radio => {
      expect(radio).toHaveAttribute('name', 'performanceMode');
    });
  });
});
/**
 * Tests for responsive design example
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResponsiveDesignPage from '../responsive-design';

// Mock FluidBackground component
vi.mock('fluid-background', () => ({
  default: vi.fn(() => <div data-testid="fluid-background" />)
}));

// Mock window resize events
const mockResizeEvent = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
  
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

describe('ResponsiveDesignPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set default desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800
    });
    
    // Mock addEventListener and removeEventListener
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;
    
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'resize') {
        // Store the handler for manual triggering in tests
        (window as any).__resizeHandler = handler;
      }
      return originalAddEventListener.call(window, event, handler);
    });
    
    vi.spyOn(window, 'removeEventListener').mockImplementation(originalRemoveEventListener);
  });

  it('renders the main content correctly', () => {
    render(<ResponsiveDesignPage />);
    
    expect(screen.getByText('Responsive Design Demo')).toBeInTheDocument();
    expect(screen.getByText(/This example demonstrates how the FluidBackground component adapts/)).toBeInTheDocument();
  });

  it('displays device information', () => {
    render(<ResponsiveDesignPage />);
    
    expect(screen.getByText('Device Info')).toBeInTheDocument();
    expect(screen.getByText(/Type:/)).toBeInTheDocument();
    expect(screen.getByText(/Size:/)).toBeInTheDocument();
    expect(screen.getByText(/Ratio:/)).toBeInTheDocument();
  });

  it('shows breakpoint information', () => {
    render(<ResponsiveDesignPage />);
    
    expect(screen.getByText('Breakpoints')).toBeInTheDocument();
    expect(screen.getByText(/mobile: 768px/)).toBeInTheDocument();
    expect(screen.getByText(/tablet: 1024px/)).toBeInTheDocument();
    expect(screen.getByText(/desktop: 1440px/)).toBeInTheDocument();
    expect(screen.getByText(/ultrawide: 1920px/)).toBeInTheDocument();
  });

  it('detects desktop device type by default', () => {
    render(<ResponsiveDesignPage />);
    
    expect(screen.getByText(/Current Configuration: desktop/)).toBeInTheDocument();
    expect(screen.getByText(/Type: desktop/)).toBeInTheDocument();
  });

  it('adapts to mobile screen size', () => {
    render(<ResponsiveDesignPage />);
    
    // Resize to mobile
    mockResizeEvent(600, 800);
    
    expect(screen.getByText(/Current Configuration: mobile/)).toBeInTheDocument();
    expect(screen.getByText(/Type: mobile/)).toBeInTheDocument();
  });

  it('adapts to tablet screen size', () => {
    render(<ResponsiveDesignPage />);
    
    // Resize to tablet
    mockResizeEvent(800, 600);
    
    expect(screen.getByText(/Current Configuration: tablet/)).toBeInTheDocument();
    expect(screen.getByText(/Type: tablet/)).toBeInTheDocument();
  });

  it('adapts to ultrawide screen size', () => {
    render(<ResponsiveDesignPage />);
    
    // Resize to ultrawide
    mockResizeEvent(2000, 1000);
    
    expect(screen.getByText(/Current Configuration: ultrawide/)).toBeInTheDocument();
    expect(screen.getByText(/Type: ultrawide/)).toBeInTheDocument();
  });

  it('displays current configuration details', () => {
    render(<ResponsiveDesignPage />);
    
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Interaction')).toBeInTheDocument();
    expect(screen.getByText(/Resolution:/)).toBeInTheDocument();
    expect(screen.getByText(/Frame Rate:/)).toBeInTheDocument();
    expect(screen.getByText(/Mouse:/)).toBeInTheDocument();
    expect(screen.getByText(/Touch:/)).toBeInTheDocument();
  });

  it('includes responsive features section', () => {
    render(<ResponsiveDesignPage />);
    
    expect(screen.getByText('Responsive Features')).toBeInTheDocument();
    expect(screen.getByText('Lower settings on mobile devices')).toBeInTheDocument();
    expect(screen.getByText('Enhanced touch interaction on mobile')).toBeInTheDocument();
    expect(screen.getByText('Different configs for each screen size')).toBeInTheDocument();
  });

  it('includes implementation tips', () => {
    render(<ResponsiveDesignPage />);
    
    expect(screen.getByText('Implementation Tips')).toBeInTheDocument();
    expect(screen.getByText(/Use CSS-in-JS or CSS custom properties/)).toBeInTheDocument();
    expect(screen.getByText(/Test on actual devices/)).toBeInTheDocument();
    expect(screen.getByText(/Consider network conditions and battery life/)).toBeInTheDocument();
  });

  it('has toggle button for grid demo', () => {
    render(<ResponsiveDesignPage />);
    
    const toggleButton = screen.getByText('Show Grid Demo');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton.tagName).toBe('BUTTON');
  });

  it('shows and hides grid demo when toggled', () => {
    render(<ResponsiveDesignPage />);
    
    const toggleButton = screen.getByText('Show Grid Demo');
    
    // Initially grid should not be visible
    expect(screen.queryByText('Responsive Grid Demo')).not.toBeInTheDocument();
    
    // Click to show grid
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Responsive Grid Demo')).toBeInTheDocument();
    expect(screen.getByText('Hide Grid Demo')).toBeInTheDocument();
    
    // Should show grid items
    expect(screen.getByText('Grid Item 1')).toBeInTheDocument();
    expect(screen.getByText('Grid Item 8')).toBeInTheDocument();
  });

  it('renders FluidBackground component', () => {
    render(<ResponsiveDesignPage />);
    
    expect(screen.getByTestId('fluid-background')).toBeInTheDocument();
  });

  it('updates window size display on resize', () => {
    render(<ResponsiveDesignPage />);
    
    // Initial size
    expect(screen.getByText(/Size: 1200 × 800/)).toBeInTheDocument();
    
    // Resize window
    mockResizeEvent(1600, 900);
    
    expect(screen.getByText(/Size: 1600 × 900/)).toBeInTheDocument();
  });

  it('calculates and displays aspect ratio', () => {
    render(<ResponsiveDesignPage />);
    
    // 1200/800 = 1.5
    expect(screen.getByText(/Ratio: 1\.50/)).toBeInTheDocument();
    
    // Change to different ratio
    mockResizeEvent(1920, 1080);
    
    // 1920/1080 ≈ 1.78
    expect(screen.getByText(/Ratio: 1\.78/)).toBeInTheDocument();
  });

  it('highlights active breakpoints', () => {
    render(<ResponsiveDesignPage />);
    
    // At 1200px width, desktop and smaller breakpoints should be active
    const breakpointElements = screen.getByText('Breakpoints').parentElement;
    expect(breakpointElements?.textContent).toContain('mobile: 768px ✓');
    expect(breakpointElements?.textContent).toContain('tablet: 1024px ✓');
  });

  it('has proper responsive layout structure', () => {
    const { container } = render(<ResponsiveDesignPage />);
    
    // Check for main container
    const mainContainer = container.querySelector('div[style*="min-height: 100vh"]');
    expect(mainContainer).toBeInTheDocument();
    
    // Check for device info panel positioning
    const deviceInfo = container.querySelector('div[style*="position: fixed"][style*="top: 1rem"]');
    expect(deviceInfo).toBeInTheDocument();
    
    // Check for toggle button positioning
    const toggleButton = container.querySelector('button[style*="position: fixed"][style*="bottom: 1rem"]');
    expect(toggleButton).toBeInTheDocument();
  });
});
/**
 * Tests for basic usage example
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BasicUsagePage from '../basic-usage';

// Mock the FluidBackground component
vi.mock('fluid-background', () => ({
  default: vi.fn(() => <div data-testid="fluid-background" />)
}));

describe('BasicUsagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page content correctly', () => {
    render(<BasicUsagePage />);
    
    // Check for main heading
    expect(screen.getByText('Welcome to My App')).toBeInTheDocument();
    
    // Check for description text
    expect(screen.getByText(/This page demonstrates the basic usage/)).toBeInTheDocument();
    
    // Check for features section
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Zero configuration required')).toBeInTheDocument();
    expect(screen.getByText('Automatic performance optimization')).toBeInTheDocument();
  });

  it('renders the FluidBackground component', () => {
    render(<BasicUsagePage />);
    
    // Check that FluidBackground component is rendered
    expect(screen.getByTestId('fluid-background')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(<BasicUsagePage />);
    
    // Check for main container with proper styling
    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toHaveStyle({
      minHeight: '100vh',
      position: 'relative'
    });
    
    // Check for content container with proper z-index
    const contentContainer = container.querySelector('div[style*="z-index: 1"]');
    expect(contentContainer).toBeInTheDocument();
  });

  it('includes accessibility features', () => {
    render(<BasicUsagePage />);
    
    // Check for proper heading hierarchy
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Welcome to My App');
    
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2).toHaveTextContent('Features');
    
    // Check for list structure
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(5);
  });

  it('has responsive design elements', () => {
    const { container } = render(<BasicUsagePage />);
    
    // Check for responsive content container by looking for the style attribute
    const contentDiv = container.querySelector('div[style*="max-width: 800px"]');
    expect(contentDiv).toBeInTheDocument();
  });
});
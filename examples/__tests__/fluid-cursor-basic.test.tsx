import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import FluidCursorBasicExample from '../fluid-cursor-basic';

// Mock the FluidCursor component since we can't test WebGL in jsdom
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

describe('FluidCursorBasicExample', () => {
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
    render(<FluidCursorBasicExample />);
    expect(screen.getByTestId('fluid-cursor-canvas')).toBeInTheDocument();
  });

  it('displays the correct title and description', () => {
    render(<FluidCursorBasicExample />);
    
    expect(screen.getByText('Basic FluidCursor')).toBeInTheDocument();
    expect(screen.getByText('Move your mouse to see the fluid effect')).toBeInTheDocument();
  });

  it('has proper container styling', () => {
    render(<FluidCursorBasicExample />);
    
    const container = screen.getByText('Basic FluidCursor').closest('div')?.parentElement;
    expect(container).toHaveStyle({
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#000'
    });
  });

  it('renders FluidCursor component with default props', () => {
    render(<FluidCursorBasicExample />);
    
    const canvas = screen.getByTestId('fluid-cursor-canvas');
    const props = JSON.parse(canvas.getAttribute('data-props') || '{}');
    
    // Should have no custom props (using defaults)
    expect(Object.keys(props)).toHaveLength(0);
  });

  it('has proper overlay styling and z-index', () => {
    render(<FluidCursorBasicExample />);
    
    const overlay = screen.getByText('Basic FluidCursor').parentElement;
    expect(overlay).toHaveStyle('position: absolute');
    expect(overlay).toHaveStyle('top: 50%');
    expect(overlay).toHaveStyle('left: 50%');
    expect(overlay).toHaveStyle('transform: translate(-50%, -50%)');
  });

  it('is accessible with proper text content', () => {
    render(<FluidCursorBasicExample />);
    
    // Check that important text is present for screen readers
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Basic FluidCursor');
    expect(screen.getByText(/move your mouse/i)).toBeInTheDocument();
  });

  it('maintains proper layering with canvas and content', () => {
    render(<FluidCursorBasicExample />);
    
    const canvas = screen.getByTestId('fluid-cursor-canvas');
    const overlay = screen.getByText('Basic FluidCursor').parentElement;
    
    // Canvas should be positioned absolutely
    expect(canvas).toHaveStyle({
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%'
    });
    
    // Overlay should have higher z-index
    expect(overlay).toHaveStyle({ zIndex: '10' });
  });
});
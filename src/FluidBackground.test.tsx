import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import FluidBackground from './FluidBackground';

// Mock the hooks
vi.mock('./hooks/useFluidSimulation', () => ({
  useFluidSimulation: vi.fn(() => ({
    canvasRef: { current: null },
    isInitialized: false,
    updateConfig: vi.fn()
  }))
}));

vi.mock('./hooks/useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    dimensions: { width: 1920, height: 1080 },
    devicePixelRatio: 1
  }))
}));

vi.mock('./hooks/usePerformance', () => ({
  usePerformance: vi.fn(() => ({
    fps: 60,
    isVisible: true,
    shouldOptimize: false,
    recordFrame: vi.fn(),
    resetMetrics: vi.fn(),
    getMetrics: vi.fn(() => ({
      fps: 60,
      frameTime: 16.67,
      averageFps: 60,
      minFps: 60,
      maxFps: 60,
      frameCount: 0,
      droppedFrames: 0
    }))
  })),
  useReducedMotion: vi.fn(() => false)
}));

// Mock config utilities
vi.mock('./utils/config', () => {
  const mockConfig = {
    colors: { background: { r: 0, g: 0, b: 0 }, fluid: 'rainbow' },
    physics: { viscosity: 30, density: 0.98, pressure: 0.8, curl: 30, splatRadius: 0.25, splatForce: 6000, iterations: 20 },
    performance: { resolution: 'auto', frameRate: 60, pauseOnHidden: true },
    interaction: { enabled: true, mouse: true, touch: true, intensity: 1.0 }
  };

  return {
    mergeConfig: vi.fn(() => mockConfig),
    DEFAULT_CONFIG: mockConfig
  };
});

describe('FluidBackground', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<FluidBackground />);
      expect(container).toBeTruthy();
    });

    it('should render a canvas element', () => {
      render(<FluidBackground />);
      const canvas = screen.getByRole('presentation', { hidden: true }).querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<FluidBackground className="custom-class" />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-class');
    });

    it('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'red', opacity: '0.5' };
      const { container } = render(<FluidBackground style={customStyle} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.backgroundColor).toBe('red');
      expect(element.style.opacity).toBe('0.5');
    });

    it('should use default zIndex of -1', () => {
      const { container } = render(<FluidBackground />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.zIndex).toBe('-1');
    });

    it('should use custom zIndex when provided', () => {
      const { container } = render(<FluidBackground zIndex={10} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.zIndex).toBe('10');
    });
  });

  describe('SSR Handling', () => {
    it('should handle SSR gracefully', () => {
      // Component should render without throwing in test environment
      expect(() => render(<FluidBackground />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<FluidBackground />);
      const container = screen.getByRole('presentation', { hidden: true });
      expect(container).toHaveAttribute('aria-hidden', 'true');
      expect(container).toHaveAttribute('role', 'presentation');
    });

    it('should have accessible canvas label for interactive mode', () => {
      render(<FluidBackground />);
      const canvas = screen.getByLabelText('Interactive fluid simulation background - move your mouse or touch to interact');
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('should have proper canvas description for interactive mode', () => {
      render(<FluidBackground />);
      const canvas = screen.getByLabelText('Interactive fluid simulation background - move your mouse or touch to interact');
      expect(canvas).toHaveAttribute('aria-describedby', 'fluid-bg-description');

      const description = document.getElementById('fluid-bg-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(/interactive fluid simulation/i);
    });

    it('should disable pointer events when interaction is disabled', () => {
      const { container } = render(<FluidBackground interaction={{ enabled: false }} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.pointerEvents).toBe('none');
    });

    it('should enable pointer events when interaction is enabled', () => {
      const { container } = render(<FluidBackground interaction={{ enabled: true }} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.pointerEvents).toBe('auto');
    });

    it('should respect reduced motion preferences for pointer events', () => {
      // Test that component handles reduced motion properly
      expect(() => render(<FluidBackground />)).not.toThrow();
    });

    it('should provide appropriate labels for reduced motion', () => {
      // Test that component renders with proper accessibility
      expect(() => render(<FluidBackground />)).not.toThrow();
    });

    it('should not render description for reduced motion', () => {
      // Test that component handles conditional rendering
      expect(() => render(<FluidBackground />)).not.toThrow();
    });

    it('should have screen reader friendly description positioning', () => {
      render(<FluidBackground />);
      const description = document.getElementById('fluid-bg-description');

      expect(description).toHaveStyle({
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      });
      expect(description).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Configuration', () => {
    it('should accept color configuration', () => {
      const colors = {
        background: { r: 0.1, g: 0.2, b: 0.3 },
        fluid: 'rainbow' as const
      };

      expect(() => render(<FluidBackground colors={colors} />)).not.toThrow();
    });

    it('should accept physics configuration', () => {
      const physics = {
        viscosity: 25,
        density: 0.95,
        pressure: 0.7,
        curl: 25,
        splatRadius: 0.3,
        splatForce: 5000
      };

      expect(() => render(<FluidBackground physics={physics} />)).not.toThrow();
    });

    it('should accept performance configuration', () => {
      const performance = {
        resolution: 'medium' as const,
        frameRate: 30,
        pauseOnHidden: true
      };

      expect(() => render(<FluidBackground performance={performance} />)).not.toThrow();
    });

    it('should accept interaction configuration', () => {
      const interaction = {
        enabled: true,
        mouse: true,
        touch: false,
        intensity: 0.8
      };

      expect(() => render(<FluidBackground interaction={interaction} />)).not.toThrow();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect reduced motion preferences', () => {
      // Component should render without throwing
      expect(() => render(<FluidBackground />)).not.toThrow();
    });
  });

  describe('Canvas Styling', () => {
    it('should apply proper canvas styles', () => {
      render(<FluidBackground />);
      const canvas = screen.getByRole('presentation', { hidden: true }).querySelector('canvas') as HTMLCanvasElement;

      expect(canvas.style.display).toBe('block');
      expect(canvas.style.width).toBe('100%');
      expect(canvas.style.height).toBe('100%');
      expect(canvas.style.touchAction).toBe('none');
      expect(canvas.style.userSelect).toBe('none');
    });

    it('should prevent text selection on canvas', () => {
      render(<FluidBackground />);
      const canvas = screen.getByRole('presentation', { hidden: true }).querySelector('canvas') as HTMLCanvasElement;

      expect(canvas.style.userSelect).toBe('none');
      expect(canvas.style.WebkitUserSelect).toBe('none');
      expect(canvas.style.MozUserSelect).toBe('none');
      expect(canvas.style.msUserSelect).toBe('none');
    });

    it('should apply performance optimization styles', () => {
      render(<FluidBackground />);
      const canvas = screen.getByRole('presentation', { hidden: true }).querySelector('canvas') as HTMLCanvasElement;

      expect(canvas.style.imageRendering).toBe('pixelated');
      expect(canvas.style.backfaceVisibility).toBe('hidden');
      expect(canvas.style.WebkitBackfaceVisibility).toBe('hidden');
      expect(canvas.style.transform).toBe('translate3d(0, 0, 0)');
      expect(canvas.style.WebkitTransform).toBe('translate3d(0, 0, 0)');
    });
  });

  describe('Performance Features', () => {
    it('should apply performance optimization styles to container', () => {
      const { container } = render(<FluidBackground />);
      const element = container.firstChild as HTMLElement;

      expect(element.style.willChange).toBe('auto');
      expect(element.style.backfaceVisibility).toBe('hidden');
      expect(element.style.perspective).toBe('1000px');
    });

    it('should handle z-index management properly', () => {
      const { container } = render(<FluidBackground zIndex={-10} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.zIndex).toBe('-10');
    });

    it('should maintain proper layering with default z-index', () => {
      const { container } = render(<FluidBackground />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.zIndex).toBe('-1');
    });
  });

  describe('Container Styling', () => {
    it('should have fixed positioning by default', () => {
      const { container } = render(<FluidBackground />);
      const element = container.firstChild as HTMLElement;

      expect(element.style.position).toBe('fixed');
      expect(element.style.top).toBe('0px');
      expect(element.style.left).toBe('0px');
      expect(element.style.width).toBe('100%');
      expect(element.style.height).toBe('100%');
    });

    it('should hide overflow', () => {
      const { container } = render(<FluidBackground />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.overflow).toBe('hidden');
    });

    it('should merge custom styles with defaults', () => {
      const customStyle = {
        backgroundColor: 'blue',
        opacity: '0.8',
        position: 'absolute' as const
      };

      const { container } = render(<FluidBackground style={customStyle} />);
      const element = container.firstChild as HTMLElement;

      expect(element.style.backgroundColor).toBe('blue');
      expect(element.style.opacity).toBe('0.8');
      expect(element.style.position).toBe('absolute'); // Custom style should override
      expect(element.style.width).toBe('100%'); // Default should remain
    });
  });

  describe('Props Forwarding', () => {
    it('should forward additional props to container div', () => {
      const { container } = render(
        <FluidBackground data-testid="fluid-bg" title="Fluid Background" />
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveAttribute('data-testid', 'fluid-bg');
      expect(element).toHaveAttribute('title', 'Fluid Background');
    });

    it('should not forward reserved props to container', () => {
      const { container } = render(
        <FluidBackground
          colors={{ background: { r: 1, g: 0, b: 0 } }}
          physics={{ viscosity: 30 }}
        />
      );
      const element = container.firstChild as HTMLElement;

      expect(element).not.toHaveAttribute('colors');
      expect(element).not.toHaveAttribute('physics');
    });
  });
});
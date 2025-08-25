import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import FluidBackground from './FluidBackground';

describe('FluidBackground', () => {
  it('renders without crashing', () => {
    const { container } = render(<FluidBackground />);
    expect(container.firstChild).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<FluidBackground className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  it('applies custom zIndex', () => {
    const { container } = render(<FluidBackground zIndex={10} />);
    const element = container.firstChild as HTMLElement;
    expect(element.style.zIndex).toBe('10');
  });
});
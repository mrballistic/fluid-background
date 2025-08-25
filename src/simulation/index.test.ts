/**
 * Tests for simulation module exports
 */

import { describe, it, expect } from 'vitest';
import {
  WebGLContextImpl,
  ShaderManagerImpl,
  FramebufferManagerImpl,
  AdvectionPass,
  DivergencePass,
  PressurePass,
  CurlPass,
  VorticityPass,
  SplatPass,
} from './index';

describe('Simulation module exports', () => {
  it('should export all core simulation classes', () => {
    expect(WebGLContextImpl).toBeDefined();
    expect(ShaderManagerImpl).toBeDefined();
    expect(FramebufferManagerImpl).toBeDefined();
  });

  it('should export all render pass classes', () => {
    expect(AdvectionPass).toBeDefined();
    expect(DivergencePass).toBeDefined();
    expect(PressurePass).toBeDefined();
    expect(CurlPass).toBeDefined();
    expect(VorticityPass).toBeDefined();
    expect(SplatPass).toBeDefined();
  });

  it('should export classes that can be instantiated', () => {
    // These are constructor functions, so they should be functions
    expect(typeof WebGLContextImpl).toBe('function');
    expect(typeof ShaderManagerImpl).toBe('function');
    expect(typeof FramebufferManagerImpl).toBe('function');
    expect(typeof AdvectionPass).toBe('function');
    expect(typeof DivergencePass).toBe('function');
    expect(typeof PressurePass).toBe('function');
    expect(typeof CurlPass).toBe('function');
    expect(typeof VorticityPass).toBe('function');
    expect(typeof SplatPass).toBe('function');
  });
});
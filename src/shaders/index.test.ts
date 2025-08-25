import { describe, it, expect } from 'vitest';
import {
  vertexShader,
  copyShader,
  clearShader,
  displayShader,
  advectionShader,
  divergenceShader,
  pressureShader,
  curlShader,
  vorticityShader,
  gradientSubtractShader,
  splatShader
} from './index';

describe('Shader Index Exports', () => {
  const shaders = {
    vertexShader,
    copyShader,
    clearShader,
    displayShader,
    advectionShader,
    divergenceShader,
    pressureShader,
    curlShader,
    vorticityShader,
    gradientSubtractShader,
    splatShader
  };

  Object.entries(shaders).forEach(([name, shader]) => {
    it(`should export ${name} as a non-empty string`, () => {
      expect(shader).toBeDefined();
      expect(typeof shader).toBe('string');
      expect(shader.length).toBeGreaterThan(0);
      expect(shader).toContain('#version 300 es');
    });
  });

  it('should export all required shaders', () => {
    expect(Object.keys(shaders)).toHaveLength(11);
  });
});
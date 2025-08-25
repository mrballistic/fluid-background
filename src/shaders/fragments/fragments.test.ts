import { describe, it, expect } from 'vitest';
import {
  copyShaderSource,
  clearShaderSource,
  displayShaderSource,
  advectionShaderSource,
  divergenceShaderSource,
  pressureShaderSource,
  curlShaderSource,
  vorticityShaderSource,
  gradientSubtractShaderSource,
  splatShaderSource
} from './index';

const shaders = {
  copy: copyShaderSource,
  clear: clearShaderSource,
  display: displayShaderSource,
  advection: advectionShaderSource,
  divergence: divergenceShaderSource,
  pressure: pressureShaderSource,
  curl: curlShaderSource,
  vorticity: vorticityShaderSource,
  gradientSubtract: gradientSubtractShaderSource,
  splat: splatShaderSource
};

describe('Fragment Shaders', () => {
  Object.entries(shaders).forEach(([name, source]) => {
    describe(`${name} shader`, () => {
      it('should export a valid GLSL shader source string', () => {
        expect(source).toBeDefined();
        expect(typeof source).toBe('string');
        expect(source.length).toBeGreaterThan(0);
      });

      it('should contain required GLSL version directive', () => {
        expect(source).toContain('#version 300 es');
      });

      it('should contain precision qualifier', () => {
        expect(source).toContain('precision highp float');
      });

      it('should define input texture coordinate varying', () => {
        expect(source).toContain('in vec2 v_texCoord');
      });

      it('should define output color', () => {
        expect(source).toContain('out vec4 fragColor');
      });

      it('should contain main function', () => {
        expect(source).toContain('void main()');
      });

      it('should set fragColor in main function', () => {
        expect(source).toContain('fragColor =');
      });

      it('should not contain syntax errors (basic validation)', () => {
        expect(source).toContain('{');
        expect(source).toContain('}');
        expect(source).toContain(';');
      });
    });
  });

  describe('Shader-specific validations', () => {
    it('copy shader should use u_texture uniform', () => {
      expect(copyShaderSource).toContain('uniform sampler2D u_texture');
      expect(copyShaderSource).toContain('texture(u_texture, v_texCoord)');
    });

    it('clear shader should use color uniforms', () => {
      expect(clearShaderSource).toContain('uniform vec3 u_color');
      expect(clearShaderSource).toContain('uniform float u_alpha');
    });

    it('advection shader should implement bilinear interpolation', () => {
      expect(advectionShaderSource).toContain('bilerp');
      expect(advectionShaderSource).toContain('uniform float u_dt');
      expect(advectionShaderSource).toContain('uniform float u_dissipation');
    });

    it('divergence shader should calculate velocity divergence', () => {
      expect(divergenceShaderSource).toContain('uniform sampler2D u_velocity');
      expect(divergenceShaderSource).toContain('uniform vec2 u_texelSize');
      expect(divergenceShaderSource).toContain('float div');
    });

    it('pressure shader should implement Jacobi iteration', () => {
      expect(pressureShaderSource).toContain('uniform sampler2D u_pressure');
      expect(pressureShaderSource).toContain('uniform sampler2D u_divergence');
      expect(pressureShaderSource).toContain('float pressure');
    });

    it('curl shader should calculate vorticity', () => {
      expect(curlShaderSource).toContain('uniform sampler2D u_velocity');
      expect(curlShaderSource).toContain('float vorticity');
    });

    it('vorticity shader should apply confinement forces', () => {
      expect(vorticityShaderSource).toContain('uniform float u_curlStrength');
      expect(vorticityShaderSource).toContain('vec2 force');
    });

    it('gradient subtract shader should subtract pressure gradient', () => {
      expect(gradientSubtractShaderSource).toContain('uniform sampler2D u_pressure');
      expect(gradientSubtractShaderSource).toContain('uniform sampler2D u_velocity');
      expect(gradientSubtractShaderSource).toContain('velocity.xy -=');
    });

    it('splat shader should add input forces', () => {
      expect(splatShaderSource).toContain('uniform vec2 u_point');
      expect(splatShaderSource).toContain('uniform float u_radius');
      expect(splatShaderSource).toContain('uniform float u_strength');
      expect(splatShaderSource).toContain('exp(-dot(p, p)');
    });

    it('display shader should apply color correction', () => {
      expect(displayShaderSource).toContain('uniform float u_brightness');
      expect(displayShaderSource).toContain('uniform float u_contrast');
      expect(displayShaderSource).toContain('clamp');
    });
  });
});
import { describe, it, expect } from 'vitest';
import { vertexShaderSource } from './vertex';

describe('Vertex Shader', () => {
  it('should export a valid GLSL shader source string', () => {
    expect(vertexShaderSource).toBeDefined();
    expect(typeof vertexShaderSource).toBe('string');
    expect(vertexShaderSource.length).toBeGreaterThan(0);
  });

  it('should contain required GLSL version directive', () => {
    expect(vertexShaderSource).toContain('#version 300 es');
  });

  it('should contain precision qualifier', () => {
    expect(vertexShaderSource).toContain('precision highp float');
  });

  it('should define input position attribute', () => {
    expect(vertexShaderSource).toContain('in vec2 a_position');
  });

  it('should define output texture coordinate varying', () => {
    expect(vertexShaderSource).toContain('out vec2 v_texCoord');
  });

  it('should contain main function', () => {
    expect(vertexShaderSource).toContain('void main()');
  });

  it('should set gl_Position', () => {
    expect(vertexShaderSource).toContain('gl_Position');
  });

  it('should calculate texture coordinates', () => {
    expect(vertexShaderSource).toContain('v_texCoord');
    expect(vertexShaderSource).toContain('a_position * 0.5 + 0.5');
  });

  it('should not contain syntax errors (basic validation)', () => {
    // Check for common GLSL syntax requirements
    expect(vertexShaderSource).toContain('{');
    expect(vertexShaderSource).toContain('}');
    expect(vertexShaderSource).toContain(';');
  });
});
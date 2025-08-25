/**
 * Unit tests for CurlPass class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CurlPass } from './CurlPass';
import { RenderPassInputs } from '../types';

// Mock WebGL2RenderingContext
const createMockGL = () => {
  const mockTexture = {} as WebGLTexture;
  const mockBuffer = {} as WebGLBuffer;
  const mockVAO = {} as WebGLVertexArrayObject;
  const mockProgram = {} as WebGLProgram;
  const mockLocation = {} as WebGLUniformLocation;

  return {
    createBuffer: vi.fn(() => mockBuffer),
    createVertexArray: vi.fn(() => mockVAO),
    createTexture: vi.fn(() => mockTexture),
    bindBuffer: vi.fn(),
    bindVertexArray: vi.fn(),
    bindTexture: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => mockLocation),
    useProgram: vi.fn(),
    uniform1i: vi.fn(),
    uniform2f: vi.fn(),
    activeTexture: vi.fn(),
    drawArrays: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteVertexArray: vi.fn(),
    canvas: { width: 512, height: 512 },
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    TRIANGLE_STRIP: 5,
    TEXTURE0: 33984,
    TEXTURE_2D: 3553,
  } as unknown as WebGL2RenderingContext;
};

const createMockShaderManager = () => ({
  createProgram: vi.fn(() => ({} as WebGLProgram)),
});

describe('CurlPass', () => {
  let gl: WebGL2RenderingContext;
  let shaderManager: ReturnType<typeof createMockShaderManager>;
  let curlPass: CurlPass;

  beforeEach(() => {
    gl = createMockGL();
    shaderManager = createMockShaderManager();
    curlPass = new CurlPass(gl, shaderManager);
  });

  describe('initialization', () => {
    it('should create shader program during initialization', () => {
      expect(shaderManager.createProgram).toHaveBeenCalledWith(
        expect.stringContaining('a_position'),
        expect.stringContaining('u_velocity')
      );
    });

    it('should create vertex buffer and VAO', () => {
      expect(gl.createBuffer).toHaveBeenCalled();
      expect(gl.createVertexArray).toHaveBeenCalled();
      expect(gl.bufferData).toHaveBeenCalledWith(
        gl.ARRAY_BUFFER,
        expect.any(Float32Array),
        gl.STATIC_DRAW
      );
    });

    it('should get uniform locations for velocity and texel size', () => {
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_velocity'
      );
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_texelSize'
      );
    });
  });

  describe('execute', () => {
    it('should execute curl pass with proper uniforms', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      curlPass.execute(gl, mockInputs);

      expect(gl.useProgram).toHaveBeenCalled();
      expect(gl.bindVertexArray).toHaveBeenCalled();
      expect(gl.uniform1i).toHaveBeenCalledWith(expect.any(Object), 0);
      expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);
    });

    it('should bind velocity texture', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      curlPass.execute(gl, mockInputs);

      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, mockInputs.velocity);
    });

    it('should calculate texel size based on canvas dimensions', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      curlPass.execute(gl, mockInputs);

      expect(gl.uniform2f).toHaveBeenCalledWith(
        expect.any(Object),
        1.0 / 512,
        1.0 / 512
      );
    });

    it('should throw error if not properly initialized', () => {
      const uninitializedPass = new CurlPass(gl, shaderManager);
      // Simulate failed initialization
      (uninitializedPass as any).program = null;

      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      expect(() => uninitializedPass.execute(gl, mockInputs)).toThrow(
        'CurlPass not properly initialized'
      );
    });
  });

  describe('cleanup', () => {
    it('should cleanup WebGL resources', () => {
      curlPass.cleanup();

      expect(gl.deleteProgram).toHaveBeenCalled();
      expect(gl.deleteBuffer).toHaveBeenCalled();
      expect(gl.deleteVertexArray).toHaveBeenCalled();
    });

    it('should handle cleanup when resources are null', () => {
      curlPass.cleanup();
      // Should not throw when called again
      expect(() => curlPass.cleanup()).not.toThrow();
    });
  });
});
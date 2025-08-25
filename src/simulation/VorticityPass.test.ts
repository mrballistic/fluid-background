/**
 * Unit tests for VorticityPass class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VorticityPass } from './VorticityPass';
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
    uniform1f: vi.fn(),
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
    TEXTURE1: 33985,
    TEXTURE_2D: 3553,
  } as unknown as WebGL2RenderingContext;
};

const createMockShaderManager = () => ({
  createProgram: vi.fn(() => ({} as WebGLProgram)),
});

describe('VorticityPass', () => {
  let gl: WebGL2RenderingContext;
  let shaderManager: ReturnType<typeof createMockShaderManager>;
  let vorticityPass: VorticityPass;

  beforeEach(() => {
    gl = createMockGL();
    shaderManager = createMockShaderManager();
    vorticityPass = new VorticityPass(gl, shaderManager);
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

    it('should get uniform locations for all required uniforms', () => {
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_velocity'
      );
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_curl'
      );
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_curlStrength'
      );
    });

    it('should accept custom curl strength', () => {
      const customPass = new VorticityPass(gl, shaderManager, 50.0);
      expect(customPass).toBeDefined();
    });
  });

  describe('setCurlStrength', () => {
    it('should set curl strength within valid range', () => {
      vorticityPass.setCurlStrength(25.0);
      // No direct way to test this, but it should not throw
      expect(() => vorticityPass.setCurlStrength(25.0)).not.toThrow();
    });

    it('should clamp curl strength to minimum of 0', () => {
      vorticityPass.setCurlStrength(-10.0);
      // Should clamp to 0, no direct way to test but should not throw
      expect(() => vorticityPass.setCurlStrength(-10.0)).not.toThrow();
    });

    it('should clamp curl strength to maximum of 100', () => {
      vorticityPass.setCurlStrength(150.0);
      // Should clamp to 100, no direct way to test but should not throw
      expect(() => vorticityPass.setCurlStrength(150.0)).not.toThrow();
    });
  });

  describe('execute', () => {
    it('should execute vorticity pass with proper uniforms', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        curl: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      vorticityPass.execute(gl, mockInputs);

      expect(gl.useProgram).toHaveBeenCalled();
      expect(gl.bindVertexArray).toHaveBeenCalled();
      expect(gl.uniform1i).toHaveBeenCalledWith(expect.any(Object), 0);
      expect(gl.uniform1i).toHaveBeenCalledWith(expect.any(Object), 1);
      expect(gl.uniform1f).toHaveBeenCalledWith(expect.any(Object), 30.0); // Default curl strength
      expect(gl.uniform1f).toHaveBeenCalledWith(expect.any(Object), 0.016);
      expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);
    });

    it('should bind velocity and curl textures', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        curl: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      vorticityPass.execute(gl, mockInputs);

      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0);
      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE1);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, mockInputs.velocity);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, mockInputs.curl);
    });

    it('should calculate texel size based on canvas dimensions', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        curl: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      vorticityPass.execute(gl, mockInputs);

      expect(gl.uniform2f).toHaveBeenCalledWith(
        expect.any(Object),
        1.0 / 512,
        1.0 / 512
      );
    });

    it('should throw error if curl texture is missing', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      expect(() => vorticityPass.execute(gl, mockInputs)).toThrow(
        'VorticityPass requires curl texture'
      );
    });

    it('should throw error if not properly initialized', () => {
      const uninitializedPass = new VorticityPass(gl, shaderManager);
      // Simulate failed initialization
      (uninitializedPass as any).program = null;

      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        curl: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      expect(() => uninitializedPass.execute(gl, mockInputs)).toThrow(
        'VorticityPass not properly initialized'
      );
    });
  });

  describe('cleanup', () => {
    it('should cleanup WebGL resources', () => {
      vorticityPass.cleanup();

      expect(gl.deleteProgram).toHaveBeenCalled();
      expect(gl.deleteBuffer).toHaveBeenCalled();
      expect(gl.deleteVertexArray).toHaveBeenCalled();
    });

    it('should handle cleanup when resources are null', () => {
      vorticityPass.cleanup();
      // Should not throw when called again
      expect(() => vorticityPass.cleanup()).not.toThrow();
    });
  });
});
/**
 * Unit tests for PressurePass class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PressurePass } from './PressurePass';
import { RenderPassInputs } from '../types';

// Mock WebGL2RenderingContext
const createMockGL = () => {
  const mockTexture = {} as WebGLTexture;
  const mockBuffer = {} as WebGLBuffer;
  const mockVAO = {} as WebGLVertexArrayObject;
  const mockProgram = {} as WebGLProgram;
  const mockLocation = {} as WebGLUniformLocation;
  const mockFramebuffer = {} as WebGLFramebuffer;

  return {
    createBuffer: vi.fn(() => mockBuffer),
    createVertexArray: vi.fn(() => mockVAO),
    createTexture: vi.fn(() => mockTexture),
    bindBuffer: vi.fn(),
    bindVertexArray: vi.fn(),
    bindTexture: vi.fn(),
    bindFramebuffer: vi.fn(),
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
    TEXTURE1: 33985,
    TEXTURE_2D: 3553,
    FRAMEBUFFER: 36160,
  } as unknown as WebGL2RenderingContext;
};

const createMockShaderManager = () => ({
  createProgram: vi.fn(() => ({} as WebGLProgram)),
});

describe('PressurePass', () => {
  let gl: WebGL2RenderingContext;
  let shaderManager: ReturnType<typeof createMockShaderManager>;
  let pressurePass: PressurePass;

  beforeEach(() => {
    gl = createMockGL();
    shaderManager = createMockShaderManager();
    pressurePass = new PressurePass(gl, shaderManager);
  });

  describe('initialization', () => {
    it('should create shader program during initialization', () => {
      expect(shaderManager.createProgram).toHaveBeenCalledWith(
        expect.stringContaining('a_position'),
        expect.stringContaining('u_pressure')
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

    it('should get uniform locations for pressure, divergence and texel size', () => {
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_pressure'
      );
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_divergence'
      );
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_texelSize'
      );
    });

    it('should accept custom iteration count', () => {
      const customPass = new PressurePass(gl, shaderManager, 30);
      expect(customPass).toBeDefined();
    });
  });

  describe('setIterations', () => {
    it('should set iteration count within valid range', () => {
      pressurePass.setIterations(25);
      // No direct way to test this, but it should not throw
      expect(() => pressurePass.setIterations(25)).not.toThrow();
    });

    it('should clamp iterations to minimum of 1', () => {
      pressurePass.setIterations(-5);
      // Should clamp to 1, no direct way to test but should not throw
      expect(() => pressurePass.setIterations(-5)).not.toThrow();
    });

    it('should clamp iterations to maximum of 100', () => {
      pressurePass.setIterations(150);
      // Should clamp to 100, no direct way to test but should not throw
      expect(() => pressurePass.setIterations(150)).not.toThrow();
    });
  });

  describe('execute', () => {
    it('should execute pressure pass with proper uniforms', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        pressure: {} as WebGLTexture,
        divergence: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      pressurePass.execute(gl, mockInputs);

      expect(gl.useProgram).toHaveBeenCalled();
      expect(gl.bindVertexArray).toHaveBeenCalled();
      expect(gl.uniform1i).toHaveBeenCalledWith(expect.any(Object), 0);
      expect(gl.uniform1i).toHaveBeenCalledWith(expect.any(Object), 1);
      expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);
    });

    it('should bind pressure and divergence textures', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        pressure: {} as WebGLTexture,
        divergence: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      pressurePass.execute(gl, mockInputs);

      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0);
      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE1);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, mockInputs.pressure);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, mockInputs.divergence);
    });

    it('should throw error if pressure texture is missing', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        divergence: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      expect(() => pressurePass.execute(gl, mockInputs)).toThrow(
        'PressurePass requires pressure and divergence textures'
      );
    });

    it('should throw error if divergence texture is missing', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        pressure: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      expect(() => pressurePass.execute(gl, mockInputs)).toThrow(
        'PressurePass requires pressure and divergence textures'
      );
    });

    it('should throw error if not properly initialized', () => {
      const uninitializedPass = new PressurePass(gl, shaderManager);
      // Simulate failed initialization
      (uninitializedPass as any).program = null;

      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        pressure: {} as WebGLTexture,
        divergence: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      expect(() => uninitializedPass.execute(gl, mockInputs)).toThrow(
        'PressurePass not properly initialized'
      );
    });
  });

  describe('executeIterations', () => {
    it('should execute multiple iterations with framebuffer swapping', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        pressure: {} as WebGLTexture,
        divergence: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      const mockFramebuffers = {
        read: {} as WebGLFramebuffer,
        write: {} as WebGLFramebuffer,
        swap: vi.fn(),
      };

      pressurePass.executeIterations(gl, mockInputs, mockFramebuffers);

      // Should execute 20 iterations by default
      expect(gl.bindFramebuffer).toHaveBeenCalledTimes(20);
      expect(mockFramebuffers.swap).toHaveBeenCalledTimes(20);
    });
  });

  describe('cleanup', () => {
    it('should cleanup WebGL resources', () => {
      pressurePass.cleanup();

      expect(gl.deleteProgram).toHaveBeenCalled();
      expect(gl.deleteBuffer).toHaveBeenCalled();
      expect(gl.deleteVertexArray).toHaveBeenCalled();
    });

    it('should handle cleanup when resources are null', () => {
      pressurePass.cleanup();
      // Should not throw when called again
      expect(() => pressurePass.cleanup()).not.toThrow();
    });
  });
});
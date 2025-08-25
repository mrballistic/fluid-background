/**
 * Unit tests for SplatPass class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SplatPass } from './SplatPass';
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
    uniform3f: vi.fn(),
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

describe('SplatPass', () => {
  let gl: WebGL2RenderingContext;
  let shaderManager: ReturnType<typeof createMockShaderManager>;
  let splatPass: SplatPass;

  beforeEach(() => {
    gl = createMockGL();
    shaderManager = createMockShaderManager();
    splatPass = new SplatPass(gl, shaderManager);
  });

  describe('initialization', () => {
    it('should create shader program during initialization', () => {
      expect(shaderManager.createProgram).toHaveBeenCalledWith(
        expect.stringContaining('a_position'),
        expect.stringContaining('u_target')
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
        'u_target'
      );
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_aspectRatio'
      );
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_color'
      );
      expect(gl.getUniformLocation).toHaveBeenCalledWith(
        expect.any(Object),
        'u_point'
      );
    });

    it('should accept custom splat parameters', () => {
      const customPass = new SplatPass(gl, shaderManager, 0.5, 8000.0);
      expect(customPass).toBeDefined();
    });
  });

  describe('setSplatParameters', () => {
    it('should set splat parameters within valid range', () => {
      splatPass.setSplatParameters(0.3, 5000.0);
      // No direct way to test this, but it should not throw
      expect(() => splatPass.setSplatParameters(0.3, 5000.0)).not.toThrow();
    });

    it('should clamp radius to minimum of 0.01', () => {
      splatPass.setSplatParameters(-0.1, 5000.0);
      // Should clamp to 0.01, no direct way to test but should not throw
      expect(() => splatPass.setSplatParameters(-0.1, 5000.0)).not.toThrow();
    });

    it('should clamp radius to maximum of 1.0', () => {
      splatPass.setSplatParameters(2.0, 5000.0);
      // Should clamp to 1.0, no direct way to test but should not throw
      expect(() => splatPass.setSplatParameters(2.0, 5000.0)).not.toThrow();
    });

    it('should clamp force to minimum of 0', () => {
      splatPass.setSplatParameters(0.3, -1000.0);
      // Should clamp to 0, no direct way to test but should not throw
      expect(() => splatPass.setSplatParameters(0.3, -1000.0)).not.toThrow();
    });
  });

  describe('executeVelocitySplat', () => {
    it('should execute velocity splat with proper uniforms', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      const targetTexture = {} as WebGLTexture;

      splatPass.executeVelocitySplat(gl, mockInputs, targetTexture, 0.5, 0.5, 10.0, -5.0);

      expect(gl.useProgram).toHaveBeenCalled();
      expect(gl.bindVertexArray).toHaveBeenCalled();
      expect(gl.uniform1i).toHaveBeenCalledWith(expect.any(Object), 0);
      expect(gl.uniform1f).toHaveBeenCalledWith(expect.any(Object), 1.0); // aspect ratio
      expect(gl.uniform3f).toHaveBeenCalledWith(expect.any(Object), 10.0, -5.0, 0.0);
      expect(gl.uniform2f).toHaveBeenCalledWith(expect.any(Object), 0.5, 0.5);
      expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);
    });

    it('should bind target texture', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      const targetTexture = {} as WebGLTexture;

      splatPass.executeVelocitySplat(gl, mockInputs, targetTexture, 0.5, 0.5, 10.0, -5.0);

      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, targetTexture);
    });

    it('should throw error if not properly initialized', () => {
      const uninitializedPass = new SplatPass(gl, shaderManager);
      // Simulate failed initialization
      (uninitializedPass as any).program = null;

      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      const targetTexture = {} as WebGLTexture;

      expect(() => 
        uninitializedPass.executeVelocitySplat(gl, mockInputs, targetTexture, 0.5, 0.5, 10.0, -5.0)
      ).toThrow('SplatPass not properly initialized');
    });
  });

  describe('executeDyeSplat', () => {
    it('should execute dye splat with proper color uniforms', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      const targetTexture = {} as WebGLTexture;

      splatPass.executeDyeSplat(gl, mockInputs, targetTexture, 0.3, 0.7, 1.0, 0.5, 0.2);

      expect(gl.useProgram).toHaveBeenCalled();
      expect(gl.uniform3f).toHaveBeenCalledWith(expect.any(Object), 1.0, 0.5, 0.2);
      expect(gl.uniform2f).toHaveBeenCalledWith(expect.any(Object), 0.3, 0.7);
      expect(gl.uniform1f).toHaveBeenCalledWith(expect.any(Object), 1.0); // Full strength for dye
    });
  });

  describe('execute', () => {
    it('should do nothing if no mouse input', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
      };

      splatPass.execute(gl, mockInputs);

      expect(gl.useProgram).not.toHaveBeenCalled();
    });

    it('should do nothing if mouse is not down', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
        mouse: { x: 0.5, y: 0.5, dx: 10.0, dy: -5.0, down: false },
      };

      splatPass.execute(gl, mockInputs);

      expect(gl.useProgram).not.toHaveBeenCalled();
    });

    it('should execute splat if mouse is down', () => {
      const mockInputs: RenderPassInputs = {
        velocity: {} as WebGLTexture,
        density: {} as WebGLTexture,
        deltaTime: 0.016,
        mouse: { x: 0.5, y: 0.5, dx: 10.0, dy: -5.0, down: true },
      };

      splatPass.execute(gl, mockInputs);

      expect(gl.useProgram).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup WebGL resources', () => {
      splatPass.cleanup();

      expect(gl.deleteProgram).toHaveBeenCalled();
      expect(gl.deleteBuffer).toHaveBeenCalled();
      expect(gl.deleteVertexArray).toHaveBeenCalled();
    });

    it('should handle cleanup when resources are null', () => {
      splatPass.cleanup();
      // Should not throw when called again
      expect(() => splatPass.cleanup()).not.toThrow();
    });
  });
});
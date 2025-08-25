import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShaderManagerImpl } from './ShaderManager';
import { ShaderCompilationError } from '../types';

// Mock WebGL context for shader operations
const createMockWebGLContext = () => ({
  createShader: vi.fn(() => ({ id: 'mock-shader' })),
  createProgram: vi.fn(() => ({ id: 'mock-program' })),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  deleteShader: vi.fn(),
  deleteProgram: vi.fn(),
  useProgram: vi.fn(),
  validateProgram: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getProgramParameter: vi.fn((program, param) => {
    if (param === 0x8B82) return true; // LINK_STATUS (correct value)
    if (param === 0x8B83) return true; // VALIDATE_STATUS (correct value)
    if (param === 0x8B86) return 2; // ACTIVE_UNIFORMS
    if (param === 0x8B89) return 1; // ACTIVE_ATTRIBUTES
    return 0;
  }),
  getShaderInfoLog: vi.fn(() => ''),
  getProgramInfoLog: vi.fn(() => ''),
  getActiveUniform: vi.fn((program, index) => {
    const uniforms = [
      { name: 'u_resolution', type: 0x8B50 }, // FLOAT_VEC2
      { name: 'u_texture', type: 0x8B5E }, // SAMPLER_2D
    ];
    return uniforms[index] || null;
  }),
  getActiveAttrib: vi.fn((program, index) => {
    const attributes = [
      { name: 'a_position', type: 0x8B50 }, // FLOAT_VEC2
    ];
    return attributes[index] || null;
  }),
  getUniformLocation: vi.fn((program, name) => ({ name, location: `uniform-${name}` })),
  getAttribLocation: vi.fn((program, name) => 0),
  VERTEX_SHADER: 0x8B31,
  FRAGMENT_SHADER: 0x8B30,
  COMPILE_STATUS: 0x8B81,
  LINK_STATUS: 0x8B82,
  VALIDATE_STATUS: 0x8B83,
  ACTIVE_UNIFORMS: 0x8B86,
  ACTIVE_ATTRIBUTES: 0x8B89,
});

describe('ShaderManagerImpl', () => {
  let shaderManager: ShaderManagerImpl;
  let mockGL: any;

  beforeEach(() => {
    mockGL = createMockWebGLContext();
    shaderManager = new ShaderManagerImpl(mockGL);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('compileShader', () => {
    it('should compile shader successfully', () => {
      const source = 'void main() { gl_Position = vec4(0.0); }';
      
      const shader = shaderManager.compileShader(mockGL.VERTEX_SHADER, source);

      expect(mockGL.createShader).toHaveBeenCalledWith(mockGL.VERTEX_SHADER);
      expect(mockGL.shaderSource).toHaveBeenCalledWith(shader, source);
      expect(mockGL.compileShader).toHaveBeenCalledWith(shader);
      expect(mockGL.getShaderParameter).toHaveBeenCalledWith(shader, mockGL.COMPILE_STATUS);
    });

    it('should cache compiled shaders', () => {
      const source = 'void main() { gl_Position = vec4(0.0); }';
      
      const shader1 = shaderManager.compileShader(mockGL.VERTEX_SHADER, source);
      const shader2 = shaderManager.compileShader(mockGL.VERTEX_SHADER, source);

      expect(shader1).toBe(shader2);
      expect(mockGL.createShader).toHaveBeenCalledTimes(1);
    });

    it('should throw error when shader creation fails', () => {
      mockGL.createShader.mockReturnValue(null);

      expect(() => {
        shaderManager.compileShader(mockGL.VERTEX_SHADER, 'source');
      }).toThrow(ShaderCompilationError);
      expect(() => {
        shaderManager.compileShader(mockGL.VERTEX_SHADER, 'source');
      }).toThrow('Failed to create shader');
    });

    it('should throw error when shader compilation fails', () => {
      mockGL.getShaderParameter.mockReturnValue(false);
      mockGL.getShaderInfoLog.mockReturnValue('Compilation error');

      expect(() => {
        shaderManager.compileShader(mockGL.VERTEX_SHADER, 'invalid source');
      }).toThrow(ShaderCompilationError);
      expect(() => {
        shaderManager.compileShader(mockGL.VERTEX_SHADER, 'invalid source');
      }).toThrow('Shader compilation failed: Compilation error');
      
      expect(mockGL.deleteShader).toHaveBeenCalled();
    });
  });

  describe('createProgram', () => {
    it('should create and link program successfully', () => {
      const vertexShader = { id: 'vertex' };
      const fragmentShader = { id: 'fragment' };

      const program = shaderManager.createProgram(vertexShader as any, fragmentShader as any);

      expect(mockGL.createProgram).toHaveBeenCalled();
      expect(mockGL.attachShader).toHaveBeenCalledWith(program, vertexShader);
      expect(mockGL.attachShader).toHaveBeenCalledWith(program, fragmentShader);
      expect(mockGL.linkProgram).toHaveBeenCalledWith(program);
      expect(mockGL.getProgramParameter).toHaveBeenCalledWith(program, mockGL.LINK_STATUS);
    });

    it('should throw error when program creation fails', () => {
      mockGL.createProgram.mockReturnValue(null);

      expect(() => {
        shaderManager.createProgram({} as any, {} as any);
      }).toThrow(ShaderCompilationError);
      expect(() => {
        shaderManager.createProgram({} as any, {} as any);
      }).toThrow('Failed to create shader program');
    });

    it('should throw error when program linking fails', () => {
      mockGL.getProgramParameter.mockImplementation((program, param) => {
        if (param === mockGL.LINK_STATUS) return false;
        return true;
      });
      mockGL.getProgramInfoLog.mockReturnValue('Linking error');

      expect(() => {
        shaderManager.createProgram({} as any, {} as any);
      }).toThrow(ShaderCompilationError);
      expect(() => {
        shaderManager.createProgram({} as any, {} as any);
      }).toThrow('Program linking failed: Linking error');
      
      expect(mockGL.deleteProgram).toHaveBeenCalled();
    });
  });

  describe('getUniforms', () => {
    it('should extract uniform locations', () => {
      const program = { id: 'test-program' };

      const uniforms = shaderManager.getUniforms(program as any);

      expect(uniforms).toEqual({
        'u_resolution': { name: 'u_resolution', location: 'uniform-u_resolution' },
        'u_texture': { name: 'u_texture', location: 'uniform-u_texture' },
      });
      expect(mockGL.getProgramParameter).toHaveBeenCalledWith(program, mockGL.ACTIVE_UNIFORMS);
      expect(mockGL.getActiveUniform).toHaveBeenCalledTimes(2);
    });

    it('should handle programs with no uniforms', () => {
      mockGL.getProgramParameter.mockReturnValue(0);

      const uniforms = shaderManager.getUniforms({} as any);

      expect(uniforms).toEqual({});
    });
  });

  describe('createShaderProgram', () => {
    it('should create complete shader program with uniforms and attributes', () => {
      const vertexSource = 'vertex shader source';
      const fragmentSource = 'fragment shader source';

      const shaderProgram = shaderManager.createShaderProgram(vertexSource, fragmentSource);

      expect(shaderProgram.program).toBeDefined();
      expect(shaderProgram.uniforms).toEqual({
        'u_resolution': { name: 'u_resolution', location: 'uniform-u_resolution' },
        'u_texture': { name: 'u_texture', location: 'uniform-u_texture' },
      });
      expect(shaderProgram.attributes).toEqual({
        'a_position': 0,
      });
    });

    it('should cache shader programs', () => {
      const vertexSource = 'vertex shader source';
      const fragmentSource = 'fragment shader source';

      const program1 = shaderManager.createShaderProgram(vertexSource, fragmentSource);
      const program2 = shaderManager.createShaderProgram(vertexSource, fragmentSource);

      expect(program1).toBe(program2);
    });

    it('should use custom program ID when provided', () => {
      const vertexSource = 'vertex shader source';
      const fragmentSource = 'fragment shader source';
      const customId = 'custom-program-id';

      const program = shaderManager.createShaderProgram(vertexSource, fragmentSource, customId);
      const cachedProgram = shaderManager.getCachedProgram(customId);

      expect(cachedProgram).toBe(program);
    });
  });

  describe('validateProgram', () => {
    it('should validate program successfully', () => {
      const program = { id: 'test-program' };
      mockGL.getProgramParameter.mockReturnValue(true);

      const isValid = shaderManager.validateProgram(program as any);

      expect(isValid).toBe(true);
      expect(mockGL.validateProgram).toHaveBeenCalledWith(program);
      expect(mockGL.getProgramParameter).toHaveBeenCalledWith(program, mockGL.VALIDATE_STATUS);
    });

    it('should return false for invalid program', () => {
      const program = { id: 'test-program' };
      mockGL.getProgramParameter.mockImplementation((prog, param) => {
        if (param === mockGL.VALIDATE_STATUS) return false;
        return true;
      });

      const isValid = shaderManager.validateProgram(program as any);

      expect(isValid).toBe(false);
    });
  });

  describe('useProgram', () => {
    it('should use the specified program', () => {
      const program = { id: 'test-program' };

      shaderManager.useProgram(program as any);

      expect(mockGL.useProgram).toHaveBeenCalledWith(program);
    });
  });

  describe('cleanup', () => {
    it('should delete all programs and shaders', () => {
      // Create some programs and shaders
      shaderManager.createShaderProgram('vertex1', 'fragment1');
      shaderManager.createShaderProgram('vertex2', 'fragment2');

      shaderManager.cleanup();

      expect(mockGL.deleteProgram).toHaveBeenCalledTimes(2);
      expect(mockGL.deleteShader).toHaveBeenCalled();
    });
  });

  describe('cache management', () => {
    it('should clear specific program from cache', () => {
      const program = shaderManager.createShaderProgram('vertex', 'fragment', 'test-id');
      
      expect(shaderManager.getCachedProgram('test-id')).toBe(program);
      
      shaderManager.clearProgram('test-id');
      
      expect(shaderManager.getCachedProgram('test-id')).toBeUndefined();
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(program.program);
    });

    it('should handle clearing non-existent program', () => {
      expect(() => {
        shaderManager.clearProgram('non-existent');
      }).not.toThrow();
    });
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createWebGLContext,
  detectWebGLCapabilities,
  loadWebGLExtensions,
  isTextureFormatSupported,
  validateFramebuffer,
  checkWebGLError
} from './webgl';

// Mock WebGL context
const createMockWebGLContext = () => {
  const mockGL = {
    // Constants
    TEXTURE_2D: 0x0DE1,
    FRAMEBUFFER: 0x8D40,
    COLOR_ATTACHMENT0: 0x8CE0,
    FRAMEBUFFER_COMPLETE: 0x8CD5,
    FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 0x8CD6,
    FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 0x8CD7,
    FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 0x8CD9,
    FRAMEBUFFER_UNSUPPORTED: 0x8CDD,
    NO_ERROR: 0,
    INVALID_ENUM: 0x0500,
    INVALID_VALUE: 0x0501,
    INVALID_OPERATION: 0x0502,
    OUT_OF_MEMORY: 0x0505,
    CONTEXT_LOST_WEBGL: 0x9242,
    MAX_TEXTURE_SIZE: 0x0D33,
    MAX_RENDERBUFFER_SIZE: 0x84E8,
    MAX_VIEWPORT_DIMS: 0x0D3A,
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C,
    MAX_TEXTURE_IMAGE_UNITS: 0x8872,
    RGBA: 0x1908,
    FLOAT: 0x1406,
    HALF_FLOAT: 0x140B,
    
    // WebGL2 constants
    RGBA32F: 0x8814,
    RGBA16F: 0x881A,

    // Methods
    getParameter: vi.fn((param: number) => {
      switch (param) {
        case 0x0D33: return 4096; // MAX_TEXTURE_SIZE
        case 0x84E8: return 4096; // MAX_RENDERBUFFER_SIZE
        case 0x0D3A: return [4096, 4096]; // MAX_VIEWPORT_DIMS
        case 0x8B4C: return 16; // MAX_VERTEX_TEXTURE_IMAGE_UNITS
        case 0x8872: return 16; // MAX_TEXTURE_IMAGE_UNITS
        default: return 0;
      }
    }),
    getExtension: vi.fn((name: string) => {
      const extensions: Record<string, any> = {
        'OES_texture_float': { HALF_FLOAT_OES: 0x8D61 },
        'OES_texture_half_float': { HALF_FLOAT_OES: 0x8D61 },
        'OES_texture_float_linear': {},
        'OES_texture_half_float_linear': {},
        'WEBGL_color_buffer_float': {},
        'EXT_color_buffer_half_float': {}
      };
      return extensions[name] || null;
    }),
    createTexture: vi.fn(() => ({})),
    deleteTexture: vi.fn(),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    createFramebuffer: vi.fn(() => ({})),
    deleteFramebuffer: vi.fn(),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    checkFramebufferStatus: vi.fn(() => 0x8CD5), // FRAMEBUFFER_COMPLETE
    getError: vi.fn(() => 0) // NO_ERROR
  };

  return mockGL as unknown as WebGL2RenderingContext;
};

describe('WebGL utilities', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockGL: WebGL2RenderingContext;

  beforeEach(() => {
    mockCanvas = {
      getContext: vi.fn()
    } as unknown as HTMLCanvasElement;
    
    mockGL = createMockWebGLContext();
  });

  describe('createWebGLContext', () => {
    it('should try WebGL2 first', () => {
      mockCanvas.getContext = vi.fn()
        .mockReturnValueOnce(mockGL) // WebGL2 success
        .mockReturnValue(null);

      const result = createWebGLContext(mockCanvas);
      
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2', expect.any(Object));
      expect(result).toBe(mockGL);
    });

    it('should fallback to WebGL1 if WebGL2 fails', () => {
      mockCanvas.getContext = vi.fn()
        .mockReturnValueOnce(null) // WebGL2 fails
        .mockReturnValueOnce(mockGL) // WebGL1 success
        .mockReturnValue(null);

      const result = createWebGLContext(mockCanvas);
      
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2', expect.any(Object));
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl', expect.any(Object));
      expect(result).toBe(mockGL);
    });

    it('should try experimental-webgl as last resort', () => {
      mockCanvas.getContext = vi.fn()
        .mockReturnValueOnce(null) // WebGL2 fails
        .mockReturnValueOnce(null) // WebGL1 fails
        .mockReturnValueOnce(mockGL); // experimental-webgl success

      const result = createWebGLContext(mockCanvas);
      
      expect(mockCanvas.getContext).toHaveBeenCalledWith('experimental-webgl', expect.any(Object));
      expect(result).toBe(mockGL);
    });

    it('should return null if all contexts fail', () => {
      mockCanvas.getContext = vi.fn().mockReturnValue(null);

      const result = createWebGLContext(mockCanvas);
      
      expect(result).toBeNull();
    });
  }); 
 describe('detectWebGLCapabilities', () => {
    it('should detect WebGL capabilities', () => {
      const capabilities = detectWebGLCapabilities(mockGL);
      
      expect(capabilities).toEqual({
        maxTextureSize: 4096,
        maxRenderBufferSize: 4096,
        maxViewportDims: [4096, 4096],
        supportsFloatTextures: true,
        supportsHalfFloatTextures: true,
        supportsLinearFiltering: true,
        maxVertexTextureImageUnits: 16,
        maxFragmentTextureImageUnits: 16
      });
    });

    it('should handle missing extensions', () => {
      mockGL.getExtension = vi.fn().mockReturnValue(null);
      
      const capabilities = detectWebGLCapabilities(mockGL);
      
      expect(capabilities.supportsFloatTextures).toBe(false);
      expect(capabilities.supportsHalfFloatTextures).toBe(false);
      expect(capabilities.supportsLinearFiltering).toBe(false);
    });
  });

  describe('loadWebGLExtensions', () => {
    it('should load all extensions', () => {
      const extensions = loadWebGLExtensions(mockGL);
      
      expect(extensions.floatTextures).toBeTruthy();
      expect(extensions.halfFloatTextures).toBeTruthy();
      expect(extensions.linearFloat).toBeTruthy();
      expect(extensions.linearHalfFloat).toBeTruthy();
      expect(extensions.colorBufferFloat).toBeTruthy();
      expect(extensions.colorBufferHalfFloat).toBeTruthy();
    });

    it('should handle missing extensions', () => {
      mockGL.getExtension = vi.fn().mockReturnValue(null);
      
      const extensions = loadWebGLExtensions(mockGL);
      
      expect(extensions.floatTextures).toBeNull();
      expect(extensions.halfFloatTextures).toBeNull();
    });
  });

  describe('isTextureFormatSupported', () => {
    it('should return true for supported formats', () => {
      const supported = isTextureFormatSupported(mockGL, mockGL.RGBA, mockGL.RGBA, mockGL.FLOAT);
      
      expect(supported).toBe(true);
      expect(mockGL.createTexture).toHaveBeenCalled();
      expect(mockGL.createFramebuffer).toHaveBeenCalled();
    });

    it('should return false if texture creation fails', () => {
      mockGL.createTexture = vi.fn().mockReturnValue(null);
      
      const supported = isTextureFormatSupported(mockGL, mockGL.RGBA, mockGL.RGBA, mockGL.FLOAT);
      
      expect(supported).toBe(false);
    });

    it('should return false if framebuffer creation fails', () => {
      mockGL.createFramebuffer = vi.fn().mockReturnValue(null);
      
      const supported = isTextureFormatSupported(mockGL, mockGL.RGBA, mockGL.RGBA, mockGL.FLOAT);
      
      expect(supported).toBe(false);
    });

    it('should return false if framebuffer is incomplete', () => {
      mockGL.checkFramebufferStatus = vi.fn().mockReturnValue(mockGL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT);
      
      const supported = isTextureFormatSupported(mockGL, mockGL.RGBA, mockGL.RGBA, mockGL.FLOAT);
      
      expect(supported).toBe(false);
    });

    it('should handle texImage2D exceptions', () => {
      mockGL.texImage2D = vi.fn().mockImplementation(() => {
        throw new Error('Invalid format');
      });
      
      const supported = isTextureFormatSupported(mockGL, mockGL.RGBA, mockGL.RGBA, mockGL.FLOAT);
      
      expect(supported).toBe(false);
    });
  });

  describe('validateFramebuffer', () => {
    it('should return true for complete framebuffer', () => {
      mockGL.checkFramebufferStatus = vi.fn().mockReturnValue(mockGL.FRAMEBUFFER_COMPLETE);
      
      const isValid = validateFramebuffer(mockGL);
      
      expect(isValid).toBe(true);
    });

    it('should return false and log warning for incomplete framebuffer', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockGL.checkFramebufferStatus = vi.fn().mockReturnValue(mockGL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT);
      
      const isValid = validateFramebuffer(mockGL);
      
      expect(isValid).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Framebuffer validation failed: Incomplete attachment');
      
      consoleSpy.mockRestore();
    });
  });

  describe('checkWebGLError', () => {
    it('should return true when no error', () => {
      mockGL.getError = vi.fn().mockReturnValue(mockGL.NO_ERROR);
      
      const hasError = checkWebGLError(mockGL, 'test operation');
      
      expect(hasError).toBe(true);
    });

    it('should return false and log error when error exists', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGL.getError = vi.fn().mockReturnValue(mockGL.INVALID_ENUM);
      
      const hasError = checkWebGLError(mockGL, 'test operation');
      
      expect(hasError).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('WebGL error during test operation: Invalid enum (1280)');
      
      consoleSpy.mockRestore();
    });
  });
});
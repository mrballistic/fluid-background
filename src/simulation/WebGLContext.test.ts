import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebGLContextImpl } from './WebGLContext';
import { WebGLError } from '../types';

// Mock WebGL context
const createMockWebGLContext = () => ({
  getParameter: vi.fn((param) => {
    if (param === 0x0D33) return 4096; // MAX_TEXTURE_SIZE
    return null;
  }),
  getExtension: vi.fn((name) => {
    const extensions: Record<string, any> = {
      'OES_texture_float': { FLOAT_OES: 0x1406 },
      'OES_texture_half_float': { HALF_FLOAT_OES: 0x8D61 },
      'OES_texture_float_linear': {},
      'OES_texture_half_float_linear': {},
      'WEBGL_lose_context': { loseContext: vi.fn() },
    };
    return extensions[name] || null;
  }),
  viewport: vi.fn(),
  isContextLost: vi.fn(() => false),
  RGBA: 0x1908,
  RGBA32F: 0x8814,
  FLOAT: 0x1406,
  UNSIGNED_BYTE: 0x1401,
  MAX_TEXTURE_SIZE: 0x0D33,
});

// Mock canvas
const createMockCanvas = () => ({
  getContext: vi.fn(),
  width: 0,
  height: 0,
});

describe('WebGLContextImpl', () => {
  let webglContext: WebGLContextImpl;
  let mockCanvas: any;
  let mockGL: any;

  beforeEach(() => {
    webglContext = new WebGLContextImpl();
    mockCanvas = createMockCanvas();
    mockGL = createMockWebGLContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize WebGL2 context successfully', () => {
      mockCanvas.getContext.mockReturnValueOnce(mockGL);

      const result = webglContext.initialize(mockCanvas);

      expect(result).toBe(true);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2', expect.any(Object));
      expect(webglContext.gl).toBe(mockGL);
    });

    it('should fallback to WebGL1 if WebGL2 is not available', () => {
      mockCanvas.getContext
        .mockReturnValueOnce(null) // WebGL2 fails
        .mockReturnValueOnce(mockGL); // WebGL1 succeeds

      const result = webglContext.initialize(mockCanvas);

      expect(result).toBe(true);
      expect(mockCanvas.getContext).toHaveBeenCalledTimes(2);
      expect(mockCanvas.getContext).toHaveBeenNthCalledWith(1, 'webgl2', expect.any(Object));
      expect(mockCanvas.getContext).toHaveBeenNthCalledWith(2, 'webgl', expect.any(Object));
    });

    it('should throw WebGLError if no WebGL context is available', () => {
      mockCanvas.getContext.mockReturnValue(null);

      expect(() => webglContext.initialize(mockCanvas)).toThrow(WebGLError);
      expect(() => webglContext.initialize(mockCanvas)).toThrow('WebGL is not supported in this browser');
    });

    it('should load extensions after initialization', () => {
      mockCanvas.getContext.mockReturnValueOnce(mockGL);

      webglContext.initialize(mockCanvas);

      expect(mockGL.getExtension).toHaveBeenCalledWith('OES_texture_float');
      expect(mockGL.getExtension).toHaveBeenCalledWith('OES_texture_half_float');
      expect(mockGL.getExtension).toHaveBeenCalledWith('OES_texture_float_linear');
      expect(mockGL.getExtension).toHaveBeenCalledWith('OES_texture_half_float_linear');
    });

    it('should detect capabilities after initialization', () => {
      mockCanvas.getContext.mockReturnValueOnce(mockGL);

      webglContext.initialize(mockCanvas);

      expect(webglContext.capabilities.maxTextureSize).toBe(4096);
      expect(webglContext.capabilities.floatTextures).toBe(true);
      expect(webglContext.capabilities.halfFloatTextures).toBe(true);
      expect(webglContext.capabilities.linearFiltering).toBe(true);
    });
  });

  describe('resize', () => {
    beforeEach(() => {
      mockCanvas.getContext.mockReturnValueOnce(mockGL);
      webglContext.initialize(mockCanvas);
    });

    it('should resize canvas and viewport', () => {
      webglContext.resize(800, 600);

      expect(mockCanvas.width).toBe(800);
      expect(mockCanvas.height).toBe(600);
      expect(mockGL.viewport).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should throw error if context not initialized', () => {
      const uninitializedContext = new WebGLContextImpl();

      expect(() => uninitializedContext.resize(800, 600)).toThrow(WebGLError);
      expect(() => uninitializedContext.resize(800, 600)).toThrow('WebGL context not initialized');
    });
  });

  describe('cleanup', () => {
    it('should lose WebGL context and clear references', () => {
      mockCanvas.getContext.mockReturnValueOnce(mockGL);
      webglContext.initialize(mockCanvas);

      const loseContextMock = { loseContext: vi.fn() };
      mockGL.getExtension.mockReturnValue(loseContextMock);

      webglContext.cleanup();

      expect(mockGL.getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
      expect(loseContextMock.loseContext).toHaveBeenCalled();
      expect(webglContext.extensions).toEqual({});
    });

    it('should handle cleanup when lose context extension is not available', () => {
      mockCanvas.getContext.mockReturnValueOnce(mockGL);
      webglContext.initialize(mockCanvas);

      mockGL.getExtension.mockReturnValue(null);

      expect(() => webglContext.cleanup()).not.toThrow();
    });
  });

  describe('isContextLost', () => {
    it('should return false when context is valid', () => {
      mockCanvas.getContext.mockReturnValueOnce(mockGL);
      webglContext.initialize(mockCanvas);

      expect(webglContext.isContextLost()).toBe(false);
    });

    it('should return true when context is lost', () => {
      mockCanvas.getContext.mockReturnValueOnce(mockGL);
      webglContext.initialize(mockCanvas);

      mockGL.isContextLost.mockReturnValue(true);

      expect(webglContext.isContextLost()).toBe(true);
    });

    it('should return true when context is not initialized', () => {
      expect(webglContext.isContextLost()).toBe(true);
    });
  });

  describe('getOptimalTextureFormat', () => {
    it('should return float format when float textures are supported', () => {
      mockCanvas.getContext.mockReturnValueOnce(mockGL);
      webglContext.initialize(mockCanvas);

      const format = webglContext.getOptimalTextureFormat();

      expect(format.type).toBe(mockGL.FLOAT);
      expect(format.format).toBe(mockGL.RGBA);
    });

    it('should return half float format when only half float is supported', () => {
      mockGL.getExtension.mockImplementation((name) => {
        if (name === 'OES_texture_half_float') return { HALF_FLOAT_OES: 0x8D61 };
        if (name === 'OES_texture_float') return null;
        return null;
      });

      mockCanvas.getContext.mockReturnValueOnce(mockGL);
      webglContext.initialize(mockCanvas);

      const format = webglContext.getOptimalTextureFormat();

      expect(format.type).toBe(0x8D61); // HALF_FLOAT_OES
      expect(format.format).toBe(mockGL.RGBA);
    });

    it('should fallback to unsigned byte when no float support', () => {
      mockGL.getExtension.mockReturnValue(null);

      mockCanvas.getContext.mockReturnValueOnce(mockGL);
      webglContext.initialize(mockCanvas);

      const format = webglContext.getOptimalTextureFormat();

      expect(format.type).toBe(mockGL.UNSIGNED_BYTE);
      expect(format.format).toBe(mockGL.RGBA);
    });
  });
});
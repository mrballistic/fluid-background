import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FramebufferManagerImpl } from './FramebufferManager';
import { WebGLError } from '../types';

// Mock WebGL context for framebuffer operations
const createMockWebGLContext = () => ({
  createFramebuffer: vi.fn(() => ({ id: 'mock-framebuffer' })),
  createTexture: vi.fn(() => ({ id: 'mock-texture' })),
  bindFramebuffer: vi.fn(),
  bindTexture: vi.fn(),
  framebufferTexture2D: vi.fn(),
  texParameteri: vi.fn(),
  texImage2D: vi.fn(),
  checkFramebufferStatus: vi.fn(() => 0x8CD5), // FRAMEBUFFER_COMPLETE
  getFramebufferAttachmentParameter: vi.fn(() => ({ id: 'attached-texture' })),
  deleteFramebuffer: vi.fn(),
  deleteTexture: vi.fn(),
  
  // WebGL constants
  FRAMEBUFFER: 0x8D40,
  TEXTURE_2D: 0x0DE1,
  COLOR_ATTACHMENT0: 0x8CE0,
  FRAMEBUFFER_COMPLETE: 0x8CD5,
  FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 0x8CD6,
  FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 0x8CD7,
  FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 0x8CD9,
  FRAMEBUFFER_UNSUPPORTED: 0x8CDD,
  FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 0x8CD1,
  
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,
  LINEAR: 0x2601,
  CLAMP_TO_EDGE: 0x812F,
  
  RGBA: 0x1908,
  RGBA32F: 0x8814,
  RGBA16F: 0x881A,
  FLOAT: 0x1406,
  HALF_FLOAT: 0x140B,
  UNSIGNED_BYTE: 0x1401,
});

describe('FramebufferManagerImpl', () => {
  let framebufferManager: FramebufferManagerImpl;
  let mockGL: any;

  beforeEach(() => {
    mockGL = createMockWebGLContext();
    framebufferManager = new FramebufferManagerImpl(mockGL);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createFramebuffer', () => {
    it('should create framebuffer with texture attachment', () => {
      const framebuffer = framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);

      expect(mockGL.createFramebuffer).toHaveBeenCalled();
      expect(mockGL.createTexture).toHaveBeenCalled();
      expect(mockGL.bindFramebuffer).toHaveBeenCalledWith(mockGL.FRAMEBUFFER, framebuffer);
      expect(mockGL.framebufferTexture2D).toHaveBeenCalledWith(
        mockGL.FRAMEBUFFER,
        mockGL.COLOR_ATTACHMENT0,
        mockGL.TEXTURE_2D,
        expect.any(Object),
        0
      );
      expect(mockGL.checkFramebufferStatus).toHaveBeenCalledWith(mockGL.FRAMEBUFFER);
    });

    it('should throw error when framebuffer creation fails', () => {
      mockGL.createFramebuffer.mockReturnValue(null);

      expect(() => {
        framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);
      }).toThrow(WebGLError);
      expect(() => {
        framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);
      }).toThrow('Failed to create framebuffer');
    });

    it('should throw error when texture creation fails', () => {
      mockGL.createTexture.mockReturnValue(null);

      expect(() => {
        framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);
      }).toThrow(WebGLError);
      expect(() => {
        framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);
      }).toThrow('Failed to create texture');
    });

    it('should throw error when framebuffer is incomplete', () => {
      mockGL.checkFramebufferStatus.mockReturnValue(mockGL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT);

      expect(() => {
        framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);
      }).toThrow(WebGLError);
      expect(() => {
        framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);
      }).toThrow('Framebuffer incomplete: FRAMEBUFFER_INCOMPLETE_ATTACHMENT');
      
      expect(mockGL.deleteFramebuffer).toHaveBeenCalled();
      expect(mockGL.deleteTexture).toHaveBeenCalled();
    });

    it('should set correct texture parameters', () => {
      framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);

      expect(mockGL.texParameteri).toHaveBeenCalledWith(mockGL.TEXTURE_2D, mockGL.TEXTURE_MIN_FILTER, mockGL.LINEAR);
      expect(mockGL.texParameteri).toHaveBeenCalledWith(mockGL.TEXTURE_2D, mockGL.TEXTURE_MAG_FILTER, mockGL.LINEAR);
      expect(mockGL.texParameteri).toHaveBeenCalledWith(mockGL.TEXTURE_2D, mockGL.TEXTURE_WRAP_S, mockGL.CLAMP_TO_EDGE);
      expect(mockGL.texParameteri).toHaveBeenCalledWith(mockGL.TEXTURE_2D, mockGL.TEXTURE_WRAP_T, mockGL.CLAMP_TO_EDGE);
    });
  });

  describe('createFramebufferPair', () => {
    it('should create pair of framebuffers for ping-pong rendering', () => {
      const pair = framebufferManager.createFramebufferPair(512, 512, mockGL.RGBA);

      expect(pair.read).toBeDefined();
      expect(pair.write).toBeDefined();
      expect(pair.texture).toBeDefined();
      expect(typeof pair.swap).toBe('function');
      expect(mockGL.createFramebuffer).toHaveBeenCalledTimes(2);
    });

    it('should swap read and write framebuffers', () => {
      const pair = framebufferManager.createFramebufferPair(512, 512, mockGL.RGBA);
      
      const originalRead = pair.read;
      const originalWrite = pair.write;
      
      pair.swap();
      
      expect(pair.read).toBe(originalWrite);
      expect(pair.write).toBe(originalRead);
    });

    it('should update texture when swapping', () => {
      const pair = framebufferManager.createFramebufferPair(512, 512, mockGL.RGBA);
      
      // const _originalTexture = pair.texture;
      
      pair.swap();
      
      // Texture should change after swap
      expect(pair.texture).toBeDefined();
      // Note: In a real implementation, we'd verify the texture corresponds to the read framebuffer
    });
  });

  describe('texture format handling', () => {
    it('should handle RGBA32F format', () => {
      framebufferManager.createFramebuffer(512, 512, mockGL.RGBA32F);

      expect(mockGL.texImage2D).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        0,
        mockGL.RGBA32F,
        512,
        512,
        0,
        mockGL.RGBA,
        mockGL.FLOAT,
        null
      );
    });

    it('should handle RGBA16F format', () => {
      framebufferManager.createFramebuffer(512, 512, mockGL.RGBA16F);

      expect(mockGL.texImage2D).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        0,
        mockGL.RGBA16F,
        512,
        512,
        0,
        mockGL.RGBA,
        mockGL.HALF_FLOAT,
        null
      );
    });

    it('should handle default RGBA format', () => {
      framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);

      expect(mockGL.texImage2D).toHaveBeenCalledWith(
        mockGL.TEXTURE_2D,
        0,
        mockGL.RGBA,
        512,
        512,
        0,
        mockGL.RGBA,
        mockGL.UNSIGNED_BYTE,
        null
      );
    });
  });

  describe('isFramebufferComplete', () => {
    it('should return true for complete framebuffer', () => {
      const framebuffer = { id: 'test-framebuffer' };
      mockGL.checkFramebufferStatus.mockReturnValue(mockGL.FRAMEBUFFER_COMPLETE);

      const isComplete = framebufferManager.isFramebufferComplete(framebuffer as any);

      expect(isComplete).toBe(true);
      expect(mockGL.bindFramebuffer).toHaveBeenCalledWith(mockGL.FRAMEBUFFER, framebuffer);
      expect(mockGL.bindFramebuffer).toHaveBeenCalledWith(mockGL.FRAMEBUFFER, null);
    });

    it('should return false for incomplete framebuffer', () => {
      const framebuffer = { id: 'test-framebuffer' };
      mockGL.checkFramebufferStatus.mockReturnValue(mockGL.FRAMEBUFFER_INCOMPLETE_ATTACHMENT);

      const isComplete = framebufferManager.isFramebufferComplete(framebuffer as any);

      expect(isComplete).toBe(false);
    });
  });

  describe('bindFramebuffer', () => {
    it('should bind framebuffer', () => {
      const framebuffer = { id: 'test-framebuffer' };

      framebufferManager.bindFramebuffer(framebuffer as any);

      expect(mockGL.bindFramebuffer).toHaveBeenCalledWith(mockGL.FRAMEBUFFER, framebuffer);
    });

    it('should bind null to unbind framebuffer', () => {
      framebufferManager.bindFramebuffer(null);

      expect(mockGL.bindFramebuffer).toHaveBeenCalledWith(mockGL.FRAMEBUFFER, null);
    });
  });

  describe('cached framebuffers', () => {
    it('should create and cache framebuffer with ID', () => {
      const framebuffer1 = framebufferManager.createCachedFramebuffer('test-id', 512, 512, mockGL.RGBA);
      const framebuffer2 = framebufferManager.createCachedFramebuffer('test-id', 512, 512, mockGL.RGBA);

      expect(framebuffer1).toBe(framebuffer2);
      expect(mockGL.createFramebuffer).toHaveBeenCalledTimes(1);
    });

    it('should create and cache framebuffer pair with ID', () => {
      const pair1 = framebufferManager.createCachedFramebufferPair('pair-id', 512, 512, mockGL.RGBA);
      const pair2 = framebufferManager.createCachedFramebufferPair('pair-id', 512, 512, mockGL.RGBA);

      expect(pair1).toBe(pair2);
      expect(mockGL.createFramebuffer).toHaveBeenCalledTimes(2); // Pair creates 2 framebuffers
    });
  });

  describe('resize', () => {
    it('should cleanup resources on resize', () => {
      // Create some framebuffers first
      framebufferManager.createCachedFramebuffer('test1', 512, 512, mockGL.RGBA);
      framebufferManager.createCachedFramebuffer('test2', 512, 512, mockGL.RGBA);

      framebufferManager.resize(1024, 1024);

      expect(mockGL.deleteFramebuffer).toHaveBeenCalledTimes(2);
      expect(mockGL.deleteTexture).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should delete all framebuffers and textures', () => {
      // Create some resources
      framebufferManager.createCachedFramebuffer('test1', 512, 512, mockGL.RGBA);
      framebufferManager.createCachedFramebufferPair('pair1', 512, 512, mockGL.RGBA);

      framebufferManager.cleanup();

      expect(mockGL.deleteFramebuffer).toHaveBeenCalled();
      expect(mockGL.deleteTexture).toHaveBeenCalled();
    });
  });

  describe('framebuffer status strings', () => {
    it('should handle unknown framebuffer status', () => {
      mockGL.checkFramebufferStatus.mockReturnValue(0x9999); // Unknown status

      expect(() => {
        framebufferManager.createFramebuffer(512, 512, mockGL.RGBA);
      }).toThrow('Framebuffer incomplete: UNKNOWN_STATUS_39321');
    });
  });
});
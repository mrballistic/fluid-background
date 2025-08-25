/**
 * WebGL utility functions for fluid simulation
 */

export interface WebGLCapabilities {
  maxTextureSize: number;
  maxRenderBufferSize: number;
  maxViewportDims: [number, number];
  supportsFloatTextures: boolean;
  supportsHalfFloatTextures: boolean;
  supportsLinearFiltering: boolean;
  maxVertexTextureImageUnits: number;
  maxFragmentTextureImageUnits: number;
}

export interface WebGLExtensions {
  floatTextures: OES_texture_float | null;
  halfFloatTextures: OES_texture_half_float | null;
  linearFloat: OES_texture_float_linear | null;
  linearHalfFloat: OES_texture_half_float_linear | null;
  colorBufferFloat: WEBGL_color_buffer_float | null;
  colorBufferHalfFloat: EXT_color_buffer_half_float | null;
}

/**
 * Creates a WebGL2 or WebGL context with fallback
 */
export const createWebGLContext = (canvas: HTMLCanvasElement): WebGL2RenderingContext | WebGLRenderingContext | null => {
  const contextOptions: WebGLContextAttributes = {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  };

  // Try WebGL2 first
  let gl = canvas.getContext('webgl2', contextOptions) as WebGL2RenderingContext;
  if (gl) return gl;

  // Fallback to WebGL1
  gl = canvas.getContext('webgl', contextOptions) as WebGL2RenderingContext;
  if (gl) return gl;

  // Try experimental contexts
  gl = canvas.getContext('experimental-webgl', contextOptions) as WebGL2RenderingContext;
  return gl || null;
};

/**
 * Detects WebGL capabilities and extensions
 */
export const detectWebGLCapabilities = (gl: WebGL2RenderingContext | WebGLRenderingContext): WebGLCapabilities => {
  const extensions = loadWebGLExtensions(gl);
  
  return {
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
    supportsFloatTextures: !!extensions.floatTextures,
    supportsHalfFloatTextures: !!extensions.halfFloatTextures,
    supportsLinearFiltering: !!extensions.linearFloat || !!extensions.linearHalfFloat,
    maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
    maxFragmentTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
  };
};/**
 
* Loads WebGL extensions
 */
export const loadWebGLExtensions = (gl: WebGL2RenderingContext | WebGLRenderingContext): WebGLExtensions => {
  return {
    floatTextures: gl.getExtension('OES_texture_float'),
    halfFloatTextures: gl.getExtension('OES_texture_half_float'),
    linearFloat: gl.getExtension('OES_texture_float_linear'),
    linearHalfFloat: gl.getExtension('OES_texture_half_float_linear'),
    colorBufferFloat: gl.getExtension('WEBGL_color_buffer_float'),
    colorBufferHalfFloat: gl.getExtension('EXT_color_buffer_half_float')
  };
};

/**
 * Checks if a texture format is supported
 */
export const isTextureFormatSupported = (
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  internalFormat: number,
  format: number,
  type: number
): boolean => {
  const texture = gl.createTexture();
  if (!texture) return false;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, format, type, null);
    
    // Check if we can render to this texture format
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      gl.deleteTexture(texture);
      return false;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    const supported = status === gl.FRAMEBUFFER_COMPLETE;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    
    return supported;
  } catch (e) {
    gl.deleteTexture(texture);
    return false;
  }
};

/**
 * Gets the best supported texture format for floating point textures
 */
export const getBestFloatTextureFormat = (
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  capabilities: WebGLCapabilities
): { internalFormat: number; format: number; type: number } | null => {
  // WebGL2 formats
  if ('texImage2D' in gl && gl instanceof WebGL2RenderingContext) {
    // Try RGBA32F first
    if (isTextureFormatSupported(gl, gl.RGBA32F, gl.RGBA, gl.FLOAT)) {
      return { internalFormat: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT };
    }
    
    // Try RGBA16F
    if (isTextureFormatSupported(gl, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT)) {
      return { internalFormat: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT };
    }
  }

  // WebGL1 formats with extensions
  const extensions = loadWebGLExtensions(gl);
  
  if (capabilities.supportsFloatTextures && extensions.floatTextures) {
    if (isTextureFormatSupported(gl, gl.RGBA, gl.RGBA, gl.FLOAT)) {
      return { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.FLOAT };
    }
  }
  
  if (capabilities.supportsHalfFloatTextures && extensions.halfFloatTextures) {
    const halfFloatType = extensions.halfFloatTextures.HALF_FLOAT_OES;
    if (isTextureFormatSupported(gl, gl.RGBA, gl.RGBA, halfFloatType)) {
      return { internalFormat: gl.RGBA, format: gl.RGBA, type: halfFloatType };
    }
  }

  return null;
};

/**
 * Validates framebuffer completeness
 */
export const validateFramebuffer = (gl: WebGL2RenderingContext | WebGLRenderingContext): boolean => {
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    let error = 'Unknown framebuffer error';
    
    switch (status) {
      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        error = 'Incomplete attachment';
        break;
      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        error = 'Missing attachment';
        break;
      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        error = 'Incomplete dimensions';
        break;
      case gl.FRAMEBUFFER_UNSUPPORTED:
        error = 'Unsupported framebuffer format';
        break;
    }
    
    console.warn(`Framebuffer validation failed: ${error}`);
    return false;
  }
  
  return true;
};

/**
 * Checks WebGL error and logs it
 */
export const checkWebGLError = (gl: WebGL2RenderingContext | WebGLRenderingContext, operation: string): boolean => {
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    let errorString = 'Unknown error';
    
    switch (error) {
      case gl.INVALID_ENUM:
        errorString = 'Invalid enum';
        break;
      case gl.INVALID_VALUE:
        errorString = 'Invalid value';
        break;
      case gl.INVALID_OPERATION:
        errorString = 'Invalid operation';
        break;
      case gl.OUT_OF_MEMORY:
        errorString = 'Out of memory';
        break;
      case gl.CONTEXT_LOST_WEBGL:
        errorString = 'Context lost';
        break;
    }
    
    console.error(`WebGL error during ${operation}: ${errorString} (${error})`);
    return false;
  }
  
  return true;
};
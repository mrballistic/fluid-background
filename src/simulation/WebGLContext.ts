import { WebGLContext, WebGLExtensions, WebGLCapabilities, WebGLError } from '../types';

export class WebGLContextImpl implements WebGLContext {
  public gl!: WebGL2RenderingContext;
  public extensions: WebGLExtensions = {};
  public capabilities: WebGLCapabilities = {
    maxTextureSize: 0,
    floatTextures: false,
    halfFloatTextures: false,
    linearFiltering: false,
  };

  private canvas?: HTMLCanvasElement;

  /**
   * Initialize WebGL context with fallback to WebGL1
   */
  public initialize(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;

    // Try WebGL2 first
    let gl = canvas.getContext('webgl2', {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    }) as WebGL2RenderingContext;

    // Fallback to WebGL1
    if (!gl) {
      gl = canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
      }) as WebGL2RenderingContext;
    }

    if (!gl) {
      throw new WebGLError('WebGL is not supported in this browser');
    }

    this.gl = gl;
    this.loadExtensions();
    this.detectCapabilities();

    return true;
  }

  /**
   * Load WebGL extensions
   */
  private loadExtensions(): void {
    const gl = this.gl;

    // Float texture extensions
    this.extensions.floatTexture = gl.getExtension('OES_texture_float') || undefined;
    this.extensions.halfFloatTexture = gl.getExtension('OES_texture_half_float') || undefined;
    
    // Linear filtering for float textures
    this.extensions.linearFloat = gl.getExtension('OES_texture_float_linear') || undefined;
    this.extensions.linearHalfFloat = gl.getExtension('OES_texture_half_float_linear') || undefined;
  }

  /**
   * Detect WebGL capabilities
   */
  private detectCapabilities(): void {
    const gl = this.gl;

    // Max texture size
    this.capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    // Float texture support
    this.capabilities.floatTextures = !!this.extensions.floatTexture;
    this.capabilities.halfFloatTextures = !!this.extensions.halfFloatTexture;

    // Linear filtering support for float textures
    this.capabilities.linearFiltering = !!(
      this.extensions.linearFloat || this.extensions.linearHalfFloat
    );
  }

  /**
   * Resize the WebGL viewport
   */
  public resize(width: number, height: number): void {
    if (!this.canvas || !this.gl) {
      throw new WebGLError('WebGL context not initialized');
    }

    // Update canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // Update viewport
    this.gl.viewport(0, 0, width, height);
  }

  /**
   * Clean up WebGL resources
   */
  public cleanup(): void {
    if (this.gl && this.canvas) {
      // Lose context to free resources
      const loseContext = this.gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
    }

    this.extensions = {};
    this.canvas = undefined;
  }

  /**
   * Check if WebGL context is lost
   */
  public isContextLost(): boolean {
    return this.gl ? this.gl.isContextLost() : true;
  }

  /**
   * Get optimal texture format based on capabilities
   */
  public getOptimalTextureFormat(): { internalFormat: number; format: number; type: number } {
    const gl = this.gl;

    if (this.capabilities.floatTextures) {
      return {
        internalFormat: gl.RGBA32F || gl.RGBA,
        format: gl.RGBA,
        type: gl.FLOAT,
      };
    }

    if (this.capabilities.halfFloatTextures) {
      const halfFloatType = this.extensions.halfFloatTexture?.HALF_FLOAT_OES || gl.UNSIGNED_BYTE;
      return {
        internalFormat: gl.RGBA,
        format: gl.RGBA,
        type: halfFloatType,
      };
    }

    // Fallback to unsigned byte
    return {
      internalFormat: gl.RGBA,
      format: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
    };
  }
}
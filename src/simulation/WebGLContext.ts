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

    // Set up context lost/restored handlers before creating context
    canvas.addEventListener('webglcontextlost', this.handleContextLost.bind(this), false);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored.bind(this), false);

    // Try WebGL2 first
    let gl = canvas.getContext('webgl2', {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'default', // Use default power preference
      failIfMajorPerformanceCaveat: false, // Allow software rendering if needed
    }) as WebGL2RenderingContext;

    // Fallback to WebGL1
    if (!gl) {
      console.log('WebGL2 not available, falling back to WebGL1');
      gl = canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      }) as WebGL2RenderingContext;
    }

    if (!gl) {
      throw new WebGLError('WebGL is not supported in this browser');
    }

    // Check if context is immediately lost
    if (gl.isContextLost()) {
      throw new WebGLError('WebGL context was lost immediately after creation');
    }

    this.gl = gl;
    
    try {
      this.loadExtensions();
      this.detectCapabilities();
      
      // Set up initial WebGL state
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      console.log('WebGL context initialized successfully');
      return true;
    } catch (error) {
      console.error('Error during WebGL initialization:', error);
      throw error;
    }
  }

  /**
   * Handle WebGL context lost event
   */
  private handleContextLost(event: Event): void {
    console.warn('WebGL context lost');
    event.preventDefault();
  }

  /**
   * Handle WebGL context restored event
   */
  private handleContextRestored(event: Event): void {
    console.log('WebGL context restored');
    // Re-initialize if needed
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
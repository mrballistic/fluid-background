import { FramebufferManager, FramebufferPair, WebGLError } from '../types';

export class FramebufferManagerImpl implements FramebufferManager {
  private gl: WebGL2RenderingContext;
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();
  private framebufferPairs: Map<string, FramebufferPair> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private currentWidth: number = 0;
  private currentHeight: number = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * Create a single framebuffer with texture attachment
   */
  public createFramebuffer(width: number, height: number, format: number): WebGLFramebuffer {
    const gl = this.gl;
    
    // Check if WebGL context is valid
    if (!gl || gl.isContextLost()) {
      throw new WebGLError('WebGL context is lost or invalid');
    }
    
    // Validate dimensions
    if (width <= 0 || height <= 0) {
      throw new WebGLError(`Invalid framebuffer dimensions: ${width}x${height}`);
    }
    
    // Create framebuffer
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      console.error('WebGL state:', {
        contextLost: gl.isContextLost(),
        error: gl.getError(),
        version: gl.getParameter(gl.VERSION)
      });
      throw new WebGLError('Failed to create framebuffer');
    }

    // Create texture
    const texture = this.createTexture(width, height, format);
    
    // Bind and attach texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    // Check framebuffer completeness
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer creation failed:', {
        status: this.getFramebufferStatusString(status),
        statusCode: status,
        statusHex: '0x' + status.toString(16),
        width,
        height,
        format,
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)
      });
      
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
      
      // Provide specific error messages for common issues
      let errorMessage = `Framebuffer incomplete: ${this.getFramebufferStatusString(status)}`;
      if (status === 36054) { // GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE
        errorMessage += ' - This may be due to multisampling configuration issues. Try using a different browser or updating your graphics drivers.';
      } else if (width > gl.getParameter(gl.MAX_TEXTURE_SIZE) || height > gl.getParameter(gl.MAX_TEXTURE_SIZE)) {
        errorMessage += ` - Texture dimensions (${width}x${height}) exceed maximum supported size (${gl.getParameter(gl.MAX_TEXTURE_SIZE)}).`;
      }
      
      throw new WebGLError(errorMessage);
    }

    // Clear the framebuffer to initialize it
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Unbind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return framebuffer;
  }

  /**
   * Create a framebuffer pair for ping-pong rendering
   */
  public createFramebufferPair(width: number, height: number, format: number): FramebufferPair {
    
    // Create two framebuffers
    const fbo1 = this.createFramebuffer(width, height, format);
    const fbo2 = this.createFramebuffer(width, height, format);
    
    // Get textures from framebuffers
    const texture1 = this.getFramebufferTexture(fbo1);
    const texture2 = this.getFramebufferTexture(fbo2);

    if (!texture1 || !texture2) {
      throw new WebGLError('Failed to get framebuffer textures');
    }

    let currentRead = fbo1;
    let currentWrite = fbo2;
    let currentTexture = texture1;

    const framebufferPair: FramebufferPair = {
      get read() { return currentRead; },
      get write() { return currentWrite; },
      get texture() { return currentTexture; },
      
      swap() {
        // Swap read and write framebuffers
        const tempFbo = currentRead;
        currentRead = currentWrite;
        currentWrite = tempFbo;
        
        // Update texture to match the read framebuffer
        currentTexture = currentRead === fbo1 ? texture1 : texture2;
      }
    };

    return framebufferPair;
  }

  /**
   * Create a texture with specified parameters
   */
  private createTexture(width: number, height: number, format: number): WebGLTexture {
    const gl = this.gl;
    
    const texture = gl.createTexture();
    if (!texture) {
      throw new WebGLError('Failed to create texture');
    }

    // Track texture for cleanup
    const textureId = `texture-${Date.now()}-${Math.random()}`;
    this.textures.set(textureId, texture);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Determine texture format and type
    const { internalFormat, textureFormat, type } = this.getTextureFormatInfo(format);
    
    // Allocate texture storage
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      width,
      height,
      0,
      textureFormat,
      type,
      null
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  /**
   * Get texture format information based on format constant
   */
  private getTextureFormatInfo(format: number): {
    internalFormat: number;
    textureFormat: number;
    type: number;
  } {
    const gl = this.gl;
    
    // Always use safe RGBA format for better compatibility
    // Float formats can cause framebuffer incomplete errors on some devices
    return {
      internalFormat: gl.RGBA,
      textureFormat: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
    };
  }

  /**
   * Get the texture attached to a framebuffer
   */
  private getFramebufferTexture(framebuffer: WebGLFramebuffer): WebGLTexture | null {
    const gl = this.gl;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    const texture = gl.getFramebufferAttachmentParameter(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME
    ) as WebGLTexture;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    return texture;
  }

  /**
   * Resize all managed framebuffers
   */
  public resize(width: number, height: number): void {
    // Store current dimensions to avoid unnecessary recreation
    if (this.currentWidth === width && this.currentHeight === height) {
      return;
    }
    
    this.currentWidth = width;
    this.currentHeight = height;
    
    // Clear cached framebuffers - they will be recreated with new dimensions as needed
    // Don't call cleanup() here as it would delete textures that are still in use
    this.framebuffers.clear();
    this.framebufferPairs.clear();
  }

  /**
   * Clean up all framebuffer resources
   */
  public cleanup(): void {
    const gl = this.gl;

    // Delete all framebuffers
    for (const framebuffer of this.framebuffers.values()) {
      gl.deleteFramebuffer(framebuffer);
    }
    this.framebuffers.clear();

    // Delete all textures
    for (const texture of this.textures.values()) {
      gl.deleteTexture(texture);
    }
    this.textures.clear();

    // Clear framebuffer pairs
    this.framebufferPairs.clear();
  }

  /**
   * Get framebuffer status string for debugging
   */
  private getFramebufferStatusString(status: number): string {
    const gl = this.gl;
    
    switch (status) {
      case gl.FRAMEBUFFER_COMPLETE:
        return 'FRAMEBUFFER_COMPLETE';
      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
      case gl.FRAMEBUFFER_UNSUPPORTED:
        return 'FRAMEBUFFER_UNSUPPORTED';
      case 36054: // GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE
        return 'FRAMEBUFFER_INCOMPLETE_MULTISAMPLE';
      case 36055: // GL_FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS
        return 'FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS';
      default:
        return `UNKNOWN_STATUS_${status}_0x${status.toString(16)}`;
    }
  }

  /**
   * Check if a framebuffer is complete
   */
  public isFramebufferComplete(framebuffer: WebGLFramebuffer): boolean {
    const gl = this.gl;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    return status === gl.FRAMEBUFFER_COMPLETE;
  }

  /**
   * Bind a framebuffer for rendering
   */
  public bindFramebuffer(framebuffer: WebGLFramebuffer | null): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
  }

  /**
   * Create a cached framebuffer with ID
   */
  public createCachedFramebuffer(
    id: string,
    width: number,
    height: number,
    format: number
  ): WebGLFramebuffer {
    // Return cached framebuffer if it exists
    if (this.framebuffers.has(id)) {
      return this.framebuffers.get(id)!;
    }

    const framebuffer = this.createFramebuffer(width, height, format);
    this.framebuffers.set(id, framebuffer);
    
    return framebuffer;
  }

  /**
   * Create a cached framebuffer pair with ID
   */
  public createCachedFramebufferPair(
    id: string,
    width: number,
    height: number,
    format: number
  ): FramebufferPair {
    // Return cached pair if it exists
    if (this.framebufferPairs.has(id)) {
      return this.framebufferPairs.get(id)!;
    }

    const pair = this.createFramebufferPair(width, height, format);
    this.framebufferPairs.set(id, pair);
    
    return pair;
  }
}
import { ShaderManager, ShaderProgram, ShaderCompilationError } from '../types';

export class ShaderManagerImpl implements ShaderManager {
  private gl: WebGL2RenderingContext;
  private programs: Map<string, ShaderProgram> = new Map();
  private shaders: Map<string, WebGLShader> = new Map();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * Compile a shader from source code
   */
  public compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    
    // Create shader cache key
    const cacheKey = `${type}-${this.hashString(source)}`;
    
    // Return cached shader if available
    if (this.shaders.has(cacheKey)) {
      return this.shaders.get(cacheKey)!;
    }

    const shader = gl.createShader(type);
    if (!shader) {
      throw new ShaderCompilationError('Failed to create shader');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Check compilation status
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new ShaderCompilationError(
        `Shader compilation failed: ${error}`,
        source
      );
    }

    // Cache the compiled shader
    this.shaders.set(cacheKey, shader);
    return shader;
  }

  /**
   * Create and link a shader program
   */
  public createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const gl = this.gl;

    const program = gl.createProgram();
    if (!program) {
      throw new ShaderCompilationError('Failed to create shader program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Check linking status
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new ShaderCompilationError(`Program linking failed: ${error}`);
    }

    return program;
  }

  /**
   * Get uniform locations for a program with caching
   */
  public getUniforms(program: WebGLProgram): Record<string, WebGLUniformLocation> {
    const gl = this.gl;
    const uniforms: Record<string, WebGLUniformLocation> = {};

    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    
    for (let i = 0; i < uniformCount; i++) {
      const uniformInfo = gl.getActiveUniform(program, i);
      if (uniformInfo) {
        const location = gl.getUniformLocation(program, uniformInfo.name);
        if (location) {
          uniforms[uniformInfo.name] = location;
        }
      }
    }

    return uniforms;
  }

  /**
   * Create a complete shader program with uniform caching
   */
  public createShaderProgram(
    vertexSource: string,
    fragmentSource: string,
    programId?: string
  ): ShaderProgram {
    // Use provided ID or generate one from sources
    const id = programId || this.hashString(vertexSource + fragmentSource);
    
    // Return cached program if available
    if (this.programs.has(id)) {
      return this.programs.get(id)!;
    }

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    
    const program = this.createProgram(vertexShader, fragmentShader);
    const uniforms = this.getUniforms(program);
    const attributes = this.getAttributes(program);

    const shaderProgram: ShaderProgram = {
      program,
      uniforms,
      attributes,
    };

    // Cache the program
    this.programs.set(id, shaderProgram);
    return shaderProgram;
  }

  /**
   * Get attribute locations for a program
   */
  private getAttributes(program: WebGLProgram): Record<string, number> {
    const gl = this.gl;
    const attributes: Record<string, number> = {};

    const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    
    for (let i = 0; i < attributeCount; i++) {
      const attributeInfo = gl.getActiveAttrib(program, i);
      if (attributeInfo) {
        const location = gl.getAttribLocation(program, attributeInfo.name);
        if (location >= 0) {
          attributes[attributeInfo.name] = location;
        }
      }
    }

    return attributes;
  }

  /**
   * Simple string hash function for caching
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Validate shader program
   */
  public validateProgram(program: WebGLProgram): boolean {
    const gl = this.gl;
    
    gl.validateProgram(program);
    return gl.getProgramParameter(program, gl.VALIDATE_STATUS);
  }

  /**
   * Use a shader program
   */
  public useProgram(program: WebGLProgram): void {
    this.gl.useProgram(program);
  }

  /**
   * Clean up all shader resources
   */
  public cleanup(): void {
    const gl = this.gl;

    // Delete all cached programs
    for (const shaderProgram of this.programs.values()) {
      gl.deleteProgram(shaderProgram.program);
    }
    this.programs.clear();

    // Delete all cached shaders
    for (const shader of this.shaders.values()) {
      gl.deleteShader(shader);
    }
    this.shaders.clear();
  }

  /**
   * Get cached program by ID
   */
  public getCachedProgram(id: string): ShaderProgram | undefined {
    return this.programs.get(id);
  }

  /**
   * Clear specific program from cache
   */
  public clearProgram(id: string): void {
    const program = this.programs.get(id);
    if (program) {
      this.gl.deleteProgram(program.program);
      this.programs.delete(id);
    }
  }
}
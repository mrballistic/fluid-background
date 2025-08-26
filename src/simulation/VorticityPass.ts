/**
 * VorticityPass - Implements vorticity confinement force calculation
 * Applies velocity updates with vorticity forces and configurable curl strength
 */

import { RenderPass, RenderPassInputs } from '../types';
import { vorticityShaderSource } from '../shaders/fragments/vorticity';
import { vertexShaderSource } from '../shaders/vertex';

export class VorticityPass implements RenderPass {
  private program: WebGLProgram | null = null;
  private uniforms: Record<string, WebGLUniformLocation> = {};
  private vertexBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private curlStrength: number = 30.0;

  constructor(
    private gl: WebGL2RenderingContext,
    private shaderManager: { createShaderProgram: (vs: string, fs: string) => { program: WebGLProgram } },
    curlStrength: number = 30.0
  ) {
    this.curlStrength = curlStrength;
    this.initialize();
  }

  private initialize(): void {
    // Create shader program
    const shaderProgram = this.shaderManager.createShaderProgram(vertexShaderSource, vorticityShaderSource);
    this.program = shaderProgram.program;
    
    // Get uniform locations
    this.uniforms = {
      u_velocity: this.gl.getUniformLocation(this.program, 'u_velocity')!,
      u_curl: this.gl.getUniformLocation(this.program, 'u_curl')!,
      u_texelSize: this.gl.getUniformLocation(this.program, 'u_texelSize')!,
      u_curlStrength: this.gl.getUniformLocation(this.program, 'u_curlStrength')!,
      u_dt: this.gl.getUniformLocation(this.program, 'u_dt')!,
    };

    // Create vertex buffer for full-screen quad
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    
    // Full-screen quad vertices
    const vertices = new Float32Array([
      -1, -1,  // Bottom left
       1, -1,  // Bottom right
      -1,  1,  // Top left
       1,  1   // Top right
    ]);
    
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    // Create VAO
    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);
    
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindVertexArray(null);
  }

  /**
   * Set the curl strength parameter for vorticity confinement
   */
  setCurlStrength(strength: number): void {
    this.curlStrength = Math.max(0, Math.min(strength, 100)); // Clamp between 0 and 100
  }

  execute(gl: WebGL2RenderingContext, inputs: RenderPassInputs): void {
    if (!this.program || !this.vao) {
      throw new Error('VorticityPass not properly initialized');
    }

    if (!inputs.curl) {
      throw new Error('VorticityPass requires curl texture');
    }

    // Use the vorticity shader program
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Set uniforms
    gl.uniform1i(this.uniforms.u_velocity, 0);
    gl.uniform1i(this.uniforms.u_curl, 1);
    
    // Calculate texel size based on canvas dimensions
    const canvas = gl.canvas as HTMLCanvasElement;
    gl.uniform2f(this.uniforms.u_texelSize, 1.0 / canvas.width, 1.0 / canvas.height);
    
    // Set curl strength and time step
    gl.uniform1f(this.uniforms.u_curlStrength, this.curlStrength);
    gl.uniform1f(this.uniforms.u_dt, inputs.deltaTime);

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputs.velocity);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, inputs.curl);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Cleanup
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  cleanup(): void {
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = null;
    }
    
    if (this.vao) {
      this.gl.deleteVertexArray(this.vao);
      this.vao = null;
    }
  }
}
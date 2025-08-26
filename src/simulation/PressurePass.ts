/**
 * PressurePass - Implements iterative pressure solving using Jacobi iteration
 * Handles configurable iteration count for pressure field computation
 */

import { RenderPass, RenderPassInputs } from '../types';
import { pressureShaderSource } from '../shaders/fragments/pressure';
import { vertexShaderSource } from '../shaders/vertex';

export class PressurePass implements RenderPass {
  private program: WebGLProgram | null = null;
  private uniforms: Record<string, WebGLUniformLocation> = {};
  private vertexBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private iterations: number = 20;

  constructor(
    private gl: WebGL2RenderingContext,
    private shaderManager: { createShaderProgram: (vs: string, fs: string) => { program: WebGLProgram } },
    iterations: number = 20
  ) {
    this.iterations = iterations;
    this.initialize();
  }

  private initialize(): void {
    // Create shader program
    const shaderProgram = this.shaderManager.createShaderProgram(vertexShaderSource, pressureShaderSource);
    this.program = shaderProgram.program;
    
    // Get uniform locations
    this.uniforms = {
      u_pressure: this.gl.getUniformLocation(this.program, 'u_pressure')!,
      u_divergence: this.gl.getUniformLocation(this.program, 'u_divergence')!,
      u_texelSize: this.gl.getUniformLocation(this.program, 'u_texelSize')!,
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
   * Set the number of Jacobi iterations for pressure solving
   */
  setIterations(iterations: number): void {
    this.iterations = Math.max(1, Math.min(iterations, 100)); // Clamp between 1 and 100
  }

  /**
   * Execute pressure solving with Jacobi iteration
   * Note: This method expects the caller to handle framebuffer ping-ponging
   * for multiple iterations
   */
  execute(gl: WebGL2RenderingContext, inputs: RenderPassInputs): void {
    if (!this.program || !this.vao) {
      throw new Error('PressurePass not properly initialized');
    }

    if (!inputs.pressure || !inputs.divergence) {
      throw new Error('PressurePass requires pressure and divergence textures');
    }

    // Use the pressure shader program
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Set uniforms
    gl.uniform1i(this.uniforms.u_pressure, 0);
    gl.uniform1i(this.uniforms.u_divergence, 1);
    
    // Calculate texel size based on canvas dimensions
    const canvas = gl.canvas as HTMLCanvasElement;
    gl.uniform2f(this.uniforms.u_texelSize, 1.0 / canvas.width, 1.0 / canvas.height);

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputs.pressure);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, inputs.divergence);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Cleanup
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  /**
   * Execute multiple Jacobi iterations for pressure solving
   * This is a convenience method that handles the iteration loop
   */
  executeIterations(
    gl: WebGL2RenderingContext, 
    inputs: RenderPassInputs,
    pressureFramebuffers: { read: WebGLFramebuffer; write: WebGLFramebuffer; swap: () => void }
  ): void {
    for (let i = 0; i < this.iterations; i++) {
      // Bind write framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressureFramebuffers.write);
      
      // Execute single iteration
      this.execute(gl, inputs);
      
      // Swap framebuffers for next iteration
      pressureFramebuffers.swap();
      
  // Update pressure texture input for next iteration
  inputs.pressure = pressureFramebuffers.read as unknown as WebGLTexture; // Type assertion for texture
    }
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
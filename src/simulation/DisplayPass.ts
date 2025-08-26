/**
 * DisplayPass - Renders fluid simulation results to the screen
 * Handles color correction, brightness, and final display output
 */

import { RenderPass, RenderPassInputs } from '../types';
import { displayShaderSource } from '../shaders/fragments/display';
import { vertexShaderSource } from '../shaders/vertex';

export class DisplayPass implements RenderPass {
  private program: WebGLProgram | null = null;
  private uniforms: Record<string, WebGLUniformLocation> = {};
  private vertexBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;

  constructor(
    private gl: WebGL2RenderingContext,
    private shaderManager: { createShaderProgram: (vs: string, fs: string) => { program: WebGLProgram } }
  ) {
    this.initialize();
  }

  private initialize(): void {
    // Create shader program
    const shaderProgram = this.shaderManager.createShaderProgram(vertexShaderSource, displayShaderSource);
    this.program = shaderProgram.program;
    
    // Get uniform locations
    this.uniforms = {
      u_texture: this.gl.getUniformLocation(this.program, 'u_texture')!,
      u_brightness: this.gl.getUniformLocation(this.program, 'u_brightness')!,
      u_contrast: this.gl.getUniformLocation(this.program, 'u_contrast')!,
    };

    // Create vertex buffer for full-screen quad
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    
    // Full-screen quad vertices (position only - UV calculated in vertex shader)
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
    
    // Position attribute
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.bindVertexArray(null);
  }

  /**
   * Execute display pass - render fluid simulation to screen
   */
  execute(gl: WebGL2RenderingContext, inputs: RenderPassInputs): void {
    if (!this.program || !this.vao) {
      throw new Error('DisplayPass not properly initialized');
    }

    // Use density texture as the main display texture
    const displayTexture = inputs.density || inputs.velocity;
    if (!displayTexture) {
      console.warn('DisplayPass: No texture to display');
      return;
    }

    // Use the display shader program
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Set uniforms
    gl.uniform1i(this.uniforms.u_texture, 0);
    
    // Display settings - can be made configurable later
    gl.uniform1f(this.uniforms.u_brightness, 0.0);
    gl.uniform1f(this.uniforms.u_contrast, 1.2);

    // Bind display texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, displayTexture);

    // Set up blending for proper display
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Cleanup
    gl.bindVertexArray(null);
    gl.useProgram(null);
    gl.disable(gl.BLEND);
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
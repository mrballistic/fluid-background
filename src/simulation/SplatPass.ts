/**
 * SplatPass - Handles mouse/touch splat rendering for fluid simulation
 * Implements velocity and dye injection with configurable splat radius and force
 */

import { RenderPass, RenderPassInputs } from '../types';
import { splatShaderSource } from '../shaders/fragments/splat';
import { vertexShaderSource } from '../shaders/vertex';

export class SplatPass implements RenderPass {
  private program: WebGLProgram | null = null;
  private uniforms: Record<string, WebGLUniformLocation> = {};
  private vertexBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private splatRadius: number = 0.25;
  private splatForce: number = 6000.0;

  constructor(
    private gl: WebGL2RenderingContext,
    private shaderManager: { createShaderProgram: (vs: string, fs: string) => { program: WebGLProgram } },
    splatRadius: number = 0.25,
    splatForce: number = 6000.0
  ) {
    this.splatRadius = splatRadius;
    this.splatForce = splatForce;
    this.initialize();
  }

  private initialize(): void {
    // Create shader program
    const shaderProgram = this.shaderManager.createShaderProgram(vertexShaderSource, splatShaderSource);
    this.program = shaderProgram.program;
    
    // Get uniform locations
    this.uniforms = {
      u_target: this.gl.getUniformLocation(this.program, 'u_target')!,
      u_aspectRatio: this.gl.getUniformLocation(this.program, 'u_aspectRatio')!,
      u_color: this.gl.getUniformLocation(this.program, 'u_color')!,
      u_point: this.gl.getUniformLocation(this.program, 'u_point')!,
      u_radius: this.gl.getUniformLocation(this.program, 'u_radius')!,
      u_strength: this.gl.getUniformLocation(this.program, 'u_strength')!,
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
   * Set splat parameters
   */
  setSplatParameters(radius: number, force: number): void {
    this.splatRadius = Math.max(0.01, Math.min(radius, 1.0)); // Clamp between 0.01 and 1.0
    this.splatForce = Math.max(0, Math.min(force, 10000.0)); // Clamp between 0 and 10000
  }

  /**
   * Execute splat rendering for velocity field
   */
  executeVelocitySplat(
    gl: WebGL2RenderingContext, 
    inputs: RenderPassInputs,
    targetTexture: WebGLTexture,
    mouseX: number,
    mouseY: number,
    deltaX: number,
    deltaY: number
  ): void {
    if (!this.program || !this.vao) {
      throw new Error('SplatPass not properly initialized');
    }

    // Use the splat shader program
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Set uniforms
    gl.uniform1i(this.uniforms.u_target, 0);
    
    // Calculate aspect ratio
    const canvas = gl.canvas as HTMLCanvasElement;
    const aspectRatio = canvas.width / canvas.height;
    gl.uniform1f(this.uniforms.u_aspectRatio, aspectRatio);
    
    // Set splat parameters
    gl.uniform3f(this.uniforms.u_color, deltaX, deltaY, 0.0); // Velocity as color
    gl.uniform2f(this.uniforms.u_point, mouseX, mouseY);
    gl.uniform1f(this.uniforms.u_radius, this.splatRadius);
    gl.uniform1f(this.uniforms.u_strength, this.splatForce);

    // Bind target texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Cleanup
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  /**
   * Execute splat rendering for dye field
   */
  executeDyeSplat(
    gl: WebGL2RenderingContext,
    inputs: RenderPassInputs,
    targetTexture: WebGLTexture,
    mouseX: number,
    mouseY: number,
    colorR: number,
    colorG: number,
    colorB: number
  ): void {
    if (!this.program || !this.vao) {
      throw new Error('SplatPass not properly initialized');
    }

    // Use the splat shader program
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Set uniforms
    gl.uniform1i(this.uniforms.u_target, 0);
    
    // Calculate aspect ratio
    const canvas = gl.canvas as HTMLCanvasElement;
    const aspectRatio = canvas.width / canvas.height;
    gl.uniform1f(this.uniforms.u_aspectRatio, aspectRatio);
    
    // Set splat parameters
    gl.uniform3f(this.uniforms.u_color, colorR, colorG, colorB);
    gl.uniform2f(this.uniforms.u_point, mouseX, mouseY);
    gl.uniform1f(this.uniforms.u_radius, this.splatRadius);
    gl.uniform1f(this.uniforms.u_strength, 1.0); // Full strength for dye

    // Bind target texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Cleanup
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  /**
   * Generic execute method for RenderPass interface
   */
  execute(gl: WebGL2RenderingContext, inputs: RenderPassInputs): void {
    if (!inputs.mouse) {
      return; // No mouse input, nothing to splat
    }

    const { x, y, dx, dy, down } = inputs.mouse;
    
    if (!down) {
      return; // Mouse not pressed, no splat
    }

    // Execute velocity splat (this is a simplified version)
    // In practice, this would need access to the target texture
    // The specific implementation depends on how the simulation orchestrator calls this
    this.executeVelocitySplat(gl, inputs, inputs.velocity, x, y, dx, dy);
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
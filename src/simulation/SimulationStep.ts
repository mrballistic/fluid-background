/**
 * SimulationStep - Orchestrates the complete fluid simulation step
 * Coordinates all render passes in the correct order and manages timing
 */

import { SimulationStep as ISimulationStep, FluidSimulationConfig, RenderPassInputs } from '../types';
import { AdvectionPass } from './AdvectionPass';
import { DivergencePass } from './DivergencePass';
import { PressurePass } from './PressurePass';
import { CurlPass } from './CurlPass';
import { VorticityPass } from './VorticityPass';
import { SplatPass } from './SplatPass';
import { DisplayPass } from './DisplayPass';
import { FramebufferManagerImpl } from './FramebufferManager';
import { ShaderManagerImpl } from './ShaderManager';

export class SimulationStepImpl implements ISimulationStep {
  private advectionPass!: AdvectionPass;
  private divergencePass!: DivergencePass;
  private pressurePass!: PressurePass;
  private curlPass!: CurlPass;
  private vorticityPass!: VorticityPass;
  private splatPass!: SplatPass;
  private displayPass!: DisplayPass;

  private velocityFBO!: { read: WebGLFramebuffer; write: WebGLFramebuffer; texture: WebGLTexture; swap(): void };
  private densityFBO!: { read: WebGLFramebuffer; write: WebGLFramebuffer; texture: WebGLTexture; swap(): void };
  private pressureFBO!: { read: WebGLFramebuffer; write: WebGLFramebuffer; texture: WebGLTexture; swap(): void };
  private divergenceFBO!: WebGLFramebuffer;
  private curlFBO!: WebGLFramebuffer;

  private divergenceTexture!: WebGLTexture;
  private curlTexture!: WebGLTexture;

  private lastTime: number = 0;
  private frameCount: number = 0;
  private targetFrameTime: number;

  private inputState = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    down: false
  };

  constructor(
    private gl: WebGL2RenderingContext,
    private config: FluidSimulationConfig,
    private framebufferManager: FramebufferManagerImpl,
    private shaderManager: ShaderManagerImpl
  ) {
    this.targetFrameTime = 1000 / this.config.performance.frameRate;
    this.initialize();
  }

  private initialize(): void {
    // Get actual canvas dimensions
    const canvas = this.gl.canvas as HTMLCanvasElement;
    const width = canvas.width || 800;
    const height = canvas.height || 600;

    // Use safe RGBA format for better compatibility
    const format = this.gl.RGBA;

    try {
      // Create framebuffer pairs for ping-pong rendering
      this.velocityFBO = this.framebufferManager.createFramebufferPair(width, height, format);
      this.densityFBO = this.framebufferManager.createFramebufferPair(width, height, format);
      this.pressureFBO = this.framebufferManager.createFramebufferPair(width, height, format);

      // Create single framebuffers for intermediate results
      this.divergenceFBO = this.framebufferManager.createFramebuffer(width, height, format);
      this.curlFBO = this.framebufferManager.createFramebuffer(width, height, format);

      // Create textures for intermediate results
      this.divergenceTexture = this.gl.createTexture()!;
      this.curlTexture = this.gl.createTexture()!;

      this.setupTextures(width, height, format);

      // Initialize render passes
      this.advectionPass = new AdvectionPass(this.gl, this.shaderManager);
      this.divergencePass = new DivergencePass(this.gl, this.shaderManager);
      this.pressurePass = new PressurePass(this.gl, this.shaderManager);
      this.curlPass = new CurlPass(this.gl, this.shaderManager);
      this.vorticityPass = new VorticityPass(this.gl, this.shaderManager);
      this.splatPass = new SplatPass(this.gl, this.shaderManager);
      this.displayPass = new DisplayPass(this.gl, this.shaderManager);

      console.log('SimulationStep initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SimulationStep:', error);
      throw error;
    }
  }

  private setupTextures(width: number, height: number, format: number): void {
    // Use consistent texture format and type
    const textureFormat = this.gl.RGBA;
    const textureType = this.gl.UNSIGNED_BYTE;

    // Setup divergence texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.divergenceTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, textureFormat, textureType, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

    // Setup curl texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.curlTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, textureFormat, textureType, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  execute(deltaTime: number): void {
    // Check if all required resources are initialized
    if (!this.velocityFBO || !this.densityFBO || !this.pressureFBO ||
      !this.divergenceTexture || !this.curlTexture) {
      console.warn('SimulationStep not fully initialized, skipping frame');
      return;
    }

    const currentTime = performance.now();

    // Frame rate limiting (skip if not enough time has passed)
    if (this.lastTime > 0 && currentTime - this.lastTime < this.targetFrameTime) {
      return;
    }

    const actualDeltaTime = Math.min(deltaTime, 0.016); // Cap at 60fps equivalent
    this.lastTime = currentTime;
    this.frameCount++;

    try {
      // Apply input splats if there's input
      if (this.inputState.down || (this.inputState.dx !== 0 || this.inputState.dy !== 0)) {
        this.applySplat(actualDeltaTime);
      }

      // Execute simulation steps in order
      this.executeAdvection(actualDeltaTime);
      this.executeVorticity(actualDeltaTime);
      this.executeDivergence(actualDeltaTime);
      this.executePressure(actualDeltaTime);
      this.executeProjection(actualDeltaTime);
      this.executeDisplay(actualDeltaTime);
    } catch (error) {
      console.error('Error in simulation step:', error);
      throw error;
    }
  }

  private applySplat(deltaTime: number): void {
    const inputs: RenderPassInputs = {
      velocity: this.velocityFBO.texture,
      density: this.densityFBO.texture,
      deltaTime,
      mouse: { ...this.inputState }
    };

    // Apply splat to velocity
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.velocityFBO.write);
    this.splatPass.execute(this.gl, inputs);
    this.velocityFBO.swap();

    // Apply splat to density
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.densityFBO.write);
    this.splatPass.execute(this.gl, inputs);
    this.densityFBO.swap();
  }

  private executeAdvection(deltaTime: number): void {
    const inputs: RenderPassInputs = {
      velocity: this.velocityFBO.texture,
      density: this.densityFBO.texture,
      deltaTime
    };

    // Advect velocity
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.velocityFBO.write);
    this.advectionPass.execute(this.gl, inputs);
    this.velocityFBO.swap();

    // Advect density
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.densityFBO.write);
    this.advectionPass.execute(this.gl, inputs);
    this.densityFBO.swap();
  }

  private executeVorticity(deltaTime: number): void {
    // Calculate curl
    const curlInputs: RenderPassInputs = {
      velocity: this.velocityFBO.texture,
      density: this.densityFBO.texture,
      deltaTime
    };

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.curlFBO);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.curlTexture, 0);
    this.curlPass.execute(this.gl, curlInputs);

    // Apply vorticity confinement
    const vorticityInputs: RenderPassInputs = {
      velocity: this.velocityFBO.texture,
      density: this.densityFBO.texture,
      curl: this.curlTexture,
      deltaTime
    };

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.velocityFBO.write);
    this.vorticityPass.execute(this.gl, vorticityInputs);
    this.velocityFBO.swap();
  }

  private executeDivergence(deltaTime: number): void {
    const inputs: RenderPassInputs = {
      velocity: this.velocityFBO.texture,
      density: this.densityFBO.texture,
      deltaTime
    };

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.divergenceFBO);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.divergenceTexture, 0);
    this.divergencePass.execute(this.gl, inputs);
  }

  private executePressure(deltaTime: number): void {
    // Ensure we have valid textures before proceeding
    if (!this.divergenceTexture || !this.pressureFBO.texture) {
      console.warn('Missing required textures for pressure pass');
      return;
    }

    const inputs: RenderPassInputs = {
      velocity: this.velocityFBO.texture,
      density: this.densityFBO.texture,
      pressure: this.pressureFBO.texture,
      divergence: this.divergenceTexture,
      deltaTime
    };

    // Iterative pressure solving
    for (let i = 0; i < this.config.physics.iterations; i++) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.pressureFBO.write);

      // Update pressure texture for current iteration
      const currentInputs = { ...inputs, pressure: this.pressureFBO.texture };

      this.pressurePass.execute(this.gl, currentInputs);
      this.pressureFBO.swap();

      // Update inputs for next iteration
      inputs.pressure = this.pressureFBO.texture;
    }
  }

  private executeProjection(deltaTime: number): void {
    // Subtract pressure gradient from velocity (projection step)
    // This would typically use a gradient subtraction pass
    // For now, we'll use the pressure pass as a placeholder
    const inputs: RenderPassInputs = {
      velocity: this.velocityFBO.texture,
      density: this.densityFBO.texture,
      pressure: this.pressureFBO.texture,
      deltaTime
    };

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.velocityFBO.write);
    // Note: This should be a gradient subtraction pass, but using pressure pass for now
    this.pressurePass.execute(this.gl, inputs);
    this.velocityFBO.swap();
  }

  private executeDisplay(deltaTime: number): void {
    // Render the fluid simulation to the screen
    const inputs: RenderPassInputs = {
      velocity: this.velocityFBO.texture,
      density: this.densityFBO.texture,
      pressure: this.pressureFBO.texture,
      deltaTime
    };

    // Render to the main canvas (null framebuffer)
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    this.displayPass.execute(this.gl, inputs);
  }

  handleInput(x: number, y: number, dx: number, dy: number, down: boolean): void {
    this.inputState = { x, y, dx, dy, down };
  }

  resize(width: number, height: number): void {
    // Store dimensions for internal use (config doesn't have canvas property)

    // Resize all framebuffers
    this.framebufferManager.resize(width, height);

    // Recreate textures with new dimensions
    const format = this.gl.RGBA;
    this.setupTextures(width, height, format);
  }

  cleanup(): void {
    // Clean up render passes
    this.advectionPass.cleanup();
    this.divergencePass.cleanup();
    this.pressurePass.cleanup();
    this.curlPass.cleanup();
    this.vorticityPass.cleanup();
    this.splatPass.cleanup();
    this.displayPass.cleanup();

    // Clean up textures
    if (this.divergenceTexture) {
      this.gl.deleteTexture(this.divergenceTexture);
    }
    if (this.curlTexture) {
      this.gl.deleteTexture(this.curlTexture);
    }

    // Clean up framebuffers
    if (this.divergenceFBO) {
      this.gl.deleteFramebuffer(this.divergenceFBO);
    }
    if (this.curlFBO) {
      this.gl.deleteFramebuffer(this.curlFBO);
    }
  }
}
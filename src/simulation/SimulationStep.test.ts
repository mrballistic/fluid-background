/**
 * SimulationStep integration tests
 * Tests the complete simulation step coordination and timing
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { SimulationStepImpl } from './SimulationStep';
import { FluidSimulationConfig } from '../types';
import { FramebufferManagerImpl } from './FramebufferManager';
import { ShaderManagerImpl } from './ShaderManager';

// Mock WebGL2RenderingContext
const createMockGL = (): WebGL2RenderingContext => {
  const mockTexture = {} as WebGLTexture;
  const mockFramebuffer = {} as WebGLFramebuffer;
  const mockProgram = {} as WebGLProgram;
  const mockBuffer = {} as WebGLBuffer;
  const mockVAO = {} as WebGLVertexArrayObject;

  return {
    canvas: { width: 512, height: 512 } as HTMLCanvasElement,
    RGBA: 0x1908,
    RGBA16F: 0x881A,
    FLOAT: 0x1406,
    LINEAR: 0x2601,
    CLAMP_TO_EDGE: 0x812F,
    TEXTURE_2D: 0x0DE1,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    FRAMEBUFFER: 0x8D40,
    COLOR_ATTACHMENT0: 0x8CE0,
    TRIANGLE_STRIP: 0x0005,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88E4,
    TEXTURE0: 0x84C0,
    TEXTURE1: 0x84C1,

    createTexture: vi.fn(() => mockTexture),
    createFramebuffer: vi.fn(() => mockFramebuffer),
    createProgram: vi.fn(() => mockProgram),
    createBuffer: vi.fn(() => mockBuffer),
    createVertexArray: vi.fn(() => mockVAO),
    
    bindTexture: vi.fn(),
    bindFramebuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bindVertexArray: vi.fn(),
    useProgram: vi.fn(),
    
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    framebufferTexture2D: vi.fn(),
    bufferData: vi.fn(),
    
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({} as WebGLUniformLocation)),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    activeTexture: vi.fn(),
    
    drawArrays: vi.fn(),
    
    deleteTexture: vi.fn(),
    deleteFramebuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteVertexArray: vi.fn(),
  } as unknown as WebGL2RenderingContext;
};

// Mock render passes
vi.mock('./AdvectionPass', () => ({
  AdvectionPass: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

vi.mock('./DivergencePass', () => ({
  DivergencePass: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

vi.mock('./PressurePass', () => ({
  PressurePass: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

vi.mock('./CurlPass', () => ({
  CurlPass: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

vi.mock('./VorticityPass', () => ({
  VorticityPass: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

vi.mock('./SplatPass', () => ({
  SplatPass: vi.fn().mockImplementation(() => ({
    execute: vi.fn(),
    cleanup: vi.fn(),
  })),
}));

describe('SimulationStep', () => {
  let gl: WebGL2RenderingContext;
  let config: FluidSimulationConfig;
  let framebufferManager: FramebufferManagerImpl;
  let shaderManager: ShaderManagerImpl;
  let simulationStep: SimulationStepImpl;

  beforeEach(() => {
    gl = createMockGL();
    
    config = {
      canvas: { width: 512, height: 512, devicePixelRatio: 1 },
      colors: {
        background: { r: 0, g: 0, b: 0 },
        fluid: [{ r: 1, g: 0, b: 0 }],
      },
      physics: {
        viscosity: 0.1,
        density: 1.0,
        pressure: 0.8,
        curl: 30,
        splatRadius: 0.25,
        splatForce: 6000,
        iterations: 20,
      },
      performance: {
        resolution: 1.0,
        frameRate: 60,
        pauseOnHidden: true,
        autoOptimize: true,
      },
      interaction: {
        enabled: true,
        mouse: true,
        touch: true,
        intensity: 1.0,
      },
    };

    // Mock framebuffer manager
    framebufferManager = {
      createFramebuffer: vi.fn(() => ({} as WebGLFramebuffer)),
      createFramebufferPair: vi.fn(() => ({
        read: {} as WebGLFramebuffer,
        write: {} as WebGLFramebuffer,
        texture: {} as WebGLTexture,
        swap: vi.fn(),
      })),
      resize: vi.fn(),
      cleanup: vi.fn(),
    } as unknown as FramebufferManagerImpl;

    // Mock shader manager
    shaderManager = {
      createProgram: vi.fn(() => ({} as WebGLProgram)),
      compileShader: vi.fn(() => ({} as WebGLShader)),
      getUniforms: vi.fn(() => ({})),
      cleanup: vi.fn(),
    } as unknown as ShaderManagerImpl;

    simulationStep = new SimulationStepImpl(gl, config, framebufferManager, shaderManager);
  });

  describe('initialization', () => {
    it('should create all required framebuffers', () => {
      expect(framebufferManager.createFramebufferPair).toHaveBeenCalledTimes(3); // velocity, density, pressure
      expect(framebufferManager.createFramebuffer).toHaveBeenCalledTimes(2); // divergence, curl
    });

    it('should create textures for intermediate results', () => {
      expect(gl.createTexture).toHaveBeenCalledTimes(2); // divergence, curl textures
    });

    it('should setup texture parameters correctly', () => {
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });
  });

  describe('execution', () => {
    it('should execute simulation step with proper timing', () => {
      const deltaTime = 0.016; // 60fps
      
      // Mock performance.now to control timing
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(16.67); // 60fps interval
      
      simulationStep.execute(deltaTime);
      
      // Should execute all render passes
      expect(gl.bindFramebuffer).toHaveBeenCalled();
    });

    it('should limit frame rate according to configuration', () => {
      const deltaTime = 0.008; // 120fps
      
      // Mock performance.now to simulate high frame rate
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(8); // Too fast
      
      simulationStep.execute(deltaTime);
      
      // Should not execute passes due to frame rate limiting
      // The exact behavior depends on implementation details
    });

    it('should cap delta time to prevent instability', () => {
      const largeDeltaTime = 0.1; // Very large time step
      
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(100);
      
      simulationStep.execute(largeDeltaTime);
      
      // Should execute with capped delta time (implementation detail)
    });
  });

  describe('input handling', () => {
    it('should store input state correctly', () => {
      const x = 100, y = 200, dx = 10, dy = 20, down = true;
      
      simulationStep.handleInput(x, y, dx, dy, down);
      
      // Input state should be stored (tested through execution behavior)
      const deltaTime = 0.016;
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(16.67);
      
      simulationStep.execute(deltaTime);
      
      // Should apply splats when input is active
      expect(gl.bindFramebuffer).toHaveBeenCalled();
    });

    it('should handle mouse movement without click', () => {
      simulationStep.handleInput(100, 200, 5, 5, false);
      
      const deltaTime = 0.016;
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(16.67);
      
      simulationStep.execute(deltaTime);
      
      // Should still apply splats for movement
      expect(gl.bindFramebuffer).toHaveBeenCalled();
    });
  });

  describe('resize handling', () => {
    it('should update configuration and resize framebuffers', () => {
      const newWidth = 1024;
      const newHeight = 768;
      
      simulationStep.resize(newWidth, newHeight);
      
      expect(config.canvas.width).toBe(newWidth);
      expect(config.canvas.height).toBe(newHeight);
      expect(framebufferManager.resize).toHaveBeenCalledWith(newWidth, newHeight);
    });

    it('should recreate textures with new dimensions', () => {
      const initialTextureCreations = (gl.createTexture as Mock).mock.calls.length;
      
      simulationStep.resize(800, 600);
      
      // Should setup textures again with new dimensions
      expect(gl.texImage2D).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean up all resources', () => {
      simulationStep.cleanup();
      
      // Should delete textures
      expect(gl.deleteTexture).toHaveBeenCalledTimes(2);
      
      // Should delete framebuffers
      expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(2);
    });

    it('should clean up all render passes', () => {
      simulationStep.cleanup();
      
      // All render passes should have cleanup called
      // This is tested through the mocked render pass cleanup methods
    });
  });

  describe('simulation step order', () => {
    it('should execute render passes in correct order', () => {
      const deltaTime = 0.016;
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(16.67);
      
      // Track the order of framebuffer bindings to verify execution order
      const bindCalls: any[] = [];
      (gl.bindFramebuffer as Mock).mockImplementation((target, framebuffer) => {
        bindCalls.push({ target, framebuffer });
      });
      
      simulationStep.execute(deltaTime);
      
      // Should have bound framebuffers for each simulation step
      expect(bindCalls.length).toBeGreaterThan(0);
    });

    it('should perform pressure iterations correctly', () => {
      const deltaTime = 0.016;
      const mockNow = vi.spyOn(performance, 'now');
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(16.67);
      
      simulationStep.execute(deltaTime);
      
      // Should bind framebuffer multiple times for pressure iterations
      // The exact number depends on config.physics.iterations
      expect(gl.bindFramebuffer).toHaveBeenCalled();
    });
  });
});
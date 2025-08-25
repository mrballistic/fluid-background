/**
 * Simulation module exports
 * Provides all WebGL simulation components and render passes
 */

// Core simulation classes
export { WebGLContextImpl } from './WebGLContext';
export { ShaderManagerImpl } from './ShaderManager';
export { FramebufferManagerImpl } from './FramebufferManager';

// Render pass classes
export { AdvectionPass } from './AdvectionPass';
export { DivergencePass } from './DivergencePass';
export { PressurePass } from './PressurePass';
export { CurlPass } from './CurlPass';
export { VorticityPass } from './VorticityPass';
export { SplatPass } from './SplatPass';

// Simulation orchestrator
export { SimulationStepImpl } from './SimulationStep';

// Input handling
export { InputHandlerImpl } from './InputHandler';
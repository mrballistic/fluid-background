// Shader exports
export { vertexShaderSource as vertexShader } from './vertex';
export { 
  copyShaderSource as copyShader,
  clearShaderSource as clearShader,
  displayShaderSource as displayShader,
  advectionShaderSource as advectionShader,
  divergenceShaderSource as divergenceShader,
  pressureShaderSource as pressureShader,
  curlShaderSource as curlShader,
  vorticityShaderSource as vorticityShader,
  gradientSubtractShaderSource as gradientSubtractShader,
  splatShaderSource as splatShader
} from './fragments';
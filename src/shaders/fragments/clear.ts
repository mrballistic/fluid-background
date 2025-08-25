/**
 * Clear fragment shader
 * Clears framebuffer with specified color
 */

export const clearShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform vec3 u_color;
uniform float u_alpha;

// Output
out vec4 fragColor;

void main() {
    fragColor = vec4(u_color, u_alpha);
}`;

export default clearShaderSource;
/**
 * Copy fragment shader
 * Simple texture copy operation for framebuffer operations
 */

export const copyShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_texture;

// Output
out vec4 fragColor;

void main() {
    fragColor = texture(u_texture, v_texCoord);
}`;

export default copyShaderSource;
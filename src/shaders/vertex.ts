/**
 * Base vertex shader for fluid simulation
 * Handles texture coordinate calculation for full-screen quad rendering
 */

export const vertexShaderSource = `#version 300 es
precision highp float;

// Input attributes
in vec2 a_position;

// Output to fragment shader
out vec2 v_texCoord;

void main() {
    // Convert from clip space (-1 to 1) to texture coordinates (0 to 1)
    v_texCoord = a_position * 0.5 + 0.5;
    
    // Set vertex position for full-screen quad
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export default vertexShaderSource;
/**
 * Divergence fragment shader
 * Calculates velocity field divergence for pressure projection
 */

export const divergenceShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_velocity;
uniform vec2 u_texelSize;

// Output
out vec4 fragColor;

void main() {
    float L = texture(u_velocity, v_texCoord - vec2(u_texelSize.x, 0.0)).x;
    float R = texture(u_velocity, v_texCoord + vec2(u_texelSize.x, 0.0)).x;
    float T = texture(u_velocity, v_texCoord + vec2(0.0, u_texelSize.y)).y;
    float B = texture(u_velocity, v_texCoord - vec2(0.0, u_texelSize.y)).y;
    
    vec2 C = texture(u_velocity, v_texCoord).xy;
    if (v_texCoord.x - u_texelSize.x < 0.0) { L = -C.x; }
    if (v_texCoord.x + u_texelSize.x > 1.0) { R = -C.x; }
    if (v_texCoord.y - u_texelSize.y < 0.0) { B = -C.y; }
    if (v_texCoord.y + u_texelSize.y > 1.0) { T = -C.y; }
    
    float div = 0.5 * (R - L + T - B);
    fragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

export default divergenceShaderSource;
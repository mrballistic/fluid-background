/**
 * Curl fragment shader
 * Calculates velocity field curl for vorticity computation
 */

export const curlShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_velocity;
uniform vec2 u_texelSize;

// Output
out vec4 fragColor;

void main() {
    float L = texture(u_velocity, v_texCoord - vec2(u_texelSize.x, 0.0)).y;
    float R = texture(u_velocity, v_texCoord + vec2(u_texelSize.x, 0.0)).y;
    float T = texture(u_velocity, v_texCoord + vec2(0.0, u_texelSize.y)).x;
    float B = texture(u_velocity, v_texCoord - vec2(0.0, u_texelSize.y)).x;
    
    float vorticity = R - L - T + B;
    fragColor = vec4(vorticity, 0.0, 0.0, 1.0);
}`;

export default curlShaderSource;
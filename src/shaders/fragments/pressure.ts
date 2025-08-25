/**
 * Pressure fragment shader
 * Implements Jacobi iteration for pressure solving
 */

export const pressureShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
uniform vec2 u_texelSize;

// Output
out vec4 fragColor;

void main() {
    float L = texture(u_pressure, v_texCoord - vec2(u_texelSize.x, 0.0)).x;
    float R = texture(u_pressure, v_texCoord + vec2(u_texelSize.x, 0.0)).x;
    float T = texture(u_pressure, v_texCoord + vec2(0.0, u_texelSize.y)).x;
    float B = texture(u_pressure, v_texCoord - vec2(0.0, u_texelSize.y)).x;
    float C = texture(u_pressure, v_texCoord).x;
    float divergence = texture(u_divergence, v_texCoord).x;
    
    float pressure = (L + R + B + T - divergence) * 0.25;
    fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

export default pressureShaderSource;
/**
 * Gradient subtract fragment shader
 * Subtracts pressure gradient from velocity field for incompressible flow
 */

export const gradientSubtractShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_pressure;
uniform sampler2D u_velocity;
uniform vec2 u_texelSize;

// Output
out vec4 fragColor;

void main() {
    float L = texture(u_pressure, v_texCoord - vec2(u_texelSize.x, 0.0)).x;
    float R = texture(u_pressure, v_texCoord + vec2(u_texelSize.x, 0.0)).x;
    float T = texture(u_pressure, v_texCoord + vec2(0.0, u_texelSize.y)).x;
    float B = texture(u_pressure, v_texCoord - vec2(0.0, u_texelSize.y)).x;
    
    vec2 velocity = texture(u_velocity, v_texCoord).xy;
    velocity.xy -= vec2(R - L, T - B);
    
    fragColor = vec4(velocity, 0.0, 1.0);
}`;

export default gradientSubtractShaderSource;
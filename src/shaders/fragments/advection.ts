/**
 * Advection fragment shader
 * Implements semi-Lagrangian advection for fluid simulation
 */

export const advectionShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_velocity;
uniform sampler2D u_source;
uniform vec2 u_texelSize;
uniform float u_dt;
uniform float u_dissipation;

// Output
out vec4 fragColor;

vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    
    vec4 a = texture(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main() {
    vec2 coord = v_texCoord - u_dt * bilerp(u_velocity, v_texCoord, u_texelSize).xy * u_texelSize;
    fragColor = u_dissipation * bilerp(u_source, coord, u_texelSize);
}`;

export default advectionShaderSource;
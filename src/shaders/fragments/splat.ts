/**
 * Splat fragment shader
 * Adds input forces and dye to the fluid simulation
 */

export const splatShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_target;
uniform float u_aspectRatio;
uniform vec3 u_color;
uniform vec2 u_point;
uniform float u_radius;
uniform float u_strength;

// Output
out vec4 fragColor;

void main() {
    vec2 p = v_texCoord - u_point.xy;
    p.x *= u_aspectRatio;
    vec3 splat = exp(-dot(p, p) / u_radius) * u_color;
    vec3 base = texture(u_target, v_texCoord).xyz;
    fragColor = vec4(base + splat * u_strength, 1.0);
}`;

export default splatShaderSource;
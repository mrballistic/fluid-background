/**
 * Vorticity fragment shader
 * Applies vorticity confinement forces to enhance fluid motion
 */

export const vorticityShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_velocity;
uniform sampler2D u_curl;
uniform vec2 u_texelSize;
uniform float u_curlStrength;
uniform float u_dt;

// Output
out vec4 fragColor;

void main() {
    float L = texture(u_curl, v_texCoord - vec2(u_texelSize.x, 0.0)).x;
    float R = texture(u_curl, v_texCoord + vec2(u_texelSize.x, 0.0)).x;
    float T = texture(u_curl, v_texCoord + vec2(0.0, u_texelSize.y)).x;
    float B = texture(u_curl, v_texCoord - vec2(0.0, u_texelSize.y)).x;
    float C = texture(u_curl, v_texCoord).x;
    
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= u_curlStrength * C;
    force.y *= -1.0;
    
    vec2 velocity = texture(u_velocity, v_texCoord).xy;
    velocity += force * u_dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    
    fragColor = vec4(velocity, 0.0, 1.0);
}`;

export default vorticityShaderSource;
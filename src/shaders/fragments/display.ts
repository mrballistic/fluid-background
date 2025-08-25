/**
 * Display fragment shader
 * Final display shader with color correction and output
 */

export const displayShaderSource = `#version 300 es
precision highp float;

// Input from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_texture;
uniform float u_brightness;
uniform float u_contrast;

// Output
out vec4 fragColor;

void main() {
    vec4 color = texture(u_texture, v_texCoord);
    
    // Apply brightness and contrast
    color.rgb = (color.rgb - 0.5) * u_contrast + 0.5 + u_brightness;
    
    // Clamp to valid range
    color.rgb = clamp(color.rgb, 0.0, 1.0);
    
    fragColor = color;
}`;

export default displayShaderSource;
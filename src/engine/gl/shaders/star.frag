precision highp float;

uniform sampler2D u_source;
uniform vec3 u_coreColor, u_haloColor;
uniform vec2 u_center, u_resolution;
uniform float u_coreRadius, u_haloFalloff, u_scale;

varying vec2 v_uv;

void main() {
  vec3 s = texture2D(u_source, v_uv).rgb;
  float d = length(gl_FragCoord.xy - u_center * u_resolution) / u_scale;
  if (d <= u_coreRadius) {
    gl_FragColor = vec4(u_coreColor, 1);
    return;
  }
  float e = 1.0 - exp(-(d - u_coreRadius) * u_haloFalloff);
  vec3 rgb = mix(u_coreColor, u_haloColor, e);
  rgb = mix(rgb, vec3(0,0,0), e);
  gl_FragColor = vec4(rgb + s, 1);
}
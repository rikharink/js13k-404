#pragma glslify: noise = require('noise2d.glsl')
precision highp float;

uniform sampler2D u_source;
uniform vec3 u_color;
uniform vec2 u_offset;
uniform float u_scale, u_density, u_falloff;
varying vec2 v_uv;

float normalnoise(vec2 p) {
  return snoise(p) * 0.5 + 0.5;
}

float noise(vec2 p) {
  p += u_offset;
  const int steps = 5;
  float scale = pow(2.0, float(steps));
  float displace = 0.0;
  for (int i = 0; i < steps; i++) {
    displace = normalnoise(p * scale + displace);
    scale *= 0.5;
  }
  return normalnoise(p + displace);
}

void main() {
  vec3 s = texture2D(u_source, v_uv).rgb;
  float n = noise(gl_FragCoord.xy * u_scale * 1.0);
  n = pow(n + u_density, u_falloff);
  gl_FragColor = vec4(mix(s, u_color, n), 1);
}
precision highp float;

attribute vec2 a_position, a_uv;

varying vec2 v_uv;

void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_position, 0., 1.);
}
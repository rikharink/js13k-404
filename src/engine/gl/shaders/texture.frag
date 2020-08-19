precision highp float;
uniform sampler2D u_source;
varying vec2 v_uv;

void main() {
    gl_FragColor = texture2D(u_source, v_uv);
}
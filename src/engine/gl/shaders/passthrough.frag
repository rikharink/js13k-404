#version 300 es
precision lowp float;
in vec2 v_p;
uniform sampler2D u_tex;
out vec4 o;
void main(){
    o=texture(u_tex,v_p);
}
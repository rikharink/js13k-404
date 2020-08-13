#version 300 es
precision highp float;

in vec2 v_texcoord;

uniform sampler2D u_texture;
uniform vec4 u_color;

out vec4 outColor;

void main(){
  if(v_texcoord.x<0.||v_texcoord.y<0.||v_texcoord.x>1.||v_texcoord.y>1.){
    discard;
  }
  outColor=texture(u_texture,v_texcoord)*u_color;
}
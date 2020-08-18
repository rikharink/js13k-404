precision highp float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
uniform vec4 u_color;

void main(){
  if(v_texcoord.x<0.||v_texcoord.y<0.||v_texcoord.x>1.||v_texcoord.y>1.){
    discard;
  }
  gl_FragColor=texture2D(u_texture,v_texcoord)*u_color;
}
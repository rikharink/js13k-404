precision highp float;
#pragma glslify: noise2d = require(glsl-noise/classic/2d)

uniform sampler2D u_source;
uniform vec3 u_color;
uniform vec2 u_offset;
uniform float u_scale,u_density,u_falloff;
varying vec2 v_uv;

float normalnoise(vec2 p){
  return noise2d(p)*.5+.5;
}

float fbm(vec2 p)
{
  float res = 0.0, fre = 1.0, amp = 1.0, div = 0.0;
  for( int i = 0; i < 5; ++i )
  {
    res += amp * normalnoise( p * fre );
    div += amp;
    amp *= 0.7;
    fre *= 1.7;
  }
  res /= div;
  return res;
}

float noise(vec2 p){
  return fbm(p);
}

void main(){
  vec4 p=texture2D(u_source,v_uv);
  float n=noise(gl_FragCoord.xy*u_scale*1.+u_offset);
  n=pow(n+u_density,u_falloff);
  gl_FragColor=vec4(mix(p.rgb,u_color,n),1.);
}
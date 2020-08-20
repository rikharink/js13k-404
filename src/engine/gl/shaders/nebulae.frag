precision highp float;

uniform sampler2D u_source,u_noise;
uniform vec3 u_color;
uniform vec2 u_offset;
uniform float u_scale,u_density,u_falloff,u_noiseSize;
varying vec2 v_uv;

float smootherstep(float a,float b,float r){
  r=clamp(r,0.,1.);
  r=r*r*r*(r*(6.*r-15.)+10.);
  return mix(a,b,r);
}

float perlin_2d(vec2 p){
  vec2 p0=floor(p);
  vec2 p1=p0+vec2(1,0);
  vec2 p2=p0+vec2(1,1);
  vec2 p3=p0+vec2(0,1);
  vec2 d0=texture2D(u_noise,p0/u_noiseSize).ba;
  vec2 d1=texture2D(u_noise,p1/u_noiseSize).ba;
  vec2 d2=texture2D(u_noise,p2/u_noiseSize).ba;
  vec2 d3=texture2D(u_noise,p3/u_noiseSize).ba;
  d0=2.*d0-1.;
  d1=2.*d1-1.;
  d2=2.*d2-1.;
  d3=2.*d3-1.;
  vec2 p0p=p-p0;
  vec2 p1p=p-p1;
  vec2 p2p=p-p2;
  vec2 p3p=p-p3;
  float dp0=dot(d0,p0p);
  float dp1=dot(d1,p1p);
  float dp2=dot(d2,p2p);
  float dp3=dot(d3,p3p);
  float fx=p.x-p0.x;
  float fy=p.y-p0.y;
  float m01=smootherstep(dp0,dp1,fx);
  float m32=smootherstep(dp3,dp2,fx);
  float m01m32=smootherstep(m01,m32,fy);
  return m01m32;
}

float normalnoise(vec2 p){
  return perlin_2d(p)*.5+.5;
}

float noise(vec2 p){
  p+=u_offset;
  const int steps=5;
  float scale=pow(2.,float(steps));
  float displace=0.;
  for(int i=0;i<steps;i++){
    displace=normalnoise(p*scale+displace);
    scale*=.5;
  }
  return normalnoise(p+displace);
}

void main(){
  vec4 p=texture2D(u_source,v_uv);
  float n=noise(gl_FragCoord.xy*u_scale*1.);
  n=pow(n+u_density,u_falloff);
  gl_FragColor=vec4(mix(p.rgb,u_color,n),1);
}
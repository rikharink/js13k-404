attribute vec2 g;
attribute vec2 a;
attribute vec2 t;
attribute float r;
attribute vec2 s;
attribute vec4 u;
attribute vec4 c;
attribute float z;

uniform mat4 m;

varying vec2 v;
varying vec4 i;

void main(){
    v=u.xy+g*u.zw;
    i=c.abgr;
    vec2 p=(g-a)*s;
    float q=cos(r);
    float w=sin(r);
    p=vec2(p.x*q-p.y*w,p.x*w+p.y*q);
    p+=a+t;
    gl_Position=m*vec4(p,z,1);
}
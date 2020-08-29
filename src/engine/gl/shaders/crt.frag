precision highp float;

vec2 bend(vec2 uv,float bend){
    uv-=.5;
    uv*=2.;
    uv.x*=1.+pow(abs(uv.y)/bend,2.);
    uv.y*=1.+pow(abs(uv.x)/bend,2.);
    
    uv/=2.;
    return uv+.5;
}

float vignette(vec2 uv,float size,float smoothness,float edgeRounding)
{
    uv-=.5;
    uv*=size;
    return smoothstep(0.,smoothness,1.-sqrt(pow(abs(uv.x),edgeRounding)+pow(abs(uv.y),edgeRounding)));
}

float scanline(vec2 uv,float lines,float speed, float time)
{
    return sin(uv.y*lines+time*speed);
}

float random(vec2 uv, float time)
{
    return fract(sin(dot(uv,vec2(15.5151,42.2561)))*12341.14122*sin(time*.03));
}

float noise(vec2 uv, float time)
{
    vec2 i=floor(uv);
    vec2 f=fract(uv);
    
    float a=random(i, time);
    float b=random(i+vec2(1.,0.), time);
    float c=random(i+vec2(0.,1.), time);
    float d=random(i+vec2(1.), time);
    
    vec2 u=smoothstep(0.,1.,f);
    
    return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
}

uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_time;


void main(){
    vec2 crt_uv=bend(gl_FragCoord.xy/u_resolution.xy,4.);
    float s1=scanline(crt_uv,20.,-3., u_time);
    float s2=scanline(crt_uv,9.,-1., u_time);
    float abberAmount=.0009;
    vec4 color;
    color.r=texture2D(u_tex,crt_uv+abberAmount).r;
    color.g=texture2D(u_tex,crt_uv).g;
    color.b=texture2D(u_tex,crt_uv-abberAmount).b;
    color.a=texture2D(u_tex,crt_uv).a;
    vec4 col=mix(color,vec4(s1+s2),.05)*vignette(crt_uv,1.8,.6,8.);
    col=mix(col,vec4(noise(crt_uv*75., u_time)),.01);
    gl_FragColor=col;
}
precision mediump float;
uniform sampler2D x;
uniform float j;
varying vec2 v;
varying vec4 i;

void main()
{
    vec4 c=texture2D(x,v);
    gl_FragColor=c*i;
    if(j>0.0) {
        if(c.a<j)
            discard;
        gl_FragColor.a=1.0;
    };
}
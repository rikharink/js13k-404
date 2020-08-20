precision mediump float;

varying vec2 vertPos;
uniform sampler2D u_texture;

void main()
{
    vec2 texCoord=vec2(vertPos.s,-vertPos.t)*.5+.5;
    vec3 texColor=texture2D(u_texture,texCoord.st).rgb;
    gl_FragColor=vec4(texColor.rgb,1.);
}
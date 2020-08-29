 #version 300 es
layout(location=0)in vec2 p;
layout(location=1)in vec4 c;
out vec4 v_c;
uniform vec2 u_cell;
uniform vec4 u_proj;

void main(){
    vec2 v=vec2(gl_VertexID==1||gl_VertexID==0,gl_VertexID==1||gl_VertexID==2);
    gl_Position=vec4(u_proj.xy+u_proj.zw*u_cell*(v+p),0.0,1.0);
    v_c=c;
}
attribute vec4 a_position;

uniform mat4 u_matrix;
uniform mat4 u_texMatrix;

varying vec2 v_texcoord;

void main(){
    gl_Position=u_matrix*a_position;
    v_texcoord=(u_texMatrix*a_position).xy;
}
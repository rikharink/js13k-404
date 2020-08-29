    #version 300 es
    out vec2 v_p;
    void main() {
      v_p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
      gl_Position=vec4(v_p*2.0-1.0,0.0,1.0);
    }
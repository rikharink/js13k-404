# TODO

## Must Have

- [ ] [sprite rendering]
- [ ] render tilemap over background
- [ ] define simple core gameplay-loop that fits with theme
- [ ] Integrate pixel-sprite in engine so i easily add & render generated sprites over tilemap
- [ ] make sprites moveable
- [ ] make player-sprite moveable via input
- [ ] collision system
- [ ] POC: WFC animated room generation
- [ ] generate tilemap textures
- [ ] basic webaudio sound system

## Should Have

- [x] Sourcemap support (kinda)
- [ ] [wormhole](http://adrianboeing.blogspot.com/2011/01/twist-effect-in-webgl.html)
- [ ] [random planet renderer](https://random-genesis.netlify.app/projects/planetgen1.html)
  - [ ] [sphere shader](https://clockworkchilli.com/blog/2_3d_shaders_in_a_2d_world)

## Could Have

- [ ] destructible tiles/terrain

## Sprite Rendering

Some info/inspo:

- [ ] [batch tile renderer](https://github.com/alacritty/alacritty/blob/master/alacritty/res/text.v.glsl)
- [ ] [passthrough renderer](https://www.saschawillems.de/blog/2016/08/13/vulkan-tutorial-on-rendering-a-fullscreen-quad-without-buffers/)

### Quad Shader

```javascript
let program = gl_program_new(
  gl,
  "#version 300 es\n" +
    "layout(location=0)in vec2 p;" +
    "layout(location=1)in vec4 c;" +
    "out vec4 v_c;" +
    "uniform vec2 u_cell;" +
    "uniform vec4 u_proj;" +
    "void main(){" +
    "vec2 v=vec2(gl_VertexID==1||gl_VertexID==0,gl_VertexID==1||gl_VertexID==2);" +
    "gl_Position=vec4(u_proj.xy+u_proj.zw*u_cell*(v+p),0.0,1.0);" +
    "v_c=c;" +
    "}",
  "#version 300 es\n" +
    "precision lowp float;" +
    "in vec4 v_c;" +
    "out vec4 o;" +
    "void main(){" +
    "o=v_c;" +
    "}"
);

let indices = new Uint16Array([0, 1, 3, 1, 2, 3]);
gl_bind_vertex_attributes(gl, [
  [2, GL.FLOAT, false, 12, 0],
  [4, GL.UNSIGNED_BYTE, false, 12, 8],
]);

// use drawElementsInstanced
```

### Passthrough shader

```javascript
  let program = gl_program_new(
    gl,
    "#version 300 es\n" +
      "out vec2 v_p;" +
      "void main(){" +
      "v_p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);" +
      "gl_Position=vec4(v_p*2.0-1.0,0.0,1.0);" +
      "}",
    "#version 300 es\n" +
      "precision lowp float;" +
      "in vec2 v_p;" +
      "uniform sampler2D u_tex;" +
      "out vec4 o;" +
      "void main(){" +
      "o=texture(u_tex,v_p);" +
      "}",
  );
  drawArrays(gl.TRIANGLE_FAN, 0, 3);
```

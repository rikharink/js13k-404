import { Context, createVAO, Vao, bindVAO } from "./gl/util";
import { orthographic, translate, scale, translation } from "./math/m4";
import { GLConstants } from "./gl/constants";

const dst = new Float32Array(16);

export class GameSprite {
  private gl: Context;
  private width: number;
  private height: number;
  private frames: number;
  private tint: [number, number, number, number];
  private timePerFrame: number;
  private img: TexImageSource;
  private program: WebGLProgram;
  private currentFrame: number;
  private texX: number;
  private texY: number;
  private x: number;
  private y: number;
  private dt: number;

  private tex!: WebGLTexture;
  private positionAttributeLocation!: number;
  private texcoordAttributeLocation!: number;
  private matrixLocation!: WebGLUniformLocation;
  private textureLocation!: WebGLUniformLocation;
  private colorLocation!: WebGLUniformLocation;
  private textureMatrixLocation!: WebGLUniformLocation;
  private vao!: Vao;
  private positionBuffer!: WebGLBuffer;
  private positions!: number[];
  private texcoordBuffer!: WebGLBuffer;
  private texcoords!: number[];
  private texMatrix = new Float32Array(16);

  constructor(
    gl: Context,
    shader: WebGLProgram,
    img: TexImageSource,
    position: [number, number],
    shape: [number, number],
    frames: number,
    tint: [number, number, number, number],
    timePerFrame: number
  ) {
    this.gl = gl;
    this.width = shape[0];
    this.height = shape[1];
    this.frames = frames;
    this.tint = tint;
    this.timePerFrame = timePerFrame;
    this.img = img;
    this.program = shader;
    this.currentFrame = 0;
    this.texX = 0;
    this.texY = 0;
    this.x = position[0];
    this.y = position[1];
    this.dt = 0;
  }

  prepare() {
    this.tex = this.gl.createTexture()!;
    this.gl.bindTexture(GLConstants.TEXTURE_2D, this.tex);
    this.gl.texImage2D(
      GLConstants.TEXTURE_2D,
      0,
      GLConstants.RGBA,
      GLConstants.RGBA,
      GLConstants.UNSIGNED_BYTE,
      this.img
    );
    this.gl.texParameteri(
      GLConstants.TEXTURE_2D,
      GLConstants.TEXTURE_WRAP_S,
      GLConstants.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      GLConstants.TEXTURE_2D,
      GLConstants.TEXTURE_WRAP_T,
      GLConstants.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      GLConstants.TEXTURE_2D,
      GLConstants.TEXTURE_MIN_FILTER,
      GLConstants.LINEAR
    );

    this.positionAttributeLocation = this.gl.getAttribLocation(
      this.program,
      "a_position"
    );
    this.texcoordAttributeLocation = this.gl.getAttribLocation(
      this.program,
      "a_texcoord"
    );
    this.matrixLocation = this.gl.getUniformLocation(this.program, "u_matrix")!;
    this.textureLocation = this.gl.getUniformLocation(
      this.program,
      "u_texture"
    )!;
    this.colorLocation = this.gl.getUniformLocation(this.program, "u_color")!;
    this.textureMatrixLocation = this.gl.getUniformLocation(
      this.program,
      "u_textureMatrix"
    )!;
    this.vao = createVAO(this.gl)!;
    this.positionBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(GLConstants.ARRAY_BUFFER, this.positionBuffer);
    this.positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    this.gl.bufferData(
      GLConstants.ARRAY_BUFFER,
      new Float32Array(this.positions),
      GLConstants.STATIC_DRAW
    );

    this.texcoordBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(GLConstants.ARRAY_BUFFER, this.texcoordBuffer);
    this.texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    this.gl.bufferData(
      GLConstants.ARRAY_BUFFER,
      new Float32Array(this.texcoords),
      GLConstants.STATIC_DRAW
    );
  }

  render(deltaTime: number) {
    // this.animate(deltaTime);
    this.gl.bindBuffer(GLConstants.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.vertexAttribPointer(
      this.positionAttributeLocation,
      2,
      GLConstants.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.texcoordAttributeLocation);
    this.gl.vertexAttribPointer(
      this.texcoordAttributeLocation,
      2,
      GLConstants.FLOAT,
      true,
      0,
      0
    );
    const texWidth = this.width * this.frames;
    const texHeight = this.height;
    this.gl.useProgram(this.program);
    bindVAO(this.gl, this.vao);
    const textureUnit = 0;
    this.gl.uniform1i(this.textureLocation, textureUnit);
    this.gl.activeTexture(GLConstants.TEXTURE0 + textureUnit);
    this.gl.bindTexture(GLConstants.TEXTURE_2D, this.tex);
    let canvas = this.gl.canvas as HTMLCanvasElement;
    let matrix = orthographic(
      0,
      canvas.clientWidth,
      canvas.clientHeight,
      0,
      -1,
      1,
      dst
    );
    translate(matrix, this.x, this.y, 0, matrix);
    scale(matrix, 32, 32, 1, matrix);
    this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);
    translation(this.texX / texWidth, this.texY / texHeight, 0, this.texMatrix);
    scale(
      this.texMatrix,
      this.width / texWidth,
      this.height / texHeight,
      1,
      this.texMatrix
    );
    this.gl.uniformMatrix4fv(this.textureMatrixLocation, false, this.texMatrix);
    this.gl.uniform4f(
      this.colorLocation,
      this.tint[0],
      this.tint[1],
      this.tint[2],
      this.tint[3]
    );
    this.gl.drawArrays(GLConstants.TRIANGLES, 0, 6);
  }

  animate(deltaTime: number) {
    this.dt += deltaTime;
    if (this.dt >= this.timePerFrame) {
      this.dt = 0;
      this.nextFrame();
    }
  }

  nextFrame() {
    this.currentFrame++;
    if (this.currentFrame > this.frames - 1) {
      this.currentFrame = 0;
    }
    this.texX = this.width * this.currentFrame;
  }
}

import {
  Context,
  Vao,
  createVAO as createVAO,
  bindVAO as bindVertexArray,
} from "../util";
import { ShaderStore } from "../shaders/shaders";

interface TextureRendererOpts {}

export class TextureRenderer {
  program: WebGLProgram;
  width: number;
  height: number;
  private _positionbuffer: WebGLBuffer;
  private _vao: Vao;
  private _attributePositionLocation: number;
  private _textureLocation: WebGLUniformLocation;

  constructor(gl: Context, shaders: ShaderStore) {
    this.width = gl.canvas.width;
    this.height = gl.canvas.height;
    this.program = shaders.getShader("fquad")!;
    this._vao = createVAO(gl)!;
    bindVertexArray(gl, this._vao);
    this._positionbuffer = gl.createBuffer()!;
    this._attributePositionLocation = gl.getAttribLocation(
      this.program,
      "inPos"
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionbuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(
      this._attributePositionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(this._attributePositionLocation);
    this._textureLocation = gl.getUniformLocation(this.program, "u_texture")!;
    bindVertexArray(gl, null);
  }

  public render(
    gl: Context,
    texture: WebGLTexture,
    destination: WebGLFramebuffer | null,
    _opts?: TextureRendererOpts
  ) {
    gl.useProgram(this.program);
    bindVertexArray(gl, this._vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const texUnit = 1;
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this._textureLocation, texUnit);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    bindVertexArray(gl, null);
    return destination;
  }
}

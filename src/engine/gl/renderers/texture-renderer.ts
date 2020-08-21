import {
  Context,
  Vao,
  createVAO as createVAO,
  bindVAO as bindVertexArray,
} from "../util";
import { ShaderStore } from "../shaders/shaders";
import { GLConstants } from "../constants";
import { Shaders } from "../../../game";

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
    this.program = shaders.getShader(Shaders.Fquad)!;
    this._vao = createVAO(gl)!;
    bindVertexArray(gl, this._vao);
    this._positionbuffer = gl.createBuffer()!;
    this._attributePositionLocation = gl.getAttribLocation(
      this.program,
      "inPos"
    );
    gl.bindBuffer(GLConstants.ARRAY_BUFFER, this._positionbuffer);
    gl.bufferData(
      GLConstants.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
      GLConstants.STATIC_DRAW
    );
    gl.vertexAttribPointer(
      this._attributePositionLocation,
      2,
      GLConstants.FLOAT,
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
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const texUnit = 1;
    gl.activeTexture(GLConstants.TEXTURE0 + texUnit);
    gl.bindTexture(GLConstants.TEXTURE_2D, texture);
    gl.uniform1i(this._textureLocation, texUnit);

    gl.bindTexture(GLConstants.TEXTURE_2D, texture);
    gl.drawArrays(GLConstants.TRIANGLE_FAN, 0, 4);
    bindVertexArray(gl, null);
    return destination;
  }
}

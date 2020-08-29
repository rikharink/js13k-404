import { ShaderStore, Shaders } from "./../shaders/shaders";
import { Context, createVAO, Vao, bindVAO } from "../util";
import { Framebuffer } from "../framebuffer";
import { GLConstants } from "../constants";

export class AsciiRenderer {
  private _program: WebGLProgram;
  private _positionbuffer: WebGLBuffer;
  private _attributePositionLocation: number;
  private _vao: Vao;
  private _textureLocation: WebGLUniformLocation;
  private _resolutionLocation: WebGLUniformLocation;

  constructor(gl: Context, shaders: ShaderStore) {
    this._program = shaders.getShader(Shaders.Ascii)!;
    this._vao = createVAO(gl)!;
    bindVAO(gl, this._vao);
    this._positionbuffer = gl.createBuffer()!;
    this._attributePositionLocation = gl.getAttribLocation(
      this._program,
      "a_position"
    );
    gl.bindBuffer(GLConstants.ARRAY_BUFFER, this._positionbuffer);
    //prettier-ignore
    gl.bufferData(
      GLConstants.ARRAY_BUFFER,
      new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]),
      GLConstants.STATIC_DRAW
    );
    gl.vertexAttribPointer(
      this._attributePositionLocation,
      3,
      GLConstants.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(this._attributePositionLocation);

    this._textureLocation = gl.getUniformLocation(this._program, "u_tex")!;
    this._resolutionLocation = gl.getUniformLocation(
      this._program,
      "u_resolution"
    )!;
    bindVAO(gl, null);
  }

  public render(gl: Context, source: Framebuffer, destination: Framebuffer) {
    gl.useProgram(this._program);
    bindVAO(gl, this._vao);
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    const texUnit = 1;
    gl.activeTexture(GLConstants.TEXTURE0 + texUnit);
    gl.bindTexture(GLConstants.TEXTURE_2D, source.texture);
    gl.uniform1i(this._textureLocation, texUnit);

    gl.uniform2f(
      this._resolutionLocation,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    );
    gl.drawArrays(GLConstants.TRIANGLES, 0, 6);
    bindVAO(gl, null);
    return destination;
  }
}

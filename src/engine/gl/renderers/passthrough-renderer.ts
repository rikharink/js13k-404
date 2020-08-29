import { Context } from "../util";
import { ShaderStore, Shaders } from "../shaders/shaders";
import { GLConstants } from "../constants";

export class PassthroughRenderer {
  program: WebGLProgram;
  width: number;
  height: number;
  private _textureLocation: WebGLUniformLocation;

  constructor(gl: Context, shaders: ShaderStore) {
    this.width = gl.drawingBufferWidth;
    this.height = gl.drawingBufferHeight;
    this.program = shaders.getShader(Shaders.Passthrough)!;
    this._textureLocation = gl.getUniformLocation(this.program, "u_tex")!;
  }

  public render(
    gl: Context,
    texture: WebGLTexture,
    destination: WebGLFramebuffer | null
  ) {
    gl.useProgram(this.program);
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    const texUnit = 1;
    gl.activeTexture(GLConstants.TEXTURE0 + texUnit);
    gl.uniform1i(this._textureLocation, texUnit);
    gl.bindTexture(GLConstants.TEXTURE_2D, texture);
    gl.drawArrays(GLConstants.TRIANGLES, 0, 3);
    return destination;
  }
}

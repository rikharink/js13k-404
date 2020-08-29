import { Vao, createVAO, bindVAO } from "./../util";
import { ShaderStore, Shaders } from "./../shaders/shaders";
import { Context } from "../util";
interface BatchRendererOpts {}

export class BatchRenderer {
  private _program: WebGLProgram;
  private _vao: Vao;

  constructor(gl: Context, shaders: ShaderStore, opts?: BatchRendererOpts) {
    this._program = shaders.getShader(Shaders.Batch)!;
    gl.useProgram(this._program);
    this._vao = createVAO(gl)!;
    bindVAO(gl, this._vao);
    const indices = new Uint16Array([0, 1, 3, 1, 2, 3]);

    bindVAO(gl, null);
  }
}

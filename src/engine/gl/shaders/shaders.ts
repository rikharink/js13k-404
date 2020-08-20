import { Context, createProgram } from "../util";

export interface Shader {
  vertex: string;
  fragment: string;
}

export class ShaderStore {
  private _shaders: Map<string, WebGLProgram> = new Map<string, WebGLProgram>();

  public addShader(gl: Context, key: string, value: Shader) {
    this._shaders.set(key, createProgram(gl, value.vertex, value.fragment));
  }

  public getShader(key: string): WebGLProgram | undefined {
    return this._shaders.get(key);
  }
}

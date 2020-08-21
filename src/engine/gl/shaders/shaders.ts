import { Context, createProgram } from "../util";

export interface Shader {
  vertex: string;
  fragment: string;
}

export const enum ShaderType {}

export class ShaderStore {
  private _shaders: Map<number, WebGLProgram> = new Map<number, WebGLProgram>();

  public addShader(gl: Context, key: number, value: Shader) {
    this._shaders.set(key, createProgram(gl, value.vertex, value.fragment));
  }

  public getShader(key: number): WebGLProgram | undefined {
    return this._shaders.get(key);
  }
}

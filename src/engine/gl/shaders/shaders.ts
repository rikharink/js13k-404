import textureVert from "./texture.vert";
import tilemapVert from "./tilemap.vert";
import tilemapFrag from "./tilemap.frag";
import nebulaeShader from "./nebulae.frag";
import starShader from "./star.frag";
import passthroughVert from "./passthrough.vert";
import passthroughFrag from "./passthrough.frag";
import batchVert from "./batch.vert";
import batchFrag from "./batch.frag";
import crtVert from "./crt.vert";
import crtFrag from "./crt.frag";
import asciiVert from "./ascii.vert";
import asciiFrag from "./ascii.frag";

import { Context, createProgram } from "../util";

export const enum Shaders {
  Nebulae = 0,
  Star = 1,
  Tilemap = 2,
  Passthrough = 3,
  Sprite = 4,
  Batch = 5,
  Crt = 6,
  Ascii = 7,
}

export interface Shader {
  vertex: string;
  fragment: string;
}

export class ShaderStore {
  private _shaders: Map<number, WebGLProgram> = new Map<number, WebGLProgram>();

  constructor(gl: Context) {
    this._setupShaders(gl);
  }

  public addShader(gl: Context, key: number, value: Shader) {
    this._shaders.set(key, createProgram(gl, value.vertex, value.fragment));
  }

  public getShader(key: number): WebGLProgram | undefined {
    return this._shaders.get(key);
  }

  private _setupShaders(gl: Context) {
    this.addShader(gl, Shaders.Nebulae, {
      vertex: textureVert,
      fragment: nebulaeShader,
    });

    this.addShader(gl, Shaders.Star, {
      vertex: textureVert,
      fragment: starShader,
    });

    this.addShader(gl, Shaders.Tilemap, {
      vertex: tilemapVert,
      fragment: tilemapFrag,
    });

    this.addShader(gl, Shaders.Passthrough, {
      vertex: passthroughVert,
      fragment: passthroughFrag,
    });

    this.addShader(gl, Shaders.Batch, {
      vertex: batchVert,
      fragment: batchFrag,
    });

    this.addShader(gl, Shaders.Crt, {
      vertex: crtVert,
      fragment: crtFrag,
    });

    this.addShader(gl, Shaders.Ascii, {
      vertex: asciiVert,
      fragment: asciiFrag,
    });
  }
}

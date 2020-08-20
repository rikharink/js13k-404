import { IRenderable } from "./engine/renderable";
import { Mask, Sprite } from "./engine/procgen/pixel-sprite";
import shipVertex from "./engine/gl/shaders/colored-texture.vert";
import shipFragment from "./engine/gl/shaders/colored-texture.frag";
import { createProgram, Context } from "./engine/gl/util";
import { Framebuffer } from "./star-field";

export class Ship implements IRenderable {
  resolutionLocation: WebGLUniformLocation | null;
  gl: Context;
  width: number;
  height: number;

  private _mask = new Mask(
    [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      0,
      0,
      0,
      0,
      1,
      -1,
      0,
      0,
      0,
      1,
      1,
      -1,
      0,
      0,
      0,
      1,
      1,
      -1,
      0,
      0,
      1,
      1,
      1,
      -1,
      0,
      1,
      1,
      1,
      2,
      2,
      0,
      1,
      1,
      1,
      2,
      2,
      0,
      1,
      1,
      1,
      2,
      2,
      0,
      1,
      1,
      1,
      1,
      -1,
      0,
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
    ],
    6,
    12,
    true,
    false
  );

  private _sprite: Sprite = new Sprite(this._mask, { colored: true });
  private _program: WebGLProgram;

  constructor(gl: Context, width: number, height: number) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.resolutionLocation = null;
    this._program = createProgram(gl, shipVertex, shipFragment);
  }

  init() {

  }

  render(gl: Context, source: Framebuffer, destination: Framebuffer, now?: number): Framebuffer {
    throw new Error("Method not implemented.");
  }
}

import { Framebuffer } from "../framebuffer";
import { Context, createAndSetupTexture } from "../util";
import { ShaderStore } from "../shaders/shaders";
import { TextureRenderer } from "./texture-renderer";
import { GLConstants } from "../constants";

interface PointstarOptions {}

export class PointstarRenderer {
  width: number;
  height: number;
  texture: WebGLTexture;
  private _textureRenderer: TextureRenderer;
  private _rng: () => number;

  constructor(gl: Context, shaders: ShaderStore, rng: () => number) {
    this._rng = rng;
    this.width = gl.canvas.width;
    this.height = gl.canvas.height;
    this._textureRenderer = new TextureRenderer(gl, shaders);
    this.texture = this._generatePointStarTexture(gl);
  }

  render(
    gl: WebGLRenderingContext,
    destination: Framebuffer,
    _opts?: PointstarOptions
  ): Framebuffer {
    if (this.width !== gl.canvas.width || this.height !== gl.canvas.height) {
      this.width = gl.canvas.width;
      this.height = gl.canvas.height;
      this.texture = this._generatePointStarTexture(gl);
    }
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination.framebuffer);
    gl.clearColor(1, 1, 0, 1);
    gl.clear(GLConstants.COLOR_BUFFER_BIT);
    this._textureRenderer.render(gl, this.texture, destination.framebuffer);
    return destination;
  }

  private _generatePointStarTexture(gl: Context): WebGLTexture {
    return createAndSetupTexture(gl, {
      wrap: GLConstants.CLAMP_TO_EDGE,
      filter: GLConstants.LINEAR,
      format: GLConstants.RGB,
      width: gl.canvas.width,
      height: gl.canvas.height,
      pixels: this._generatePointStars(
        gl.canvas.width,
        gl.canvas.height,
        0.05,
        0.125
      ),
    });
  }

  private _generatePointStars(
    width: number,
    height: number,
    density: number,
    brightness: number
  ): Uint8Array {
    let count = Math.round(width * height * density);
    let data = new Uint8Array(width * height * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.floor(this._rng() * width * height);
      const c = Math.round(255 * Math.log(1 - this._rng()) * -brightness);
      data[r * 3 + 0] = c;
      data[r * 3 + 1] = c;
      data[r * 3 + 2] = c;
    }

    return data;
  }
}

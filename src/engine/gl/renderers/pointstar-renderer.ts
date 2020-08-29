import { Framebuffer } from "../framebuffer";
import { Context, createAndSetupTexture, nextHighestPowerOfTwo } from "../util";
import { ShaderStore } from "../shaders/shaders";
import { PassthroughRenderer } from "./passthrough-renderer";
import { GLConstants } from "../constants";
import { Random } from "../../random";

interface PointstarOptions {
  density?: number;
  brightness?: number;
}

export class PointstarRenderer {
  private _width: number;
  private _height: number;
  private _texture: WebGLTexture;
  private _textureRenderer: PassthroughRenderer;
  private _rng: Random;
  private _density: number;
  private _brightness: number;

  constructor(
    gl: Context,
    shaders: ShaderStore,
    rng: Random,
    { density = 0.05, brightness = 0.125 }: PointstarOptions
  ) {
    this._rng = rng;
    this._width = gl.drawingBufferWidth;
    this._height = gl.drawingBufferHeight;
    this._textureRenderer = new PassthroughRenderer(gl, shaders);
    this._density = density;
    this._brightness = brightness;
    this._texture = this._generatePointStarTexture(gl);
  }

  render(gl: WebGLRenderingContext, destination: Framebuffer): Framebuffer {
    if (
      this._width !== gl.drawingBufferWidth ||
      this._height !== gl.drawingBufferHeight
    ) {
      this._width = gl.drawingBufferWidth;
      this._height = gl.drawingBufferHeight;
      this._texture = this._generatePointStarTexture(gl);
    }
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination.framebuffer);
    gl.clearColor(1, 1, 0, 1);
    gl.clear(GLConstants.COLOR_BUFFER_BIT);
    this._textureRenderer.render(gl, this._texture, destination.framebuffer);
    return destination;
  }

  private _generatePointStarTexture(gl: Context): WebGLTexture {
    const width = nextHighestPowerOfTwo(gl.drawingBufferWidth);
    const height = nextHighestPowerOfTwo(gl.drawingBufferHeight);
    return createAndSetupTexture(gl, {
      wrap: GLConstants.CLAMP_TO_EDGE,
      filter: GLConstants.LINEAR,
      format: GLConstants.RGB,
      width: width,
      height: height,
      pixels: this._generatePointStars(
        width,
        height,
        this._density,
        this._brightness
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
      const r = Math.floor(this._rng.random() * width * height);
      const c = Math.round(
        255 * Math.log(1 - this._rng.random()) * -brightness
      );
      data[r * 3 + 0] = c;
      data[r * 3 + 1] = c;
      data[r * 3 + 2] = c;
    }

    return data;
  }
}

import { IRenderable } from "./engine/renderable";
import { Context } from "./engine/gl/util";
import { TextureRenderer } from "./engine/gl/renderers/texture-renderer";
import { PingPong } from "./engine/gl/ping-pong";
import { Framebuffer } from "./engine/gl/framebuffer";
import { ShaderStore } from "./engine/gl/shaders/shaders";
import { PointstarRenderer } from "./engine/gl/renderers/pointstar-renderer";
import { StarRenderer } from "./engine/gl/renderers/star-renderer";
import { NebulaeRenderer } from "./engine/gl/renderers/nebulae-renderer";
import { Random } from "./engine/random";
export class Starfield extends PingPong implements IRenderable {
  public gl!: Context;
  public width: number = 0;
  public height: number = 0;
  private _resultTexture!: WebGLTexture;
  private _nebulaeCount: number;
  private _starCount: number;
  private _textureRenderer: TextureRenderer;
  private _pointstarRenderer: PointstarRenderer;
  private _starRenderer: StarRenderer;
  private _nebulaeRenderer: NebulaeRenderer;
  private _rng: Random;
  private _scale: number;

  constructor(
    gl: Context,
    shaders: ShaderStore,
    nebulaeCount: number,
    starCount: number,
    rng: Random
  ) {
    super(gl);
    this._nebulaeCount = nebulaeCount;
    this._starCount = starCount;

    this._textureRenderer = new TextureRenderer(gl, shaders);
    this._pointstarRenderer = new PointstarRenderer(gl, shaders, rng, {
      brightness: rng.random() * 0.2 + 0.125,
      density: rng.random() * 0.1 + 0.005,
    });
    this._starRenderer = new StarRenderer(gl, shaders);
    this._nebulaeRenderer = new NebulaeRenderer(gl, shaders, rng);
    this._rng = rng;
    this._scale = Math.max(gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  private _draw(gl: Context): void {
    this.resetFramebuffers(gl);
    this._pointstarRenderer.render(gl, this._ping);

    const nebulaeOut = this.pingpong(
      this._ping,
      this._ping,
      this._pong,
      this._nebulaeCount,
      (source: Framebuffer, destination: Framebuffer) =>
        this._nebulaeRenderer.render(gl, source, destination, {
          offset: [this._rng.random() * 500, this._rng.random() * 500],
          scale: (this._rng.random() * 0.4 + 0.1) / this._scale,
          falloff: this._rng.random() * 6.0 + 0.5,
          color: [this._rng.random(), this._rng.random(), this._rng.random()],
          density: this._rng.random() * 0.25,
        })
    );

    const starOut = this.pingpong(
      nebulaeOut,
      this._ping,
      this._pong,
      this._starCount,
      (source: Framebuffer, destination: Framebuffer) =>
        this._starRenderer.render(gl, source, destination, {
          coreColor: [1, 1, 1],
          coreRadius: this._rng.random() * 0.01 + 0.001,
          haloColor: [
            this._rng.random(),
            this._rng.random(),
            this._rng.random(),
          ],
          haloFalloff: this._rng.random() * 512 + 16,
          center: [this._rng.random(), this._rng.random()],
          resolution: [
            gl.drawingBufferWidth,
            gl.drawingBufferHeight,
          ],
          scale: this._scale,
        })
    );

    let sunOut = starOut === this._ping ? this._pong : this._ping;
    sunOut = this._starRenderer.render(gl, starOut, sunOut, {
      coreColor: [1, 1, 1],
      coreRadius: this._rng.random() * 0.25 + 0.0125,
      haloColor: [this._rng.random(), this._rng.random(), this._rng.random()],
      haloFalloff: this._rng.random() * 32 + 8,
      center: [this._rng.random(), this._rng.random()],
      resolution: [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ],
      scale: this._scale,
    });

    this._resultTexture = sunOut.texture!;
  }

  public render(
    gl: Context,
    _source: Framebuffer,
    destination: Framebuffer
  ): void {
    if (
      this.width != gl.drawingBufferWidth ||
      this.height != gl.drawingBufferHeight
    ) {
      this.width = gl.drawingBufferWidth;
      this.height = gl.drawingBufferHeight;
      this._draw(gl);
    }
    this._textureRenderer.render(
      gl,
      this._resultTexture,
      destination.framebuffer
    );
  }
}

import { IRenderable } from "./engine/renderable";
import { Context } from "./engine/gl/util";
import { TextureRenderer } from "./engine/gl/renderers/texture-renderer";
import { PingPong } from "./engine/gl/ping-pong";
import { Framebuffer } from "./engine/gl/framebuffer";
import { ShaderStore } from "./engine/gl/shaders/shaders";
import { PointstarRenderer } from "./engine/gl/renderers/pointstar-renderer";
import { StarRenderer } from "./engine/gl/renderers/star-renderer";
import { NebulaeRenderer } from "./engine/gl/renderers/nebulae-renderer";
import { createImageFromTexture } from "./engine/debug/index";

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
  private _rng: () => number;

  constructor(
    gl: Context,
    shaders: ShaderStore,
    nebulaeCount: number,
    starCount: number,
    rng: () => number
  ) {
    super(gl);
    this._nebulaeCount = nebulaeCount;
    this._starCount = starCount;

    this._textureRenderer = new TextureRenderer(gl, shaders);
    this._pointstarRenderer = new PointstarRenderer(gl, shaders, rng);
    this._starRenderer = new StarRenderer(gl, shaders);
    this._nebulaeRenderer = new NebulaeRenderer(gl, shaders, rng);
    this._rng = rng;
    
  }

  private draw(gl: Context): void {
    this.resetFramebuffers(gl);
    this._pointstarRenderer.render(gl, this._ping);
    const scale = Math.max(gl.canvas.width, gl.canvas.height);

    const nebulaeOut = this.pingpong(
      this._ping,
      this._ping,
      this._pong,
      this._nebulaeCount,
      (source: Framebuffer, destination: Framebuffer) =>
        this._nebulaeRenderer.render(gl, source, destination, {
          offset: [this._rng() * 100, this._rng() * 100],
          scale: (this._rng() * 2 + 1) / scale,
          falloff: this._rng() * 2.0 + 3.0,
          color: [this._rng(), this._rng(), this._rng()],
          density: this._rng() * 0.2,
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
          coreRadius: this._rng() * 0.0,
          haloColor: [this._rng(), this._rng(), this._rng()],
          haloFalloff: this._rng() * 1024 + 32,
          center: [this._rng(), this._rng()],
          resolution: [gl.canvas.width, gl.canvas.height],
          scale: scale,
        })
    );

    let sunOut = starOut === this._ping ? this._pong : this._ping;
    sunOut = this._starRenderer.render(gl, starOut, sunOut, {
      coreColor: [1, 1, 1],
      coreRadius: this._rng() * 0.025 + 0.025,
      haloColor: [this._rng(), this._rng(), this._rng()],
      haloFalloff: this._rng() * 32 + 32,
      center: [this._rng(), this._rng()],
      resolution: [gl.canvas.width, gl.canvas.height],
      scale: scale,
    });

    this._resultTexture = sunOut.texture!;
  }

  public render(
    gl: Context,
    _source: Framebuffer,
    destination: Framebuffer
  ): void {
    if (this.width != gl.canvas.width || this.height != gl.canvas.height) {
      this.width = gl.canvas.width;
      this.height = gl.canvas.height;
      this.draw(gl);
    }
    this._textureRenderer.render(
      gl,
      this._resultTexture,
      destination.framebuffer
    );
  }
}
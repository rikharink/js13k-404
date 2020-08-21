import { IRenderable } from "./renderable";
import { TilemapRenderer } from "./gl/renderers/tilemap-renderer";
import { Context } from "./gl/util";
import { PingPong } from "./gl/ping-pong";
import { TextureRenderer } from "./gl/renderers/texture-renderer";
import { ShaderStore } from "./gl/shaders/shaders";
import { SpriteRenderer, Sprite } from "./gl/renderers/sprite-renderer";
import { Framebuffer } from "./gl/framebuffer";

export class Scene extends PingPong {
  public rng: () => number;
  public gl!: Context;
  public width: number;
  public height: number;
  private _tilemap?: TilemapRenderer;
  private _background?: IRenderable;
  private _spritesRenderer: SpriteRenderer;
  private _textureRenderer: TextureRenderer;

  private _scrollX = 0;
  private _scrollY = 0;
  private _zoomX = 1;
  private _zoomY = 1;

  constructor(gl: Context, shaders: ShaderStore, rng: () => number) {
    super(gl);
    this.rng = rng;
    [this.width, this.height] = [0, 0];
    this._textureRenderer = new TextureRenderer(gl, shaders);
    this._spritesRenderer = new SpriteRenderer(gl, shaders, false);
  }

  public set zoom(value: { x: number; y: number }) {
    [this._zoomX, this._zoomY] = [value.x, value.y];
  }

  public set scroll(value: { x: number; y: number }) {
    [this._scrollX, this._scrollY] = [value.x, value.y];
  }

  public set tilemap(tilemap: TilemapRenderer) {
    this._tilemap = tilemap;
  }

  public set background(background: IRenderable) {
    this._background = background;
  }

  public addSprite(sprite: Sprite) {
    this._spritesRenderer.add(sprite);
  }

  public render(gl: Context, now?: number): void {
    if (this.width !== gl.canvas.width || this.height !== gl.canvas.height) {
      [this.width, this.height] = [gl.canvas.width, gl.canvas.height];
      this.resetFramebuffers(gl);
    }
    const display: Framebuffer = { framebuffer: null, texture: null };
    this._background!.render(gl, this._ping, this._pong);
    // this._tilemap!.render(gl, this._ping, { framebuffer: null, texture: null });
    this._spritesRenderer!.render(this._pong, display);
  }
}

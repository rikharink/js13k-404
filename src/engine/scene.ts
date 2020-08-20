import { IRenderable } from "./renderable";
import { TileMap } from "./tile-map";
import { Context } from "./gl/util";
import { PingPong } from "./gl/ping-pong";
import { TextureRenderer } from "./gl/renderers/texture-renderer";
import { ShaderStore } from "./gl/shaders/shaders";

export class Scene extends PingPong {
  gl!: Context;
  width: number;
  height: number;
  private _tilemap?: TileMap;
  private _background?: IRenderable;
  private _sprites: IRenderable[] = [];
  private _textureRenderer: TextureRenderer;

  private _scrollX = 0;
  private _scrollY = 0;
  private _zoomX = 1;
  private _zoomY = 1;

  constructor(gl: Context, shaders: ShaderStore) {
    super(gl);
    [this.width, this.height] = [0, 0];
    this._textureRenderer = new TextureRenderer(gl, shaders);
  }

  public set zoom(value: { x: number; y: number }) {
    [this._zoomX, this._zoomY] = [value.x, value.y];
  }

  public set scroll(value: { x: number; y: number }) {
    [this._scrollX, this._scrollY] = [value.x, value.y];
  }

  public set tilemap(tilemap: TileMap) {
    this._tilemap = tilemap;
  }

  public set background(background: IRenderable) {
    this._background = background;
  }

  public addSprite(sprite: IRenderable) {
    this._sprites.push(sprite);
  }

  public clearSprites() {
    this._sprites = [];
  }

  public render(gl: Context, now?: number): void {
    if (this.width !== gl.canvas.width || this.height !== gl.canvas.height) {
      [this.width, this.height] = [gl.canvas.width, gl.canvas.height];
      this.resetFramebuffers(gl);
    }

    this._background!.render(gl, this._ping, {
      framebuffer: null,
      texture: null,
    });
  }
}

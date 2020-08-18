import { IRenderable } from "./renderable";
import { TileMap } from "./tile-map";
import { createAndSetupTexture, Context } from "./gl/util";



export class Scene implements IRenderable {
  resolutionLocation: WebGLUniformLocation | null = null;
  gl: Context;
  width: number;
  height: number;
  private _tilemap?: TileMap;
  private _background?: IRenderable;
  private _sprites: IRenderable[] = [];

  private _scrollX = 0;
  private _scrollY = 0;
  private _zoomX = 1;
  private _zoomY = 1;

  constructor(gl: Context, width: number, height: number) {
    // super(gl, width, height);
    this.gl = gl;
    [this.width, this.height] = [width, height];
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

  public render(now: number): void {
    // if (this._background) {
    //   this._background.render(now);
    // }

    if (this._tilemap) {
      this._tilemap.render(this._scrollX, this._scrollY);
    }

    // for (const sprite of this._sprites) {
    //   sprite.render(now);
    // }
  }
}

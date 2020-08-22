import { IRenderable } from "./renderable";
import { TilemapRenderer } from "./gl/renderers/tilemap-renderer";
import { Context } from "./gl/util";
import { PingPong } from "./gl/ping-pong";
import { TextureRenderer } from "./gl/renderers/texture-renderer";
import { ShaderStore } from "./gl/shaders/shaders";
import {
  SpriteRenderer,
  Sprite,
  Point,
  Frame,
} from "./gl/renderers/sprite-renderer";
import { Framebuffer } from "./gl/framebuffer";
import { Random } from "./random";
import { PixelSprite, Mask } from "./procgen/pixel-sprite";

export class Scene extends PingPong {
  public _rng: Random;
  public _gl!: Context;
  public _width: number;
  public _height: number;
  private _tilemap?: TilemapRenderer;
  private _background?: IRenderable;
  private _spritesRenderer: SpriteRenderer;
  private _textureRenderer: TextureRenderer;

  private _scrollX = 0;
  private _scrollY = 0;
  private _zoomX = 1;
  private _zoomY = 1;

  constructor(gl: Context, shaders: ShaderStore, rng: Random) {
    super(gl);
    this._rng = rng;
    [this._width, this._height] = [0, 0];
    this._textureRenderer = new TextureRenderer(gl, shaders);
    this._spritesRenderer = new SpriteRenderer(gl, shaders, false);
    this._spritesRenderer.camera.to.set(0.5);
  }

  private _setupSprites() {
    let ship = new PixelSprite(
      new Mask(
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
      ),
      this._rng,
      { colored: true }
    );
    let atlas = this._spritesRenderer.texture(ship.canvas, 0.5);
    atlas.anchor = new Point(0.5);
    const bFrame = atlas.frame(new Point(), new Point(12));
    const frames: Frame[] = [atlas, bFrame];
    let len = 0;
    let cl = 0;
    const sprs = [];
    const layer = this._spritesRenderer.layer(cl);
    for (let i = 0; i < 2; i++) {
      const sprite = new Sprite(frames[1], { visible: true });
      let x = this._rng.random() * this._gl.canvas.width;
      let y = this._rng.random() * this._gl.canvas.height;
      sprite.position.set(x, y);
      sprite.tint = this._rng.random() * 0xffffff;
      sprite.rotation = this._rng.random() * Math.PI * 2;
      sprite.scale.set(2);
      sprs.push(sprite);
      layer.add(sprite);
    }
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
    if (
      this._width !== gl.drawingBufferWidth ||
      this._height !== gl.drawingBufferHeight
    ) {
      [this._width, this._height] = [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ];
      this.resetFramebuffers(gl);
      this._spritesRenderer.camera.at.set(this._width, this._height);
    }
    const display: Framebuffer = { framebuffer: null, texture: null };
    this._background!.render(gl, this._ping, this._pong);
    // this._tilemap!.render(gl, this._ping, { framebuffer: null, texture: null });
    this._spritesRenderer!.render(this._pong, display);
  }
}

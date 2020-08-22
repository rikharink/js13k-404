import { IRenderable } from "./renderable";
import { TilemapRenderer } from "./gl/renderers/tilemap-renderer";
import { Context } from "./gl/util";
import { PingPong } from "./gl/ping-pong";
import { TextureRenderer } from "./gl/renderers/texture-renderer";
import { ShaderStore } from "./gl/shaders/shaders";
import { SpriteRenderer } from "./gl/renderers/sprite-renderer";
import { Frame } from "./gl/renderers/frame";
import { Sprite } from "./gl/renderers/sprite";
import { Point } from "./gl/renderers/point";
import { Framebuffer } from "./gl/framebuffer";
import { Random } from "./random";
import { PixelSprite, Mask } from "./procgen/pixel-sprite";
import { GLConstants } from "./gl/constants";
import { createImageFromTexture } from "./debug/index";

export class Scene extends PingPong {
  public _rng: Random;
  public _gl: Context;
  public _width: number;
  public _height: number;
  private _tilemap?: TilemapRenderer;
  private _background?: IRenderable;
  private _spritesRenderer!: SpriteRenderer;
  private _textureRenderer: TextureRenderer;

  private _scrollX = 0;
  private _scrollY = 0;
  private _zoomX = 1;
  private _zoomY = 1;
  sprs: Sprite[] = [];

  constructor(gl: Context, shaders: ShaderStore, rng: Random) {
    super(gl);
    this._gl = gl;
    this._rng = rng;
    [this._width, this._height] = [0, 0];
    this._textureRenderer = new TextureRenderer(gl, shaders);
    // this._spritesRenderer = new SpriteRenderer(gl, shaders, false);
    // this._spritesRenderer.camera.to.set(0.5);
  }

  private _setupSprites() {
    //prettier-ignore
    const mask = new Mask([
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 1,-1, 0,
      0, 0, 0, 0, 1, 1,-1, 0,
      0, 0, 0, 0, 1, 1,-1, 0,
      0, 0, 0, 1, 1, 1,-1, 0,
      0, 0, 1, 1, 1, 2, 2, 0,
      0, 0, 1, 1, 1, 2, 2, 0,
      0, 0, 1, 1, 1, 2, 2, 0,
      0, 0, 1, 1, 1, 1,-1, 0,
      0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
], 8, 16, true, false);
    let ship = new PixelSprite(mask, this._rng, { colored: true });
    let atlas = this._spritesRenderer.texture(ship.canvas, 0);
    atlas.anchor = new Point(0.5);
    const bFrame = atlas.frame(new Point(), new Point(12));
    const frames: Frame[] = [atlas, bFrame];
    let cl = 0;
    const layer = this._spritesRenderer.layer(cl);

    for (let i = 0; i < 1000; i++) {
      const sprite = new Sprite(frames[1], { visible: true });
      let x = this._rng.random() * this._gl.drawingBufferWidth;
      let y = this._rng.random() * this._gl.drawingBufferHeight;
      sprite.position.set(x, y);
      sprite.tint = this._rng.random() * 0xffffff;
      sprite.rotation = this._rng.random() * Math.PI * 2;
      // sprite.scale.set(2);
      layer.add(sprite);
      this.sprs.push(sprite);
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
      // this._spritesRenderer.camera.at.set(this._width, this._height);
    }
    const display: Framebuffer = { framebuffer: null, texture: null };
    this._background!.render(gl, this._ping, display);
    // this._tilemap!.render(gl, this._ping, { framebuffer: null, texture: null });
    // this._spritesRenderer!.render(gl, this._pong, display);
  }
}

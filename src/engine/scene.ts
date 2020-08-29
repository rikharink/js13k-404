import { Settings } from "./../settings";
import { PassthroughRenderer } from "./gl/renderers/passthrough-renderer";
import { CrtRenderer } from "./gl/renderers/crt-renderer";
import { TilemapRenderer } from "./gl/renderers/tilemap-renderer";
import { Context } from "./gl/util";
import { PingPong } from "./gl/ping-pong";
import { ShaderStore } from "./gl/shaders/shaders";
import { Framebuffer } from "./gl/framebuffer";
import { Random } from "./random";
import { IRenderable } from "./renderable";
import { AsciiRenderer } from "./gl/renderers/ascii-renderer";

interface IEffect {
  render(
    gl: Context,
    source: Framebuffer,
    destination: Framebuffer,
    now?: number
  ): Framebuffer;
}

export class Scene extends PingPong {
  public _rng: Random;
  public _gl: Context;
  public _width: number;
  public _height: number;
  private _background?: IRenderable;
  private _crtRenderer: CrtRenderer;
  private _crtEffectOn!: boolean;
  private _asciiRenderer: AsciiRenderer;
  private _asciiEffectOn!: boolean;
  private _passthroughRenderer: PassthroughRenderer;
  private _effects: IEffect[] = [];
  private _settings: Settings;

  constructor(
    gl: Context,
    shaders: ShaderStore,
    rng: Random,
    settings: Settings
  ) {
    super(gl);
    this._settings = settings;
    this._gl = gl;
    this._rng = rng;
    [this._width, this._height] = [0, 0];
    this._crtRenderer = new CrtRenderer(gl, shaders);
    this._asciiRenderer = new AsciiRenderer(gl, shaders);
    this.updateSettings();
    this._passthroughRenderer = new PassthroughRenderer(gl, shaders);
    document.addEventListener(
      "settingsupdated",
      this._updateSettingsHandler.bind(this)
    );
  }

  private _updateSettingsHandler() {
    this._settings.load();
    this.updateSettings();
  }

  public updateSettings() {
    this._crtEffectOn = !this._settings.crtOn;
    this._asciiEffectOn = !this._settings.asciiOn;
    this._toggleAscii();
    this._toggleCrt();
  }

  private _toggleCrt() {
    this._crtEffectOn = !this._crtEffectOn;
    if (this._crtEffectOn) {
      this._effects.push(this._crtRenderer);
    } else {
      this._effects = this._effects.filter((e) => e !== this._crtRenderer);
    }
  }

  private _toggleAscii() {
    this._asciiEffectOn = !this._asciiEffectOn;
    if (this._asciiEffectOn) {
      this._effects.push(this._asciiRenderer);
    } else {
      this._effects = this._effects.filter((e) => e !== this._asciiRenderer);
    }
  }

  public set background(background: IRenderable) {
    this._background = background;
  }

  private _renderEffects(
    gl: Context,
    source: Framebuffer,
    destination: Framebuffer,
    now: number
  ) {
    let ping = source;
    let pong = destination;
    for (let effect of this._effects) {
      let result = effect.render.bind(effect)(gl, ping, pong, now);
      pong = ping;
      ping = result;
    }
    return ping;
  }

  public render(gl: Context, now: number): void {
    if (
      this._width !== gl.drawingBufferWidth ||
      this._height !== gl.drawingBufferHeight
    ) {
      [this._width, this._height] = [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ];
      this.resetFramebuffers(gl);
    }
    const display: Framebuffer = { framebuffer: null, texture: null };
    this._background!.render(gl, this._ping, this._pong);
    let result = this._renderEffects(gl, this._pong, this._ping, now);
    this._passthroughRenderer.render(gl, result.texture!, display.framebuffer);
  }
}

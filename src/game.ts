import { Menu } from "./engine/ui/menu";
import { Scene } from "./engine/scene";
import { Context } from "./engine/gl/util";
import { Starfield } from "./starfield";
import { setupCanvas } from "./engine/util";
import { ShaderStore } from "./engine/gl/shaders/shaders";
import { Random } from "./engine/random";
import { Settings } from "./settings";

export class Game {
  private _currentScene?: Scene;
  private _gl: WebGLRenderingContext;
  private _shaders: ShaderStore;
  private _random: Random = new Random(`404${(Math.random() * 404) | 0}`);
  private _settings: Settings;
  private _menu: Menu;

  constructor(gl: Context, settings: Settings) {
    this._settings = settings;
    this._menu = new Menu(settings);
    document.addEventListener("keydown", this._menuListener.bind(this));
    this._gl = gl;
    this._shaders = new ShaderStore(gl);
    this._currentScene = new Scene(
      gl,
      this._shaders,
      this._random,
      this._settings
    );
    this._currentScene.background = new Starfield(
      gl,
      this._shaders,
      this._random.randInt(2, 5),
      this._random.randInt(5, 30),
      this._random
    );
  }

  private _menuListener(ev: KeyboardEvent) {
    if (ev.key === "Escape") {
      this._menu.toggleMenu();
    }
  }

  public gameloop(now: number) {
    requestAnimationFrame(this.gameloop.bind(this));
    if (setupCanvas(this._gl, now)) {
      this._random.reset();
    }
    this._currentScene?.render(this._gl, now);
  }
}

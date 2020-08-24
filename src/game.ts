import { Scene } from "./engine/scene";
import textureVert from "./engine/gl/shaders/texture.vert";
import tilemapVert from "./engine/gl/shaders/tilemap.vert";
import tilemapFrag from "./engine/gl/shaders/tilemap.frag";
import nebulaeShader from "./engine/gl/shaders/nebulae.frag";
import starShader from "./engine/gl/shaders/star.frag";
import fquadVert from "./engine/gl/shaders/fquad.vert";
import fquadFrag from "./engine/gl/shaders/fquad.frag";
import spriteVert from "./engine/gl/shaders/sprite.vert";
import spriteFrag from "./engine/gl/shaders/sprite.frag";

import { Context } from "./engine/gl/util";
import { Starfield } from "./starfield";
import { setupCanvas } from "./engine/util";
import { ShaderStore } from "./engine/gl/shaders/shaders";
import { Random } from "./engine/random";
import { getTileMap } from "./engine/gl/renderers/tilemap-renderer";
// import { Dubinator } from "./engine/sound/dubinator";

export const enum Shaders {
  Nebulae = 0,
  Star = 1,
  Tilemap = 2,
  Fquad = 3,
  Sprite = 4,
}

export class Game {
  private _currentScene?: Scene;
  private _gl: WebGLRenderingContext;
  private _shaders: ShaderStore = new ShaderStore();
  private _random: Random = new Random(`404${Math.random() * 100 | 0}`);
  // private _actx: AudioContext;
  // public dubinator: Dubinator;

  constructor(gl: Context) {
    // this._actx = new AudioContext();
    // this.dubinator = new Dubinator(this._actx);
    // this.dubinator.togglePlay();
    this._setupShaders(gl);
    this._gl = gl;
    this._currentScene = new Scene(gl, this._shaders, this._random);
    this._currentScene.background = new Starfield(
      gl,
      this._shaders,
      this._random.randInt(2, 5),
      this._random.randInt(5, 30),
      this._random
    );
    this._currentScene.tilemap = getTileMap(gl, this._shaders);
  }

  private _setupShaders(gl: Context) {
    this._shaders.addShader(gl, Shaders.Nebulae, {
      vertex: textureVert,
      fragment: nebulaeShader,
    });

    this._shaders.addShader(gl, Shaders.Star, {
      vertex: textureVert,
      fragment: starShader,
    });

    this._shaders.addShader(gl, Shaders.Tilemap, {
      vertex: tilemapVert,
      fragment: tilemapFrag,
    });

    this._shaders.addShader(gl, Shaders.Fquad, {
      vertex: fquadVert,
      fragment: fquadFrag,
    });

    this._shaders.addShader(gl, Shaders.Sprite, {
      vertex: spriteVert,
      fragment: spriteFrag,
    });
  }

  public gameloop(now: number) {
    requestAnimationFrame(this.gameloop.bind(this));
    if(setupCanvas(this._gl, now)){
      this._random.reset();
    }
    this._currentScene?.render(this._gl, now);
  }
}

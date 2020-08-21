import { Scene } from "./engine/scene";
import textureVert from "./engine/gl/shaders/texture.vert";
import tilemapVert from "./engine/gl/shaders/tilemap.vert";
import tilemapFrag from "./engine/gl/shaders/tilemap.frag";
import nebulaeShader from "./engine/gl/shaders/nebulae.frag";
import starShader from "./engine/gl/shaders/star.frag";
import fquadVert from "./engine/gl/shaders/fquad.vert";
import fquadFrag from "./engine/gl/shaders/fquad.frag";

import { Context } from "./engine/gl/util";
import { Starfield } from "./starfield";
import { setupCanvas } from "./engine/util";
import { ShaderStore } from "./engine/gl/shaders/shaders";
import { Random } from "./engine/random";
import { getTileMap } from "./engine/tile-map";

export class Game {
  private currentScene?: Scene;
  private gl: WebGLRenderingContext;
  private shaders: ShaderStore = new ShaderStore();
  private random: Random = new Random("404");

  constructor(gl: Context) {
    this.setupShaders(gl);
    this.gl = gl;
    this.currentScene = new Scene(gl, this.shaders, this.random.random);
    this.currentScene.background = new Starfield(
      gl,
      this.shaders,
      2,
      20,
      this.random.random
    );
    this.currentScene.tilemap = getTileMap(gl, this.shaders);
  }

  private setupShaders(gl: Context) {
    this.shaders.addShader(gl, "nebulae", {
      vertex: textureVert,
      fragment: nebulaeShader,
    });

    this.shaders.addShader(gl, "star", {
      vertex: textureVert,
      fragment: starShader,
    });

    this.shaders.addShader(gl, "tilemap", {
      vertex: tilemapVert,
      fragment: tilemapFrag,
    });

    this.shaders.addShader(gl, "fquad", {
      vertex: fquadVert,
      fragment: fquadFrag,
    });
  }

  public gameloop(now: number) {
    requestAnimationFrame(this.gameloop.bind(this));
    setupCanvas(this.gl, now);
    this.currentScene?.render(this.gl, now);
  }
}

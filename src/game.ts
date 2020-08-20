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
import { TextureRenderer } from "./engine/gl/renderers/texture-renderer";
import { PointstarRenderer } from "./engine/gl/renderers/pointstar-renderer";

export class Game {
  private currentScene?: Scene;
  private gl: WebGLRenderingContext;
  private shaderStore: ShaderStore = new ShaderStore();

  constructor(gl: Context) {
    this.setupShaders(gl);
    this.gl = gl;
    this.currentScene = new Scene(gl, this.shaderStore);
    this.currentScene.background = new Starfield(gl, this.shaderStore, 2, 20);
  }

  private setupShaders(gl: Context) {
    this.shaderStore.addShader(gl, "nebulae", {
      vertex: textureVert,
      fragment: nebulaeShader,
    });

    this.shaderStore.addShader(gl, "star", {
      vertex: textureVert,
      fragment: starShader,
    });

    this.shaderStore.addShader(gl, "tilemap", {
      vertex: tilemapVert,
      fragment: tilemapFrag,
    });

    this.shaderStore.addShader(gl, "fquad", {
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

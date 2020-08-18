import { IRenderable } from "./engine/renderable";
import { Context } from "./engine/gl/util";

export class Background implements IRenderable {
  public resolutionLocation: WebGLUniformLocation | null = null;
  private _program!: WebGLProgram;
  gl: Context;
  width: number;
  height: number;

  constructor(gl: Context, width: number, height: number) {
    // super(gl, width, height);
    this.gl = gl;
    [this.width, this.height] = [width, height];
  }

  public render(now?: number): void {
    
  }
}

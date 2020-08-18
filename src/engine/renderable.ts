import { Context } from './gl/util';

export interface IRenderable {
  resolutionLocation: WebGLUniformLocation | null;
  gl: Context;
  width: number;
  height: number;
  render(now?: number): void;
}

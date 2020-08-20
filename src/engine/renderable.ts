import { Context } from './gl/util';
import { Framebuffer } from '../star-field';

export interface IRenderable {
  gl: Context;
  width: number;
  height: number;
  render(gl: Context, source: Framebuffer, destination: Framebuffer, now?: number): void;
}

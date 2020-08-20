import { Context } from './gl/util';
import { Framebuffer } from './gl/framebuffer';

export interface IRenderable {
  width: number;
  height: number;
  render(gl: Context, source: Framebuffer, destination: Framebuffer, now?: number): void;
}

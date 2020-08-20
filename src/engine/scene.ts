import vert from "./gl/shaders/fullscreen-texture.vert";
import frag from "./gl/shaders/texture.frag";

import { IRenderable } from "./renderable";
import { TileMap } from "./tile-map";
import {
  Context,
  createProgram,
  createVertexArray,
  Vao,
  bindVertexArray,
} from "./gl/util";
import { Framebuffer } from "../star-field";
import { createImageFromTexture } from "./debug/index";

export class Scene {
  gl!: Context;
  width: number;
  height: number;
  private _tilemap?: TileMap;
  private _background?: IRenderable;
  private _sprites: IRenderable[] = [];

  private _scrollX = 0;
  private _scrollY = 0;
  private _zoomX = 1;
  private _zoomY = 1;
  private _program: WebGLProgram;
  private _vao: Vao;
  private _ping: Framebuffer;
  private _pong: Framebuffer;
  private _positionbuffer: WebGLBuffer;
  private _uvbuffer: WebGLBuffer;
  private _attributePositionLocation: number;
  private _attributeUvLocation: number;
  private _sourceLocation: WebGLUniformLocation | null;

  constructor(gl: Context, width: number, height: number) {
    [this.width, this.height] = [width, height];
    this._program = createProgram(gl, vert, frag);
    this._positionbuffer = gl.createBuffer()!;
    this._uvbuffer = gl.createBuffer()!;
    this._attributePositionLocation = gl.getAttribLocation(
      this._program,
      "a_position"
    );
    this._attributeUvLocation = gl.getAttribLocation(this._program, "a_uv");
    this._sourceLocation = gl.getUniformLocation(this._program, "u_source");
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionbuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvbuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]),
      gl.STATIC_DRAW
    );
    this._vao = createVertexArray(gl)!;
    [this._ping, this._pong] = this.setupFramebuffers(gl);
  }

  private setupFramebuffers(gl: Context): [Framebuffer, Framebuffer] {
    const pingTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, pingTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.canvas.width,
      gl.canvas.height,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const pingFramebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, pingFramebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pingTexture,
      0
    );
    const ping = {
      framebuffer: pingFramebuffer,
      texture: pingTexture,
    };

    const pongTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, pongTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.canvas.width,
      gl.canvas.height,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const pongFramebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, pongFramebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pongTexture,
      0
    );

    const pong = {
      framebuffer: pongFramebuffer,
      texture: pongTexture,
    };

    return [ping, pong];
  }

  public set zoom(value: { x: number; y: number }) {
    [this._zoomX, this._zoomY] = [value.x, value.y];
  }

  public set scroll(value: { x: number; y: number }) {
    [this._scrollX, this._scrollY] = [value.x, value.y];
  }

  public set tilemap(tilemap: TileMap) {
    this._tilemap = tilemap;
  }

  public set background(background: IRenderable) {
    this._background = background;
  }

  public addSprite(sprite: IRenderable) {
    this._sprites.push(sprite);
  }

  public clearSprites() {
    this._sprites = [];
  }

  private resetFramebuffers(gl: Context) {
    gl.deleteTexture(this._ping.texture);
    gl.deleteFramebuffer(this._ping.framebuffer);
    gl.deleteTexture(this._pong.texture);
    gl.deleteFramebuffer(this._pong.framebuffer);
    [this._ping, this._pong] = this.setupFramebuffers(gl);
  }

  private renderToScreen(gl: Context) {
    gl.useProgram(this._program);
    bindVertexArray(gl, this._vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!(window.Dump instanceof HTMLImageElement)) {
      window.Dump = createImageFromTexture(
        gl,
        this._pong.texture!,
        gl.canvas.width,
        gl.canvas.height
      );
    }
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionbuffer);
    gl.enableVertexAttribArray(this._attributePositionLocation);
    gl.vertexAttribPointer(
      this._attributePositionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvbuffer);
    gl.enableVertexAttribArray(this._attributeUvLocation);
    gl.vertexAttribPointer(this._attributeUvLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(this._sourceLocation, 0);
    gl.bindTexture(gl.TEXTURE_2D, this._pong.texture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    bindVertexArray(gl, null);
  }

  public render(gl: Context, now?: number): void {
    if (gl.canvas.width !== this.width || gl.canvas.height !== this.height) {
      [this.width, this.height] = [gl.canvas.width, gl.canvas.height];
      this.resetFramebuffers(gl);
      [this._ping, this._pong] = this.setupFramebuffers(gl);
    }
    this._background!.render(gl, this._ping, this._pong);

    this.renderToScreen(gl);
  }
}

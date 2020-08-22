import { IRenderable } from "../../renderable";
import {
  Context,
  bindVAO,
  createVAO,
  Vao,
  createAndSetupTexture,
} from "../util";
import {
  orthographic,
  scale,
  identity,
  translate,
  zRotate,
} from "../../math/m4";
import { Framebuffer } from "../framebuffer";
import { TextureRenderer } from "./texture-renderer";
import { ShaderStore } from "../shaders/shaders";
import { GLConstants } from "../constants";
import { Shaders } from "../../../game";

const dst = new Float32Array(16);

export class Tile {
  public u: number;
  public v: number;
  public xFlip: boolean;
  public yFlip: boolean;
  public xySwap: boolean;

  constructor(
    textureLocation: [number, number],
    xFlip = false,
    yFlip = false,
    xySwap = false
  ) {
    this.u = textureLocation[0];
    this.v = textureLocation[1];
    this.xFlip = xFlip;
    this.yFlip = yFlip;
    this.xySwap = xySwap;
  }

  flags(): number {
    return (
      (this.xFlip ? 128 : 0) | (this.yFlip ? 64 : 0) | (this.xySwap ? 32 : 0)
    );
  }
}

export class TilemapRenderer {
  public mapWidth: number;
  public mapHeight: number;
  public width: number;
  public height: number;
  private _tileset: WebGLTexture;
  private _tilesetWidth: number;
  private _tilesetHeight: number;
  private _tilesize: number;
  private _map: Tile[][];
  private _tint: [number, number, number, number];
  private _program: WebGLProgram;
  private _positionLocation: number;
  private _matrixLocation: WebGLUniformLocation | null;
  private _texMatrixLocation: WebGLUniformLocation | null;
  private _tilemapLocation: WebGLUniformLocation | null;
  private _tilesetLocation: WebGLUniformLocation | null;
  private _tilemapSizeLocation: WebGLUniformLocation | null;
  private _tilesetSizeLocation: WebGLUniformLocation | null;
  private _tintLocation: WebGLUniformLocation | null;
  private _textureRenderer: TextureRenderer;

  private _vao: Vao | null;
  private _positionBuffer: WebGLBuffer | null;
  private _positions: number[];
  private _tilemapTexture: WebGLTexture | null;

  constructor(
    gl: Context,
    shaders: ShaderStore,
    tileset: WebGLTexture,
    tilesetShape: [number, number],
    tilesize: number,
    map: Tile[][],
    tint: [number, number, number, number] = [1, 1, 1, 1]
  ) {
    this._textureRenderer = new TextureRenderer(gl, shaders);
    this._tileset = tileset;
    this._tilesetWidth = tilesetShape[0];
    this._tilesetHeight = tilesetShape[1];
    this._tilesize = tilesize;
    this._map = map;
    this._tint = tint;

    this._program = shaders.getShader(Shaders.Tilemap)!;
    this._vao = createVAO(gl);
    this._positionLocation = gl.getAttribLocation(this._program, "a_position");
    this._positionBuffer = gl.createBuffer();

    gl.vertexAttribPointer(
      this._positionLocation,
      2,
      GLConstants.FLOAT,
      false,
      0,
      0
    );
    gl.bindBuffer(GLConstants.ARRAY_BUFFER, this._positionBuffer);
    gl.enableVertexAttribArray(this._positionLocation);

    this.mapWidth = map[0].length;
    this.mapHeight = map.length;
    this.width = this.mapWidth * this._tilesize;
    this.height = this.mapHeight * this._tilesize;
    this._matrixLocation = gl.getUniformLocation(this._program, "u_matrix");
    this._texMatrixLocation = gl.getUniformLocation(
      this._program,
      "u_texMatrix"
    );
    this._tilemapLocation = gl.getUniformLocation(this._program, "u_tilemap");
    this._tilesetLocation = gl.getUniformLocation(this._program, "u_tiles");
    this._tilemapSizeLocation = gl.getUniformLocation(
      this._program,
      "u_tilemapSize"
    );
    this._tilesetSizeLocation = gl.getUniformLocation(
      this._program,
      "u_tilesetSize"
    );
    this._tintLocation = gl.getUniformLocation(this._program, "u_tint");
    gl.bindBuffer(GLConstants.ARRAY_BUFFER, this._positionBuffer);
    this._positions = [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1];
    gl.bufferData(
      GLConstants.ARRAY_BUFFER,
      new Float32Array(this._positions),
      GLConstants.STATIC_DRAW
    );
    this._tilemapTexture = this.getTilemapTexture(gl);
  }

  getTilemapTexture(gl: Context): WebGLTexture | null {
    let tm = new Uint32Array(this.width * this.height);
    let tilemapU8 = new Uint8Array(tm.buffer);
    let i = 0;
    for (let row of this._map) {
      for (let tile of row) {
        const off = i * 4;
        tilemapU8[off + 0] = tile.u;
        tilemapU8[off + 1] = tile.v;
        tilemapU8[off + 3] = tile.flags();
        i++;
      }
      i += this.width - this.mapWidth;
    }
    
    return createAndSetupTexture(gl, {
      wrap: GLConstants.REPEAT,
      filter: GLConstants.NEAREST,
      format: GLConstants.RGBA,
      width: this.width,
      height: this.height,
      pixels: tilemapU8,
    });
  }

  render(
    gl: Context,
    source: Framebuffer,
    destination: Framebuffer,
    scrollX?: number,
    scrollY?: number
  ): void {
    this._textureRenderer.render(gl, source.texture!, destination.framebuffer);
    gl.useProgram(this._program);
    bindVAO(gl, this._vao!);
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    const mat = new Float32Array(16);
    orthographic(0, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, -1, 1, mat);
    scale(mat, gl.drawingBufferWidth, gl.drawingBufferHeight, 1, mat);

    const scaleX = 1;
    const scaleY = 1;
    const dispScaleX = 1;
    const dispScaleY = 1;
    const originX = gl.drawingBufferWidth * 0.5;
    const originY = gl.drawingBufferHeight * 0.5;
    scrollX = scrollX || 0;
    scrollY = scrollY || 0;
    const rotation = 0;

    let tmat = identity(dst);
    translate(tmat, scrollX, scrollY, 0, tmat);
    zRotate(tmat, rotation, tmat);
    scale(
      tmat,
      (gl.drawingBufferWidth / this._tilesize / scaleX) * dispScaleX,
      (gl.drawingBufferHeight / this._tilesize / scaleY) * dispScaleY,
      1,
      tmat
    );
    translate(
      tmat,
      -originX / gl.drawingBufferWidth,
      -originY / gl.drawingBufferHeight,
      0,
      tmat
    );

    gl.uniformMatrix4fv(this._matrixLocation, false, mat);
    gl.uniformMatrix4fv(this._texMatrixLocation, false, tmat);

    const texUnit = 1;
    gl.uniform1i(this._tilemapLocation, texUnit);
    gl.activeTexture(GLConstants.TEXTURE0 + texUnit);
    gl.bindTexture(GLConstants.TEXTURE_2D, this._tilemapTexture);

    gl.uniform1i(this._tilesetLocation, texUnit + 1);
    gl.activeTexture(GLConstants.TEXTURE0 + texUnit + 1);
    gl.bindTexture(GLConstants.TEXTURE_2D, this._tileset);

    gl.uniform2f(
      this._tilemapSizeLocation,
      this.mapWidth * this._tilesize,
      this.mapHeight * this._tilesize
    );
    gl.uniform2f(
      this._tilesetSizeLocation,
      this._tilesetWidth,
      this._tilesetHeight
    );

    gl.uniform4f(
      this._tintLocation,
      this._tint[0],
      this._tint[1],
      this._tint[2],
      this._tint[3]
    );
    gl.drawArrays(GLConstants.TRIANGLES, 0, 6);
  }
}

export function getTileData(
  size: number,
  color: [number, number, number, number]
): Uint8Array {
  let length = size * size * 4;
  let textureData = new Uint8Array(length);

  for (let i = 0; i < length; i += 4) {
    textureData[i] = color[0];
    textureData[i + 1] = color[1];
    textureData[i + 2] = color[2];
    textureData[i + 3] = color[3];
  }
  return textureData;
}

export function getTileAtlas(
  tilesize: number,
  tiles: Uint8Array[]
): Uint8Array {
  let size = tilesize * tilesize * tiles.length * 4;
  let width = tilesize * tiles.length;
  let tileatlas = new Uint8Array(size);
  for (let i = 0; i < size; i += 4) {
    const offset = i / 4;
    const column = offset % width;
    const row = (offset / width) | 0;
    const tileIndex = (column / tilesize) | 0;
    const tile = tiles[tileIndex];
    const tileColumn = column % tilesize;
    const tilePixel = (tileColumn + row * tilesize) * 4;
    tileatlas[i] = tile[tilePixel];
    tileatlas[i + 1] = tile[tilePixel + 1];
    tileatlas[i + 2] = tile[tilePixel + 2];
    tileatlas[i + 3] = tile[tilePixel + 3];
  }

  return tileatlas;
}

export function getTileMap(gl: Context, shaders: ShaderStore) {
  let tilesize = 32;
  let tiles = [
    getTileData(tilesize, [0, 0, 0, 0]),
    getTileData(tilesize, [0, 0, 255, 255]),
    getTileData(tilesize, [0, 255, 0, 255]),
    getTileData(tilesize, [255, 255, 255, 255]),
    getTileData(tilesize, [0, 0, 0, 0]),
    getTileData(tilesize, [0, 0, 0, 0]),
    getTileData(tilesize, [0, 0, 0, 0]),
    getTileData(tilesize, [0, 0, 0, 0]),
  ];
  let tileAtlas = getTileAtlas(tilesize, tiles);
  let shape: [number, number] = [tiles.length, 1];
  let water = new Tile([1, 0], false, false, false);
  let grass = new Tile([2, 0], false, false, false);
  let ice = new Tile([3, 0], false, false, false);
  let wall = new Tile([3, 0], false, false, false);
  let tm = [
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
    [
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
      wall,
    ],
  ];

  const texture = createAndSetupTexture(gl, {
    wrap: GLConstants.REPEAT,
    filter: GLConstants.LINEAR,
    format: GLConstants.RGBA,
    width: tilesize * tiles.length,
    height: tilesize,
    pixels: tileAtlas,
  });
  return new TilemapRenderer(gl, shaders, texture, shape, tilesize, tm);
}

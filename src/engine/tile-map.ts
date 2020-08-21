import { IRenderable } from "./renderable";
import {
  createProgram,
  Context,
  bindVAO,
  createVAO,
  Vao,
  createAndSetupTexture,
} from "./gl/util";
import { orthographic, scale, identity, translate, zRotate } from "./math/m4";
import { Framebuffer } from "./gl/framebuffer";
import { TextureRenderer } from "./gl/renderers/texture-renderer";
import { ShaderStore } from "./gl/shaders/shaders";
import { GLConstants } from "./gl/constants";

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

export class TileMap implements IRenderable {
  private tileset: WebGLTexture;
  private tilesetWidth: number;
  private tilesetHeight: number;
  private tilesize: number;
  private map: Tile[][];
  private tint: [number, number, number, number];
  public mapWidth: number;
  public mapHeight: number;
  public width: number;
  public height: number;
  public renderResult?: Framebuffer;
  private program: WebGLProgram;
  private positionLocation: number;
  private matrixLocation: WebGLUniformLocation | null;
  private texMatrixLocation: WebGLUniformLocation | null;
  private tilemapLocation: WebGLUniformLocation | null;
  private tilesetLocation: WebGLUniformLocation | null;
  private tilemapSizeLocation: WebGLUniformLocation | null;
  private tilesetSizeLocation: WebGLUniformLocation | null;
  private tintLocation: WebGLUniformLocation | null;
  private textureRenderer: TextureRenderer;

  private vao: Vao | null;
  private positionBuffer: WebGLBuffer | null;
  private positions: number[];
  private tilemapTexture: WebGLTexture | null;

  constructor(
    gl: Context,
    shaders: ShaderStore,
    tileset: WebGLTexture,
    tilesetShape: [number, number],
    tilesize: number,
    map: Tile[][],
    tint: [number, number, number, number] = [1, 1, 1, 1]
  ) {
    this.textureRenderer = new TextureRenderer(gl, shaders);
    this.tileset = tileset;
    this.tilesetWidth = tilesetShape[0];
    this.tilesetHeight = tilesetShape[1];
    this.tilesize = tilesize;
    this.map = map;
    this.tint = tint;

    this.program = shaders.getShader("tilemap")!;
    this.vao = createVAO(gl);
    this.positionLocation = gl.getAttribLocation(this.program, "a_position");
    this.positionBuffer = gl.createBuffer();

    gl.vertexAttribPointer(this.positionLocation, 2, GLConstants.FLOAT, false, 0, 0);
    gl.bindBuffer(GLConstants.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.positionLocation);

    this.mapWidth = map[0].length;
    this.mapHeight = map.length;
    this.width = this.mapWidth * this.tilesize;
    this.height = this.mapHeight * this.tilesize;
    this.matrixLocation = gl.getUniformLocation(this.program, "u_matrix");
    this.texMatrixLocation = gl.getUniformLocation(this.program, "u_texMatrix");
    this.tilemapLocation = gl.getUniformLocation(this.program, "u_tilemap");
    this.tilesetLocation = gl.getUniformLocation(this.program, "u_tiles");
    this.tilemapSizeLocation = gl.getUniformLocation(
      this.program,
      "u_tilemapSize"
    );
    this.tilesetSizeLocation = gl.getUniformLocation(
      this.program,
      "u_tilesetSize"
    );
    this.tintLocation = gl.getUniformLocation(this.program, "u_tint");
    gl.bindBuffer(GLConstants.ARRAY_BUFFER, this.positionBuffer);
    this.positions = [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1];
    gl.bufferData(
      GLConstants.ARRAY_BUFFER,
      new Float32Array(this.positions),
      GLConstants.STATIC_DRAW
    );
    this.tilemapTexture = this.getTilemapTexture(gl);
  }

  getTilemapTexture(gl: Context): WebGLTexture | null {
    let tm = new Uint32Array(this.width * this.height);
    let tilemapU8 = new Uint8Array(tm.buffer);
    let i = 0;
    for (let row of this.map) {
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
    this.textureRenderer.render(gl, source.texture!, destination.framebuffer);
    gl.useProgram(this.program);
    bindVAO(gl, this.vao!);
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const mat = new Float32Array(16);
    orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1, mat);
    scale(mat, gl.canvas.width, gl.canvas.height, 1, mat);

    const scaleX = 1;
    const scaleY = 1;
    const dispScaleX = 1;
    const dispScaleY = 1;
    const originX = gl.canvas.width * 0.5;
    const originY = gl.canvas.height * 0.5;
    scrollX = scrollX || 0;
    scrollY = scrollY || 0;
    const rotation = 0;

    let tmat = identity(dst);
    translate(tmat, scrollX, scrollY, 0, tmat);
    zRotate(tmat, rotation, tmat);
    scale(
      tmat,
      (gl.canvas.width / this.tilesize / scaleX) * dispScaleX,
      (gl.canvas.height / this.tilesize / scaleY) * dispScaleY,
      1,
      tmat
    );
    translate(
      tmat,
      -originX / gl.canvas.width,
      -originY / gl.canvas.height,
      0,
      tmat
    );

    gl.uniformMatrix4fv(this.matrixLocation, false, mat);
    gl.uniformMatrix4fv(this.texMatrixLocation, false, tmat);

    const texUnit = 1;
    gl.uniform1i(this.tilemapLocation, texUnit);
    gl.activeTexture(GLConstants.TEXTURE0 + texUnit);
    gl.bindTexture(GLConstants.TEXTURE_2D, this.tilemapTexture);

    gl.uniform1i(this.tilesetLocation, texUnit + 1);
    gl.activeTexture(GLConstants.TEXTURE0 + texUnit + 1);
    gl.bindTexture(GLConstants.TEXTURE_2D, this.tileset);

    gl.uniform2f(
      this.tilemapSizeLocation,
      this.mapWidth * this.tilesize,
      this.mapHeight * this.tilesize
    );
    gl.uniform2f(
      this.tilesetSizeLocation,
      this.tilesetWidth,
      this.tilesetHeight
    );

    gl.uniform4f(
      this.tintLocation,
      this.tint[0],
      this.tint[1],
      this.tint[2],
      this.tint[3]
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
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
  ];

  const texture = createAndSetupTexture(gl, {
    wrap: GLConstants.REPEAT,
    filter: GLConstants.LINEAR,
    format: GLConstants.RGBA,
    width: tilesize * tiles.length,
    height: tilesize,
    pixels: tileAtlas,
  });
  return new TileMap(gl, shaders, texture, shape, tilesize, tm);
}

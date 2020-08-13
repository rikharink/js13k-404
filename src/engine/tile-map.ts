import vertexSource from "./gl/shaders/tilemap.vert";
import fragmentSource from "./gl/shaders/tilemap.frag";
import { createProgram } from "./gl/util";
import { orthographic, scale, identity, translate, zRotate } from "./math/m4";

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

export class TileMap {
  private gl: WebGL2RenderingContext;
  private tileset: WebGLTexture;
  private tilesetWidth: number;
  private tilesetHeight: number;
  private tilesize: number;
  private map: Tile[][];
  private tint: [number, number, number, number];
  public  mapWidth: number;
  public mapHeight: number;
  public width: number;
  public height: number;
  private program: WebGLProgram;
  private positionLocation: number;
  private matrixLocation: WebGLUniformLocation | null;
  private texMatrixLocation: WebGLUniformLocation | null;
  private tilemapLocation: WebGLUniformLocation | null;
  private tilesetLocation: WebGLUniformLocation | null;
  private tilemapSizeLocation: WebGLUniformLocation | null;
  private tilesetSizeLocation: WebGLUniformLocation | null;
  private tintLocation: WebGLUniformLocation | null;
  private vao: WebGLVertexArrayObject | null;
  private positionBuffer: WebGLBuffer | null;
  private positions: number[];
  private tilemapTexture: WebGLTexture | null;

  constructor(
    gl: WebGL2RenderingContext,
    tileset: WebGLTexture,
    tilesetShape: [number, number],
    tilesize: number,
    map: Tile[][],
    tint: [number, number, number, number] = [1, 1, 1, 1]
  ) {
    this.gl = gl;
    this.tileset = tileset;
    this.tilesetWidth = tilesetShape[0];
    this.tilesetHeight = tilesetShape[1];
    this.tilesize = tilesize;
    this.map = map;
    this.tint = tint;

    this.mapWidth = map[0].length;
    this.mapHeight = map.length;
    this.width = this.mapWidth * this.tilesize;
    this.height = this.mapHeight * this.tilesize;
    this.program = createProgram(gl, vertexSource, fragmentSource);
    this.positionLocation = gl.getAttribLocation(this.program, "a_position");
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
    this.vao = this.gl.createVertexArray();
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.positions = [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1];
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(this.positions),
      this.gl.STATIC_DRAW
    );
    this.tilemapTexture = this.getTilemapTexture();
  }

  getTilemapTexture(): WebGLTexture | null {
    let gl = this.gl;
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
    const texture = this.gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.width,
      this.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      tilemapU8
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return texture;
  }

  render(scrollX?: number, scrollY?: number) {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(
      this.positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(this.vao);
    let mat = new Float32Array(16);
    orthographic(0, this.gl.canvas.width, this.gl.canvas.height, 0, -1, 1, mat);
    scale(mat, this.gl.canvas.width, this.gl.canvas.height, 1, mat);

    const scaleX = 1;
    const scaleY = 1;
    const dispScaleX = 1;
    const dispScaleY = 1;
    const originX = this.gl.canvas.width * 0.5;
    const originY = this.gl.canvas.height * 0.5;
    scrollX = scrollX || 0;
    scrollY = scrollY || 0;
    const rotation = 0;

    let tmat = identity(dst);
    translate(tmat, scrollX, scrollY, 0, tmat);
    zRotate(tmat, rotation, tmat);
    scale(
      tmat,
      (this.gl.canvas.width / this.tilesize / scaleX) * dispScaleX,
      (this.gl.canvas.height / this.tilesize / scaleY) * dispScaleY,
      1,
      tmat
    );
    translate(
      tmat,
      -originX / this.gl.canvas.width,
      -originY / this.gl.canvas.height,
      0,
      tmat
    );
    this.gl.uniformMatrix4fv(this.matrixLocation, false, mat);
    this.gl.uniformMatrix4fv(this.texMatrixLocation, false, tmat);

    this.gl.uniform1i(this.tilemapLocation, 0);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tilemapTexture);

    this.gl.uniform1i(this.tilesetLocation, 1);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileset);

    this.gl.uniform2f(
      this.tilemapSizeLocation,
      this.mapWidth * this.tilesize,
      this.mapHeight * this.tilesize
    );
    this.gl.uniform2f(
      this.tilesetSizeLocation,
      this.tilesetWidth,
      this.tilesetHeight
    );

    this.gl.uniform4f(
      this.tintLocation,
      this.tint[0],
      this.tint[1],
      this.tint[2],
      this.tint[3]
    );

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}

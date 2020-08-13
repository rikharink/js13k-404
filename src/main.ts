import { GameSprite } from './engine/sprite';
import "./style/main.css";
import { setupCanvas } from "./engine/util";
import { TileMap, Tile } from "./engine/tile-map";
import { Mask, Sprite} from "./engine/procgen/pixel-sprite";
import { createProgram } from "./engine/gl/util";
import spriteVertex from "./engine/gl/shaders/colored-texture.vert";
import spriteFragment from "./engine/gl/shaders/colored-texture.frag";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2");

let tilemap: TileMap;
let spaceshipSprite: GameSprite;

function gameloop(now: number) {
  requestAnimationFrame(gameloop);
  setupCanvas(gl!, now);
  // tilemap.render(tilemap.mapWidth / 2 | 0, tilemap.mapHeight / 2 | 0);
  spaceshipSprite.render(now);
}

function getTileData(
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

function getTileAtlas(tilesize: number, tiles: Uint8Array[]): Uint8Array {
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

function main() {
  if (!gl) {
    return;
  }
  let tilesize = 32;
  let tiles = [
    getTileData(tilesize, [0, 0, 0, 0]),
    getTileData(tilesize, [0, 0, 255, 255]),
    getTileData(tilesize, [0, 255, 0, 255]),
    getTileData(tilesize, [255, 255, 255, 255]),
    getTileData(tilesize, [0, 0, 0, 255]),
  ];
  let tileAtlas = getTileAtlas(tilesize, tiles);
  let shape: [number, number] = [tiles.length, 1];
  let water = new Tile([1, 0], false, false, false);
  let grass = new Tile([2, 0], false, false, false);
  let ice = new Tile([3, 0], false, false, false);
  let wall = new Tile([4, 0], false, false, false);
  let tm = [
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
    [wall, water, water, water, water, water, water, water, water, water, water, wall],
    [wall, water, water, water, water, water, water, water, water, water, water, wall],
    [wall, water, water, grass, grass, grass, grass, grass, grass, water, water, wall],
    [wall, water, water, grass, ice, ice, ice, ice, grass, water, water, wall],
    [wall, water, water, grass, grass, grass, grass, grass, grass, water, water, wall],
    [wall, water, water, water, water, water, water, water, water, water, water, wall],
    [wall, water, water, water, water, water, water, water, water, water, water, wall],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
  ];

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    tilesize * tiles.length,
    tilesize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    tileAtlas
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  tilemap = new TileMap(gl, texture!, shape, tilesize, tm);


  const spaceship = new Mask([
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 1,
    0, 0, 0, 0, 1,-1,
    0, 0, 0, 1, 1,-1,
    0, 0, 0, 1, 1,-1,
    0, 0, 1, 1, 1,-1,
    0, 1, 1, 1, 2, 2,
    0, 1, 1, 1, 2, 2,
    0, 1, 1, 1, 2, 2,
    0, 1, 1, 1, 1,-1,
    0, 0, 0, 1, 1, 1,
    0, 0, 0, 0, 0, 0
], 6, 12, true, false);

  const sprite = new Sprite(spaceship, {colored : true});
  const shader = createProgram(gl, spriteVertex, spriteFragment);
  spaceshipSprite = new GameSprite(gl, shader, sprite.canvas, [0, 0], [12, 12], 0, [1, 1, 1, 1], 0);
  spaceshipSprite.prepare();
  requestAnimationFrame(gameloop);
}

main();

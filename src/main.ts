import "./style/main.css";
import { Background } from './background';
import { Scene } from './engine/scene';
import { setupCanvas } from "./engine/util";
import { TileMap, Tile, getTileData, getTileAtlas } from "./engine/tile-map";
import { Context, getContext } from "./engine/gl/util";


const canvas = document.getElementById("game") as HTMLCanvasElement;
const gl = getContext(canvas);

let scene: Scene;

function gameloop(now: number) {
  requestAnimationFrame(gameloop);
  setupCanvas(gl!, now);
  scene.render(now);
}

function getTileMap(gl: Context){
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
    [
      wall,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      wall,
    ],
    [
      wall,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      wall,
    ],
    [
      wall,
      water,
      water,
      grass,
      grass,
      grass,
      grass,
      grass,
      grass,
      water,
      water,
      wall,
    ],
    [wall, water, water, grass, ice, ice, ice, ice, grass, water, water, wall],
    [
      wall,
      water,
      water,
      grass,
      grass,
      grass,
      grass,
      grass,
      grass,
      water,
      water,
      wall,
    ],
    [
      wall,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      wall,
    ],
    [
      wall,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      water,
      wall,
    ],
    [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
  ];

  const texture = gl.createTexture()!;
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
  return new TileMap(gl, texture, shape, tilesize, tm);
}

function getBackground(gl: Context): Background{
  return new Background(gl, gl.canvas.width, gl.canvas.height);
}

function main() {
  if (!gl) {
    return;
  }
  scene = new Scene(gl, gl.canvas.width, gl.canvas.height);
  scene.background = getBackground(gl);
  scene.tilemap = getTileMap(gl);
  requestAnimationFrame(gameloop);
}

main();

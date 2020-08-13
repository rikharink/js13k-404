import "./style/main.css";
import { setupCanvas } from "./engine/smoll";
import tiles from "./img/floortileset.png";
import { TileMap, Tile } from "./engine/tile-map";
import { randomInt } from "./engine/math/util";

const canvas = document.getElementById("game");
const gl = canvas.getContext("webgl2");
let tilemap;

function gameloop(now) {
  requestAnimationFrame(gameloop);
  setupCanvas(gl, now, tilemap.width, tilemap.height);
  tilemap.render();
}

function main() {
  const tilesetImage = new Image();
  tilesetImage.onload = () => {
    const texture = gl.createTexture();
    let shape = [
      tilesetImage.naturalWidth / 32,
      tilesetImage.naturalHeight / 32,
    ];
    let water = new Tile([3, 5], false, false, false);
    let grass = new Tile([1, 2], false, false, false);
    let ice = new Tile([1, 1], false, false, false);
    let tm = [
      [water, water, water, water, water, water, water, water, water, water],
      [water, water, water, water, water, water, water, water, water, water],
      [water, water, grass, grass, grass, grass, grass, grass, water, water],
      [water, water, grass, ice, ice, ice, ice, grass, water, water],
      [water, water, grass, grass, grass, grass, grass, grass, water, water],
      [water, water, water, water, water, water, water, water, water, water],
      [water, water, water, water, water, water, water, water, water, water],
    ];
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      tilesetImage
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    tilemap = new TileMap(gl, texture, shape, 32, tm);
    requestAnimationFrame(gameloop);
  };
  tilesetImage.src = tiles;
}

main();

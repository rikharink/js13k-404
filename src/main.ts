// import "./index.html";
import "./style/main.css";
import { Game } from "./game";
import { getContext } from "./engine/gl/util";

const canvas: HTMLCanvasElement = document.getElementById(
  "g"
) as HTMLCanvasElement;
const gl = getContext(canvas);
const game = new Game(gl);
requestAnimationFrame(game.gameloop.bind(game));

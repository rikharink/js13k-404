import "./style/main.css";
import { Game } from "./game";
import { getContext } from "./engine/gl/util";

const canvas: HTMLCanvasElement = document.getElementById(
  "game"
) as HTMLCanvasElement;
const gl = getContext(canvas);
const game = new Game(gl);
requestAnimationFrame(game.gameloop.bind(game));

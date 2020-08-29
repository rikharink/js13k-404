import { Settings } from './settings';
import "./style/main.css";
import { SoundContext } from "./engine/sound/util";
import { Game } from "./game";
import { getContext } from "./engine/gl/util";

const canvas: HTMLCanvasElement = document.getElementById(
  "g"
) as HTMLCanvasElement;
const gl = getContext(canvas);
const settings = new Settings();
const game = new Game(gl, settings);
let audioContext: SoundContext | undefined = undefined;

requestAnimationFrame(game.gameloop.bind(game));

const setupSound = () => {
  audioContext = new AudioContext();
};

document.addEventListener("click", setupSound);

const DEBUG_MODE = true;
import { updateDebugInfo } from "./debug/index";

let then = 0;

export function resizeCanvasToDisplaySize(canvas, multiplier) {
  multiplier = multiplier || 1;
  const width = canvas.clientWidth * multiplier | 0;
  const height = canvas.clientHeight * multiplier | 0;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
};

export function randColor() {
  return [Math.random(), Math.random(), Math.random(), 1];
}

export function setupCanvas(gl, now, width, height) {
  now *= 0.001;
  const deltaTime = now - then;
  then = now;
  if (DEBUG_MODE) {
    updateDebugInfo(deltaTime);
  }
  if (resizeCanvasToDisplaySize(gl.canvas)) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }
  gl.canvas.width = width;
  gl.canvas.height = height;
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

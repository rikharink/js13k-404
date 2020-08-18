import { Context } from './../gl/util';
let debug: HTMLDivElement | undefined;
let avgFPS = 60;
let alpha = 0.9;
let dt = 0;
let fpsText = "";

export function updateDebugInfo(deltaTime: number, gl: Context) {
  if (!debug) {
    debug = document.createElement("div");
    debug.id = "debug";
    debug.style.position = "absolute";
    debug.style.top = "8px";
    debug.style.left = "8px";
    document.body.appendChild(debug);
  }
  dt += deltaTime;
  avgFPS = alpha * avgFPS + (1.0 - alpha) * (1 / deltaTime);
  if (dt > 1) {
    dt = 0;
    fpsText = `${avgFPS.toFixed(1)} fps`;
  }

  debug.innerText = `${fpsText}
  context = ${gl instanceof WebGLRenderingContext ? "webgl" : gl instanceof WebGL2RenderingContext ? "webgl2" : "?"}
  extension = ${!!gl.getExtension("OES_vertex_array_object")}
  `;
}

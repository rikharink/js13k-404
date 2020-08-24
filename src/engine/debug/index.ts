import { Context } from "./../gl/util";
import { GLConstants } from "../gl/constants";

declare global {
  interface Window {
    DebugDump: any;
  }
}

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
    debug.style.backgroundColor = "#FFFFFFD0";
    debug.style.border = "2px solid black";
    debug.style.borderRadius = "4px";
    debug.style.padding = "16px 16px";

    document.body.appendChild(debug);
  }
  dt += deltaTime;
  avgFPS = alpha * avgFPS + (1.0 - alpha) * (1 / deltaTime);
  if (dt > 1) {
    dt = 0;
    fpsText = `${avgFPS.toFixed(1)} fps`;
  }
  debug.innerText = `${fpsText}`;
}

export function createImageFromTexture(
  gl: Context,
  texture: WebGLTexture,
  width: number,
  height: number
): HTMLImageElement {
  // Create a framebuffer backed by the texture
  let framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(GLConstants.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    GLConstants.FRAMEBUFFER,
    GLConstants.COLOR_ATTACHMENT0,
    GLConstants.TEXTURE_2D,
    texture,
    0
  );

  // Read the contents of the framebuffer
  let data = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, GLConstants.RGBA, GLConstants.UNSIGNED_BYTE, data);

  gl.deleteFramebuffer(framebuffer);

  // Create a 2D canvas to store the result
  let canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let context = canvas.getContext("2d")!;

  // Copy the pixels to a 2D canvas
  let imageData = context.createImageData(width, height);
  imageData.data.set(data);
  context.putImageData(imageData, 0, 0);

  let img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

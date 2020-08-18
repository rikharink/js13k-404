const DEBUG_MODE = true;
import { updateDebugInfo } from "./debug/index";
import { Context } from "./gl/util";

let then = 0;

export function createBitmap(width: number, height: number, data: Uint8ClampedArray) {
  const header_size = 70;
  const image_size = width * height * 4;

  const header = new Uint8Array(header_size);
  const view = new DataView(header.buffer);

  // File Header

  // BM magic number.
  view.setUint16(0, 0x424d, false);
  // File size.
  view.setUint32(2, header.length, true);
  // Offset to image data.
  view.setUint32(10, header_size, true);

  // BITMAPINFOHEADER

  // Size of BITMAPINFOHEADER
  view.setUint32(14, 40, true);
  // Width
  view.setInt32(18, width, true);
  // Height (signed because negative values flip
  // the image vertically).
  view.setInt32(22, height, true);
  // Number of colour planes (colours stored as
  // separate images; must be 1).
  view.setUint16(26, 1, true);
  // Bits per pixel.
  view.setUint16(28, 32, true);
  // Compression method, 6 = BI_ALPHABITFIELDS
  view.setUint32(30, 6, true);
  // Image size in bytes.
  view.setUint32(34, image_size, true);
  // Horizontal resolution, pixels per metre.
  // This will be unused in this situation.
  view.setInt32(38, 10000, true);
  // Vertical resolution, pixels per metre.
  view.setInt32(42, 10000, true);
  // Number of colours. 0 = all
  view.setUint32(46, 0, true);
  // Number of important colours. 0 = all
  view.setUint32(50, 0, true);

  // Colour table. Because we used BI_ALPHABITFIELDS
  // this specifies the R, G, B and A bitmasks.

  // Red
  view.setUint32(54, 0x000000ff, true);
  // Green
  view.setUint32(58, 0x0000ff00, true);
  // Blue
  view.setUint32(62, 0x00ff0000, true);
  // Alpha
  view.setUint32(66, 0xff000000, true);

  const blob = new Blob([header, data], { type: "image/bmp" });
  const url = window.URL.createObjectURL(blob);
  const img = document.createElement("img");
  img.src = url;
  return img;
}

export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  multiplier?: number
) {
  multiplier = multiplier || 1;
  const width = (canvas.clientWidth * multiplier) | 0;
  const height = (canvas.clientHeight * multiplier) | 0;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

export function randomColor() {
  return [Math.random(), Math.random(), Math.random(), 1];
}

export function setupCanvas(gl: Context, now: number) {
  now *= 0.001;
  const deltaTime = now - then;
  then = now;
  if (DEBUG_MODE) {
    updateDebugInfo(deltaTime);
  }
  if (resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

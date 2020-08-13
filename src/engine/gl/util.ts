import { orthographic, translate, scale, translation } from "../math/m4";

const dst = new Float32Array(16);

export function drawImage(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  vao: WebGLVertexArrayObject,
  textureLocation: WebGLUniformLocation,
  matrixLocation: WebGLUniformLocation,
  textureMatrixLocation: WebGLUniformLocation,
  colorLocation: WebGLUniformLocation,
  tex: WebGLTexture,
  texWidth: number,
  texHeight: number,
  srcX: number,
  srcY: number,
  srcWidth: number,
  srcHeight: number,
  dstX: number,
  dstY: number,
  dstWidth: number,
  dstHeight: number,
  tint: [number, number, number, number]
) {
  if (dstX === undefined) {
    dstX = srcX;
    srcX = 0;
  }
  if (dstY === undefined) {
    dstY = srcY;
    srcY = 0;
  }
  if (srcWidth === undefined) {
    srcWidth = texWidth;
  }
  if (srcHeight === undefined) {
    srcHeight = texHeight;
  }
  if (dstWidth === undefined) {
    dstWidth = srcWidth;
    srcWidth = texWidth;
  }
  if (dstHeight === undefined) {
    dstHeight = srcHeight;
    srcHeight = texHeight;
  }
  if (tint === undefined) {
    tint = [1, 1, 1, 1];
  }
  gl.useProgram(program);
  gl.bindVertexArray(vao);
  const textureUnit = 0;
  gl.uniform1i(textureLocation, textureUnit);
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  let canvas = gl.canvas as HTMLCanvasElement;
  let matrix = orthographic(
    0,
    canvas.clientWidth,
    canvas.clientHeight,
    0,
    -1,
    1,
    dst
  );
  translate(matrix, dstX, dstY, 0, matrix);
  scale(matrix, dstWidth, dstHeight, 1, matrix);
  gl.uniformMatrix4fv(matrixLocation, false, matrix);
  let texMatrix = new Float32Array(16);
  translation(srcX / texWidth, srcY / texHeight, 0, texMatrix);
  scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1, texMatrix);
  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);
  gl.uniform4f(colorLocation, tint[0], tint[1], tint[2], tint[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  gl.shaderSource(shader!, source);
  gl.compileShader(shader!);
  const success = gl.getShaderParameter(shader!, gl.COMPILE_STATUS);
  if (success) {
    return shader!;
  }

  console.error(gl.getShaderInfoLog(shader!));
  gl.deleteShader(shader);
  throw new Error("couldn't create shader");
}

export function createProgram(
  gl: WebGL2RenderingContext,
  sourceVertex: string,
  sourceFragment: string
): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, sourceVertex);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, sourceFragment);
  const program = gl.createProgram();
  gl.attachShader(program!, vertexShader);
  gl.attachShader(program!, fragmentShader);
  gl.linkProgram(program!);
  const success = gl.getProgramParameter(program!, gl.LINK_STATUS);
  if (success) {
    return program!;
  }

  console.error(gl.getProgramInfoLog(program!));
  gl.deleteProgram(program);
  throw Error("couldn't create program");
}

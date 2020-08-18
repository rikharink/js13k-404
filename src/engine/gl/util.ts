import { orthographic, translate, scale, translation } from "../math/m4";

const dst = new Float32Array(16);

export type Context = WebGLRenderingContext | WebGL2RenderingContext;
export type Vao = WebGLVertexArrayObject | WebGLVertexArrayObjectOES;

export function getContext(canvas: HTMLCanvasElement): Context {
  let gl = canvas.getContext("webgl2");
  if (gl) {
    return gl;
  } else {
    return canvas.getContext("webgl")!;
  }
}

export function createVertexArray(gl: Context): Vao | null {
  if (gl instanceof WebGLRenderingContext) {
    const oes = gl.getExtension("OES_vertex_array_object");
    return oes?.createVertexArrayOES()!;
  } else {
    return gl.createVertexArray();
  }
}

export function bindVertexArray(gl: Context, vao: Vao) {
  if (gl instanceof WebGLRenderingContext) {
    const oes = gl.getExtension("OES_vertex_array_object");
    if (oes) {
      oes.bindVertexArrayOES(vao);
    }
  } else if (gl instanceof WebGL2RenderingContext) {
    gl.bindVertexArray(vao);
  }
}

export function drawImage(
  gl: Context,
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
  bindVertexArray(gl, vao);
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
  gl: Context,
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
  gl: Context,
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

export function setFramebuffer(
  gl: Context,
  resolutionLocation: WebGLUniformLocation | null,
  fbo: WebGLFramebuffer | null,
  width: number,
  height: number
) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  if (resolutionLocation) {
    gl.uniform2f(resolutionLocation, width, height);
  }
  gl.viewport(0, 0, width, height);
}

export function createAndSetupTexture(gl: Context) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture!;
}

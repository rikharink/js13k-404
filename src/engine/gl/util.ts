import { GLConstants } from "./constants";

export type Context = WebGLRenderingContext;
export type Vao = WebGLVertexArrayObject;

const dst = new Float32Array(16);
let oes: OES_vertex_array_object | undefined;

export function getContext(canvas: HTMLCanvasElement): Context {
  return canvas.getContext("webgl")!;
}

export function createVAO(gl: Context): Vao | null {
  if (!oes) {
    oes = gl.getExtension("OES_vertex_array_object")!;
  }
  return oes.createVertexArrayOES()!;
}

export function bindVAO(gl: Context, vao: Vao | null) {
  if (!oes) {
    oes = gl.getExtension("OES_vertex_array_object")!;
  }
  oes.bindVertexArrayOES(vao);
}

export function createShader(
  gl: Context,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  gl.shaderSource(shader!, source);
  gl.compileShader(shader!);
  return shader!;
}

export function createProgram(
  gl: Context,
  sourceVertex: string,
  sourceFragment: string
): WebGLProgram {
  const vertexShader = createShader(
    gl,
    GLConstants.VERTEX_SHADER,
    sourceVertex
  );
  const fragmentShader = createShader(
    gl,
    GLConstants.FRAGMENT_SHADER,
    sourceFragment
  );
  const program = gl.createProgram();
  gl.attachShader(program!, vertexShader);
  gl.attachShader(program!, fragmentShader);
  gl.linkProgram(program!);
  return program!;
}

export function setFramebuffer(
  gl: Context,
  resolutionLocation: WebGLUniformLocation | null,
  fbo: WebGLFramebuffer | null,
  width: number,
  height: number
) {
  gl.bindFramebuffer(GLConstants.FRAMEBUFFER, fbo);
  if (resolutionLocation) {
    gl.uniform2f(resolutionLocation, width, height);
  }
  gl.viewport(0, 0, width, height);
}

export function createAndSetupTexture(
  gl: Context,
  opts: {
    wrap: number;
    filter: number;
    format: number;
    width: number;
    height: number;
    pixels: ArrayBufferView | Uint8Array | null;
  }
) {
  let texture = gl.createTexture();
  gl.bindTexture(GLConstants.TEXTURE_2D, texture);
  gl.texParameteri(
    GLConstants.TEXTURE_2D,
    GLConstants.TEXTURE_WRAP_S,
    opts.wrap
  );
  gl.texParameteri(
    GLConstants.TEXTURE_2D,
    GLConstants.TEXTURE_WRAP_T,
    opts.wrap
  );
  gl.texParameteri(
    GLConstants.TEXTURE_2D,
    GLConstants.TEXTURE_MIN_FILTER,
    opts.filter
  );
  gl.texParameteri(
    GLConstants.TEXTURE_2D,
    GLConstants.TEXTURE_MAG_FILTER,
    opts.filter
  );
  gl.texImage2D(
    GLConstants.TEXTURE_2D,
    0,
    opts.format,
    opts.width,
    opts.height,
    0,
    opts.format,
    GLConstants.UNSIGNED_BYTE,
    opts.pixels
  );
  return texture!;
}

export function isPowerOfTwo(x: number) {
  return (x & (x - 1)) == 0;
}

export function nextHighestPowerOfTwo(x: number) {
  --x;
  for (var i = 1; i < 32; i <<= 1) {
    x = x | (x >> i);
  }
  return x + 1;
}

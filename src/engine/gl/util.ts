import { orthographic, translate, scale, translation } from "../math/m4";

const dst = new Float32Array(16);

export type Context = WebGLRenderingContext;
export type Vao = WebGLVertexArrayObject;

export function getContext(canvas: HTMLCanvasElement): Context {
  return canvas.getContext("webgl")!;
}

export function createVertexArray(gl: Context): Vao | null {
  const oes = gl.getExtension("OES_vertex_array_object");
  return oes?.createVertexArrayOES()!;
}

export function bindVertexArray(gl: Context, vao: Vao | null) {
  const oes = gl.getExtension("OES_vertex_array_object");
  oes?.bindVertexArrayOES(vao);
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

export function generateNoiseTexture(gl: Context, rng: () => number, size: number) {
  let l = size * size * 2;
  let array = new Uint8Array(l);
  for (let i = 0; i < l; i++) {
    let rand = rng() * 2.0 * Math.PI;
    let r = [Math.cos(rand), Math.sin(rand)];
    array[i * 2 + 0] = Math.round(0.5 * (1.0 + r[0]) * 255);
    array[i * 2 + 1] = Math.round(0.5 * (1.0 + r[1]) * 255);
  }
  let texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE_ALPHA,
    size,
    size,
    0,
    gl.LUMINANCE_ALPHA,
    gl.UNSIGNED_BYTE,
    array
  );
  return texture;
}

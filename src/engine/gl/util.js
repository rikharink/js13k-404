import { orthographic, translate, scale, translation } from "../math/m4";

const dst = new Float32Array(16);

export function drawImage(gl, program, vao,
  textureLocation, matrixLocation, textureMatrixLocation, colorLocation,
  tex, texWidth, texHeight,
  srcX, srcY, srcWidth, srcHeight,
  dstX, dstY, dstWidth, dstHeight, tint) {
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
  let matrix = orthographic(0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1, dst);
  matrix = translate(matrix, dstX, dstY, 0);
  matrix = scale(matrix, dstWidth, dstHeight, 1);
  gl.uniformMatrix4fv(matrixLocation, false, matrix);
  let texMatrix = translation(srcX / texWidth, srcY / texHeight, 0);
  texMatrix = scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);
  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);
  gl.uniform4f(colorLocation, tint[0], tint[1], tint[2], tint[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

export function createProgram(gl, sourceVertex, sourceFragment) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, sourceVertex);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, sourceFragment);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.error(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

export function createProgramInfo(gl, sourceVertex, sourceFragment) {
  const program = createProgram(gl, sourceVertex, sourceFragment);
  const uniformSetters = createUniformSetters(gl, program);
  const attributeSetters = createAttributeSetters(gl, program);
  return {
    program: program,
    uniformSetters: uniformSetters,
    attributeSetters: attributeSetters
  }
}


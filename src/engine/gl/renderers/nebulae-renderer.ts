import { Framebuffer } from "../framebuffer";
import { ShaderStore } from "../shaders/shaders";
import {
  Context,
  createVAO,
  Vao,
  generateNoiseTexture,
  bindVAO,
} from "../util";

interface NebulaeOptions {
  offset: [number, number];
  scale: number;
  falloff: number;
  color: [number, number, number];
  density: number;
}

export class NebulaeRenderer {
  program: WebGLProgram;
  width: number;
  height: number;
  private _positionbuffer: WebGLBuffer;
  private _uvbuffer: WebGLBuffer;
  private _vao: Vao;
  private _attributePositionLocation: number;
  private _attributeUvLocation: number;
  private _sourceLocation: WebGLUniformLocation;
  private _offsetLocation: WebGLUniformLocation;
  private _scaleLocation: WebGLUniformLocation;
  private _falloffLocation: WebGLUniformLocation;
  private _colorLocation: WebGLUniformLocation;
  private _densityLocation: WebGLUniformLocation;
  private _noiseTexture: WebGLTexture;
  private _noiseSize: number;
  private _noiseLocation: WebGLUniformLocation | null;
  private _noiseSizeLocation: WebGLUniformLocation | null;

  constructor(gl: Context, shaders: ShaderStore, rng: () => number) {
    this.program = shaders.getShader("nebulae")!;
    this.width = gl.canvas.width;
    this.height = gl.canvas.height;
    this._vao = createVAO(gl)!;
    bindVAO(gl, this._vao);
    this._positionbuffer = gl.createBuffer()!;
    this._attributePositionLocation = gl.getAttribLocation(
      this.program,
      "a_position"
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionbuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(
      this._attributePositionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(this._attributePositionLocation);

    this._uvbuffer = gl.createBuffer()!;
    this._attributeUvLocation = gl.getAttribLocation(this.program, "a_uv");
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvbuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(this._attributeUvLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this._attributeUvLocation);

    this._sourceLocation = gl.getUniformLocation(this.program, "u_source")!;
    this._offsetLocation = gl.getUniformLocation(this.program, "u_offset")!;
    this._scaleLocation = gl.getUniformLocation(this.program, "u_scale")!;
    this._falloffLocation = gl.getUniformLocation(this.program, "u_falloff")!;
    this._colorLocation = gl.getUniformLocation(this.program, "u_color")!;
    this._densityLocation = gl.getUniformLocation(this.program, "u_density")!;
    this._noiseLocation = gl.getUniformLocation(this.program, "u_noise");
    this._noiseSizeLocation = gl.getUniformLocation(
      this.program,
      "u_noiseSize"
    );
    this._noiseSize = 256;
    this._noiseTexture = generateNoiseTexture(gl, rng, this._noiseSize);
  }

  render(
    gl: WebGLRenderingContext,
    source: Framebuffer,
    destination: Framebuffer,
    opts: NebulaeOptions
  ): Framebuffer {
    gl.useProgram(this.program);
    bindVAO(gl, this._vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const texUnit = 1;
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(this._sourceLocation, texUnit);

    gl.activeTexture(gl.TEXTURE0 + texUnit + 1);
    gl.bindTexture(gl.TEXTURE_2D, this._noiseTexture);
    gl.uniform1i(this._noiseLocation, texUnit + 1);

    gl.uniform1f(this._noiseSizeLocation, this._noiseSize);
    gl.uniform2f(this._offsetLocation, opts.offset[0], opts.offset[1]);
    gl.uniform1f(this._scaleLocation, opts.scale);
    gl.uniform1f(this._falloffLocation, opts.falloff);
    gl.uniform3f(
      this._colorLocation,
      opts.color[0],
      opts.color[1],
      opts.color[2]
    );
    gl.uniform1f(this._densityLocation, opts.density);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return destination;
  }
}

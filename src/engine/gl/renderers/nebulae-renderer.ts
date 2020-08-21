import { Framebuffer } from "../framebuffer";
import { ShaderStore } from "../shaders/shaders";
import {
  Context,
  createVAO,
  Vao,
  generateNoiseTexture,
  bindVAO,
} from "../util";
import { GLConstants } from "../constants";
import { Shaders } from "../../../game";

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
    this.program = shaders.getShader(Shaders.Nebulae)!;
    this.width = gl.canvas.width;
    this.height = gl.canvas.height;
    this._vao = createVAO(gl)!;
    bindVAO(gl, this._vao);
    this._positionbuffer = gl.createBuffer()!;
    this._attributePositionLocation = gl.getAttribLocation(
      this.program,
      "a_position"
    );
    gl.bindBuffer(GLConstants.ARRAY_BUFFER, this._positionbuffer);
    gl.bufferData(
      GLConstants.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]),
      GLConstants.STATIC_DRAW
    );
    gl.vertexAttribPointer(
      this._attributePositionLocation,
      2,
      GLConstants.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(this._attributePositionLocation);

    this._uvbuffer = gl.createBuffer()!;
    this._attributeUvLocation = gl.getAttribLocation(this.program, "a_uv");
    gl.bindBuffer(GLConstants.ARRAY_BUFFER, this._uvbuffer);
    gl.bufferData(
      GLConstants.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]),
      GLConstants.STATIC_DRAW
    );
    gl.vertexAttribPointer(this._attributeUvLocation, 2, GLConstants.FLOAT, false, 0, 0);
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
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const texUnit = 1;
    gl.activeTexture(GLConstants.TEXTURE0 + texUnit);
    gl.bindTexture(GLConstants.TEXTURE_2D, source.texture);
    gl.uniform1i(this._sourceLocation, texUnit);

    gl.activeTexture(GLConstants.TEXTURE0 + texUnit + 1);
    gl.bindTexture(GLConstants.TEXTURE_2D, this._noiseTexture);
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

    gl.drawArrays(GLConstants.TRIANGLES, 0, 6);
    return destination;
  }
}

import { Context, bindVAO, createVAO } from "../util";
import { Framebuffer } from "../framebuffer";
import { ShaderStore } from "../shaders/shaders";

interface StarRendererOptions {
  coreColor: [number, number, number];
  coreRadius: number;
  haloColor: [number, number, number];
  haloFalloff: number;
  center: [number, number];
  resolution: [number, number];
  scale: number;
}

export class StarRenderer {
  program: WebGLProgram;
  width: number;
  height: number;
  private _positionbuffer: WebGLBuffer;
  private _uvbuffer: WebGLBuffer;
  private _vao: any;
  private _attributePositionLocation: number;
  private _attributeUvLocation: number;
  private _sourceLocation: WebGLUniformLocation;
  private _coreColorLocation: WebGLUniformLocation;
  private _coreRadiusLocation: WebGLUniformLocation;
  private _haloColorLocation: WebGLUniformLocation;
  private _haloFalloffLocation: WebGLUniformLocation;
  private _centerLocation: WebGLUniformLocation;
  private _resolutionLocation: WebGLUniformLocation;
  private _scaleLocation: WebGLUniformLocation;

  constructor(gl: Context, shaders: ShaderStore) {
    this.width = gl.canvas.width;
    this.height = gl.canvas.height;
    this.program = shaders.getShader("star")!;
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
    this._coreColorLocation = gl.getUniformLocation(
      this.program,
      "u_coreColor"
    )!;
    this._coreRadiusLocation = gl.getUniformLocation(
      this.program,
      "u_coreRadius"
    )!;
    this._haloColorLocation = gl.getUniformLocation(
      this.program,
      "u_haloColor"
    )!;
    this._haloFalloffLocation = gl.getUniformLocation(
      this.program,
      "u_haloFalloff"
    )!;
    this._centerLocation = gl.getUniformLocation(this.program, "u_center")!;
    this._resolutionLocation = gl.getUniformLocation(
      this.program,
      "u_resolution"
    )!;
    this._scaleLocation = gl.getUniformLocation(this.program, "u_scale")!;
  }

  render(
    gl: WebGLRenderingContext,
    source: Framebuffer,
    destination: Framebuffer,
    opts: StarRendererOptions
  ): Framebuffer {
    gl.useProgram(this.program);
    bindVAO(gl, this._vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const texUnit = 1;
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(this._sourceLocation, texUnit);

    gl.uniform3f(
      this._coreColorLocation,
      opts.coreColor[0],
      opts.coreColor[1],
      opts.coreColor[2]
    );
    gl.uniform1f(this._coreRadiusLocation, opts.coreRadius);
    gl.uniform3f(
      this._haloColorLocation,
      opts.haloColor[0],
      opts.haloColor[1],
      opts.haloColor[2]
    );
    gl.uniform1f(this._haloFalloffLocation, opts.haloFalloff);
    gl.uniform2f(this._centerLocation, opts.center[0], opts.center[1]);
    gl.uniform2f(
      this._resolutionLocation,
      opts.resolution[0],
      opts.resolution[1]
    );
    gl.uniform1f(this._scaleLocation, opts.scale);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return destination;
  }
}

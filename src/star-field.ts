import fullscreenTexture from "./engine/gl/shaders/fullscreen-texture.vert";
import nebulae from "./engine/gl/shaders/nebulae.frag";
import star from "./engine/gl/shaders/star.frag";
import texture from "./engine/gl/shaders/texture.frag";

import { IRenderable } from "./engine/renderable";
import {
  Context,
  createProgram,
  createVertexArray,
  bindVertexArray,
  createAndSetupTexture,
} from "./engine/gl/util";

export class StarField implements IRenderable {
  public resolutionLocation: WebGLUniformLocation | null = null;
  public gl: Context;
  public width: number;
  public height: number;

  private _nebulaeShader: WebGLProgram;
  private _starShader: WebGLProgram;
  private _copyShader: WebGLProgram;
  private _positionbuffer: WebGLBuffer;
  private _uvbuffer: WebGLBuffer;
  private _vao: import("c:/repos/games/js13k-404/src/engine/gl/util").Vao;
  private _nebulaeAttributePositionLocation: number;
  private _nebulaeAttributeUvLocation: number;
  private _starAttributePositionLocation: number;
  private _starAttributeUvLocation: number;
  private _nebuleaSourceLocation: WebGLUniformLocation;
  private _nebuleaOffsetLocation: WebGLUniformLocation;
  private _nebuleaScaleLocation: WebGLUniformLocation;
  private _nebuleaFalloffLocation: WebGLUniformLocation;
  private _nebuleaColorLocation: WebGLUniformLocation;
  private _nebuleaDensityLocation: WebGLUniformLocation;
  private _starSourceLocation: WebGLUniformLocation;
  private _starCoreColorLocation: WebGLUniformLocation;
  private _starCoreRadiusLocation: WebGLUniformLocation;
  private _starHaloColorLocation: WebGLUniformLocation;
  private _starHaloFalloffLocation: WebGLUniformLocation;
  private _starCenterLocation: WebGLUniformLocation;
  private _starResolutionLocation: WebGLUniformLocation;
  private _starScaleLocation: WebGLUniformLocation;
  private _copyAttributePositionLocation: number;
  private _copyAttributeUvLocation: number;
  private _copySourceLocation: WebGLUniformLocation | null;
  private _pointStarTexture: WebGLTexture;
  private _ping: WebGLFramebuffer;
  private _pong: WebGLFramebuffer;
  private _starFieldFrameBuffer: WebGLFramebuffer;
  private _nebulaeCount: number;
  private _starCount: number;
  private _scale: number = 1;

  constructor(
    gl: Context,
    width: number,
    height: number,
    nebulaeCount: number,
    starCount: number
  ) {
    this.gl = gl;
    this._vao = createVertexArray(gl)!;
    [this.width, this.height] = [width, height];
    this._nebulaeCount = nebulaeCount;
    this._starCount = starCount;
    this._nebulaeShader = createProgram(this.gl, fullscreenTexture, nebulae);
    this._starShader = createProgram(this.gl, fullscreenTexture, star);
    this._copyShader = createProgram(this.gl, fullscreenTexture, texture);
    this._positionbuffer = gl.createBuffer()!;
    this._uvbuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionbuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvbuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]),
      gl.STATIC_DRAW
    );
    this._nebulaeAttributePositionLocation = gl.getAttribLocation(
      this._nebulaeShader,
      "a_position"
    );
    this._nebulaeAttributeUvLocation = gl.getAttribLocation(
      this._nebulaeShader,
      "a_uv"
    );
    this._starAttributePositionLocation = gl.getAttribLocation(
      this._starShader,
      "a_position"
    );
    this._starAttributeUvLocation = gl.getAttribLocation(
      this._starShader,
      "a_uv"
    );
    this._copyAttributePositionLocation = gl.getAttribLocation(
      this._copyShader,
      "a_position"
    );
    this._copyAttributeUvLocation = gl.getAttribLocation(
      this._copyShader,
      "a_uv"
    );
    this._copySourceLocation = gl.getUniformLocation(
      this._copyShader,
      "u_source"
    );
    this._nebuleaSourceLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_source"
    )!;
    this._nebuleaOffsetLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_offset"
    )!;
    this._nebuleaScaleLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_scale"
    )!;
    this._nebuleaFalloffLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_falloff"
    )!;
    this._nebuleaColorLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_color"
    )!;
    this._nebuleaDensityLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_density"
    )!;

    this._starSourceLocation = gl.getUniformLocation(
      this._starShader,
      "u_source"
    )!;
    this._starCoreColorLocation = gl.getUniformLocation(
      this._starShader,
      "u_coreColor"
    )!;
    this._starCoreRadiusLocation = gl.getUniformLocation(
      this._starShader,
      "u_coreRadius"
    )!;
    this._starHaloColorLocation = gl.getUniformLocation(
      this._starShader,
      "u_haloColor"
    )!;
    this._starHaloFalloffLocation = gl.getUniformLocation(
      this._starShader,
      "u_haloFalloff"
    )!;
    this._starCenterLocation = gl.getUniformLocation(
      this._starShader,
      "u_center"
    )!;
    this._starResolutionLocation = gl.getUniformLocation(
      this._starShader,
      "u_resolution"
    )!;
    this._starScaleLocation = gl.getUniformLocation(
      this._starShader,
      "u_scale"
    )!;
    this._ping = this.gl.createFramebuffer()!;
    this._pong = this.gl.createFramebuffer()!;
    this._starFieldFrameBuffer = this.gl.createFramebuffer()!;
    this._pointStarTexture = this.generatePointStarTexture();
  }

  private generatePointStarTexture(): WebGLTexture {
    const data = this.generatePointStars(
      this.width,
      this.height,
      0.05,
      0.125,
      Math.random
    );
    let pointStarTexture = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, pointStarTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGB,
      this.width,
      this.height,
      0,
      this.gl.RGB,
      this.gl.UNSIGNED_BYTE,
      data
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );
    return pointStarTexture;
  }

  private generatePointStars(
    width: number,
    height: number,
    density: number,
    brightness: number,
    rng: () => number
  ): Uint8Array {
    let count = Math.round(width * height * density);
    let data = new Uint8Array(width * height * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.floor(rng() * width * height);
      const c = Math.round(255 * Math.log(1 - rng()) * -brightness);
      data[r * 3 + 0] = c;
      data[r * 3 + 1] = c;
      data[r * 3 + 2] = c;
    }

    return data;
  }

  private renderNebulae(
    source: WebGLTexture,
    offset: [number, number],
    scale: number,
    falloff: number,
    color: [number, number, number],
    density: number,
    destination: WebGLFramebuffer
  ): WebGLFramebuffer {
    this.gl.viewport(0, 0, this.width, this.height);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, destination);
    this.gl.bindBuffer(
      this._nebulaeAttributePositionLocation,
      this._positionbuffer
    );
    this.gl.enableVertexAttribArray(this._nebulaeAttributePositionLocation);
    this.gl.vertexAttribPointer(
      this._nebulaeAttributePositionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.bindBuffer(this._nebulaeAttributeUvLocation, this._uvbuffer);
    this.gl.enableVertexAttribArray(this._nebulaeAttributeUvLocation);
    this.gl.vertexAttribPointer(
      this._nebulaeAttributeUvLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.useProgram(this._nebulaeShader);
    bindVertexArray(this.gl, this._vao);
    this.gl.uniform1i(this._nebuleaSourceLocation, this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE0, source);
    this.gl.uniform2f(this._nebuleaOffsetLocation, offset[0], offset[1]);
    this.gl.uniform1f(this._nebuleaScaleLocation, scale);
    this.gl.uniform1f(this._nebuleaFalloffLocation, falloff);
    this.gl.uniform3f(this._nebuleaColorLocation, color[0], color[1], color[2]);
    this.gl.uniform1f(this._nebuleaDensityLocation, density);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    bindVertexArray(this.gl, null);
    return destination;
  }

  private renderStar(
    source: WebGLTexture,
    coreColor: [number, number, number],
    coreRadius: number,
    haloColor: [number, number, number],
    haloFalloff: number,
    center: [number, number],
    resolution: [number, number],
    scale: number,
    destination: WebGLFramebuffer
  ): WebGLFramebuffer {
    this.gl.viewport(0, 0, this.width, this.height);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, destination);
    this.gl.bindBuffer(
      this._starAttributePositionLocation,
      this._positionbuffer
    );
    this.gl.enableVertexAttribArray(this._starAttributePositionLocation);
    this.gl.vertexAttribPointer(
      this._starAttributePositionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.bindBuffer(this._starAttributeUvLocation, this._uvbuffer);
    this.gl.enableVertexAttribArray(this._starAttributeUvLocation);
    this.gl.vertexAttribPointer(
      this._starAttributeUvLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.useProgram(this._starShader);
    bindVertexArray(this.gl, this._vao);
    this.gl.uniform1i(this._starSourceLocation, this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE0, source);
    this.gl.uniform3f(
      this._starCoreColorLocation,
      coreColor[0],
      coreColor[1],
      coreColor[2]
    );
    this.gl.uniform1f(this._starCoreRadiusLocation, coreRadius);
    this.gl.uniform3f(
      this._starHaloColorLocation,
      haloColor[0],
      haloColor[1],
      haloColor[2]
    );
    this.gl.uniform1f(this._starHaloFalloffLocation, haloFalloff);
    this.gl.uniform2f(this._starCenterLocation, center[0], center[1]);
    this.gl.uniform2f(
      this._starResolutionLocation,
      resolution[0],
      resolution[1]
    );
    this.gl.uniform1f(this._starScaleLocation, scale);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    bindVertexArray(this.gl, null);
    return destination;
  }

  private renderCopy(
    source: WebGLTexture,
    destination: WebGLFramebuffer | null
  ) {
    this.gl.viewport(0, 0, this.width, this.height);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, destination);
    this.gl.bindBuffer(
      this._copyAttributePositionLocation,
      this._positionbuffer
    );
    this.gl.enableVertexAttribArray(this._copyAttributePositionLocation);
    this.gl.vertexAttribPointer(
      this._copyAttributePositionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.bindBuffer(this._copyAttributeUvLocation, this._uvbuffer);
    this.gl.enableVertexAttribArray(this._copyAttributeUvLocation);
    this.gl.vertexAttribPointer(
      this._copyAttributeUvLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.useProgram(this._copyShader);
    bindVertexArray(this.gl, this._vao);
    this.gl.uniform1i(this._copySourceLocation, this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE0, source);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    bindVertexArray(this.gl, null);
    return destination;
  }

  private pingpong(
    initial: WebGLFramebuffer,
    alpha: WebGLFramebuffer,
    beta: WebGLFramebuffer,
    count: number,
    func: (
      source: WebGLFramebuffer,
      destination: WebGLFramebuffer
    ) => WebGLFramebuffer
  ) {
    if (count === 0) {
      return initial;
    }
    if (initial === alpha) {
      alpha = beta;
      beta = initial;
    }
    func(initial, alpha);
    let i = 1;
    if (i === count) {
      return alpha;
    }
    while (true) {
      func(alpha, beta);
      i++;
      if (i === count) {
        return beta;
      }
      func(beta, alpha);
      i++;
      if (i === count) {
        return alpha;
      }
    }
  }

  private setup() {
    this.gl.viewport(0, 0, this.width, this.height);
    const copyOut = this.renderCopy(this._pointStarTexture, this._ping)!;
    const nebulaeOut = this.pingpong(
      copyOut,
      this._ping,
      this._pong,
      this._nebulaeCount,
      (source: WebGLFramebuffer, destination: WebGLFramebuffer) =>
        this.renderNebulae(
          source,
          [Math.random() * 100, Math.random() * 100],
          (Math.random() * 2 + 1) / this._scale,
          Math.random() * 2.0 + 3.0,
          [Math.random(), Math.random(), Math.random()],
          Math.random() * 0.2,
          destination
        )
    );

    const starOut = this.pingpong(
      nebulaeOut,
      this._ping,
      this._pong,
      this._starCount,
      (source: WebGLFramebuffer, destination: WebGLFramebuffer) =>
        this.renderStar(
          source,
          [1, 1, 1],
          0.0,
          [Math.random(), Math.random(), Math.random()],
          Math.random() * 1024 + 32,
          [Math.random(), Math.random()],
          [this.width, this.height],
          this._scale,
          destination
        )
    );

    const sunOut = this.renderStar(
      starOut,
      [1, 1, 1],
      Math.random() * 0.025 + 0.025,
      [Math.random(), Math.random(), Math.random()],
      Math.random() * 32 + 32,
      [Math.random(), Math.random()],
      [this.width, this.height],
      this._scale,
      this._starFieldFrameBuffer
    );
    return sunOut;
  }

  public render(now?: number): void {
    this.gl.viewport(0, 0, this.width, this.height);
    this.renderCopy(this._starFieldFrameBuffer, null);
  }
}

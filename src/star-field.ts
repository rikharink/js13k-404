import fullscreenTexture from "./engine/gl/shaders/fullscreen-texture.vert";
import nebulae from "./engine/gl/shaders/nebulae.frag";
import star from "./engine/gl/shaders/star.frag";
import texture from "./engine/gl/shaders/texture.frag";

declare global {
  interface Window {
    Dump: any;
  }
}

window.Dump = window.Dump || {};

import { IRenderable } from "./engine/renderable";
import {
  Context,
  createProgram,
  createVertexArray,
  bindVertexArray,
  Vao,
  generateNoiseTexture,
} from "./engine/gl/util";
import { createImageFromTexture } from "./engine/debug/index";

export interface Framebuffer {
  framebuffer: WebGLFramebuffer | null;
  texture: WebGLTexture | null;
}

export class StarField implements IRenderable {
  public gl!: Context;
  public width: number;
  public height: number;

  private _nebulaeShader: WebGLProgram;
  private _starShader: WebGLProgram;
  private _copyShader: WebGLProgram;
  private _positionbuffer: WebGLBuffer;
  private _uvbuffer: WebGLBuffer;
  private _vao: Vao;
  private _nebulaeAttributePositionLocation: number;
  private _nebulaeAttributeUvLocation: number;
  private _starAttributePositionLocation: number;
  private _starAttributeUvLocation: number;
  private _nebulaeSourceLocation: WebGLUniformLocation;
  private _nebulaeOffsetLocation: WebGLUniformLocation;
  private _nebulaeScaleLocation: WebGLUniformLocation;
  private _nebulaeFalloffLocation: WebGLUniformLocation;
  private _nebulaeColorLocation: WebGLUniformLocation;
  private _nebulaeDensityLocation: WebGLUniformLocation;
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
  private _noiseTexture: WebGLTexture;
  private _resultTexture!: WebGLTexture;
  private _ping!: Framebuffer;
  private _pong!: Framebuffer;
  private _starfield!: Framebuffer;
  private _nebulaeCount: number;
  private _starCount: number;
  private _scale: number = 2;
  private _nebulaeNoiseLocation: WebGLUniformLocation | null;
  private _nebulaeNoiseSizeLocation: WebGLUniformLocation | null;
  private _noiseSize: number;

  constructor(
    gl: Context,
    width: number,
    height: number,
    nebulaeCount: number,
    starCount: number
  ) {
    this._vao = createVertexArray(gl)!;
    bindVertexArray(gl, this._vao);
    [this.width, this.height] = [width, height];
    this._nebulaeCount = nebulaeCount;
    this._starCount = starCount;
    this._nebulaeShader = createProgram(gl, fullscreenTexture, nebulae);
    this._starShader = createProgram(gl, fullscreenTexture, star);
    this._copyShader = createProgram(gl, fullscreenTexture, texture);
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
    this._nebulaeSourceLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_source"
    )!;
    this._nebulaeNoiseLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_noise"
    );
    this._nebulaeNoiseSizeLocation = gl.getUniformLocation(this._nebulaeShader, "u_noiseSize");
    this._nebulaeOffsetLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_offset"
    )!;
    this._nebulaeScaleLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_scale"
    )!;
    this._nebulaeFalloffLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_falloff"
    )!;
    this._nebulaeColorLocation = gl.getUniformLocation(
      this._nebulaeShader,
      "u_color"
    )!;
    this._nebulaeDensityLocation = gl.getUniformLocation(
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
    this._pointStarTexture = this.generatePointStarTexture(gl);
    this._noiseSize = 256;
    this._noiseTexture = generateNoiseTexture(gl, Math.random, this._noiseSize);
    this.setupFramebuffers(gl);
    this.draw(gl);
  }

  private setupFramebuffers(gl: Context) {
    const pingTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, pingTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.canvas.width,
      gl.canvas.height,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const pingFramebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, pingFramebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pingTexture,
      0
    );
    this._ping = {
      framebuffer: pingFramebuffer,
      texture: pingTexture,
    };

    const pongTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, pongTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.canvas.width,
      gl.canvas.height,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const pongFramebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, pongFramebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pongTexture,
      0
    );

    this._pong = {
      framebuffer: pongFramebuffer,
      texture: pongTexture,
    };

    const starfieldTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, starfieldTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.canvas.width,
      gl.canvas.height,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const starfieldFrameBuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, starfieldFrameBuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      starfieldTexture,
      0
    );
    this._starfield = {
      framebuffer: starfieldFrameBuffer,
      texture: starfieldTexture,
    };
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private generatePointStarTexture(gl: Context): WebGLTexture {
    const data = this.generatePointStars(
      gl.canvas.width,
      gl.canvas.height,
      0.05,
      0.125,
      Math.random
    );
    let pointStarTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, pointStarTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.canvas.width,
      gl.canvas.height,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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
    gl: Context,
    source: Framebuffer,
    offset: [number, number],
    scale: number,
    falloff: number,
    color: [number, number, number],
    density: number,
    destination: Framebuffer
  ): Framebuffer {
    gl.useProgram(this._nebulaeShader);
    bindVertexArray(gl, this._vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionbuffer);
    gl.enableVertexAttribArray(this._nebulaeAttributePositionLocation);
    gl.vertexAttribPointer(
      this._nebulaeAttributePositionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvbuffer);
    gl.enableVertexAttribArray(this._nebulaeAttributeUvLocation);
    gl.vertexAttribPointer(
      this._nebulaeAttributeUvLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    bindVertexArray(gl, null);
    gl.uniform1i(this._nebulaeSourceLocation, 0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(this._nebulaeNoiseLocation, 1);
    gl.bindTexture(gl.TEXTURE_2D, this._noiseTexture);
    gl.uniform1f(this._nebulaeNoiseSizeLocation, this._noiseSize);
    gl.uniform2f(this._nebulaeOffsetLocation, offset[0], offset[1]);
    gl.uniform1f(this._nebulaeScaleLocation, scale);
    gl.uniform1f(this._nebulaeFalloffLocation, falloff);
    gl.uniform3f(this._nebulaeColorLocation, color[0], color[1], color[2]);
    gl.uniform1f(this._nebulaeDensityLocation, density);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return destination;
  }

  private renderStar(
    gl: Context,
    source: Framebuffer,
    coreColor: [number, number, number],
    coreRadius: number,
    haloColor: [number, number, number],
    haloFalloff: number,
    center: [number, number],
    resolution: [number, number],
    scale: number,
    destination: Framebuffer
  ): Framebuffer {
    gl.useProgram(this._starShader);
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionbuffer);
    gl.enableVertexAttribArray(this._starAttributePositionLocation);
    gl.vertexAttribPointer(
      this._starAttributePositionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvbuffer);
    gl.enableVertexAttribArray(this._starAttributeUvLocation);
    gl.vertexAttribPointer(
      this._starAttributeUvLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    bindVertexArray(gl, this._vao);
    gl.uniform1i(this._starSourceLocation, 0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform3f(
      this._starCoreColorLocation,
      coreColor[0],
      coreColor[1],
      coreColor[2]
    );
    gl.uniform1f(this._starCoreRadiusLocation, coreRadius);
    gl.uniform3f(
      this._starHaloColorLocation,
      haloColor[0],
      haloColor[1],
      haloColor[2]
    );
    gl.uniform1f(this._starHaloFalloffLocation, haloFalloff);
    gl.uniform2f(this._starCenterLocation, center[0], center[1]);
    gl.uniform2f(this._starResolutionLocation, resolution[0], resolution[1]);
    gl.uniform1f(this._starScaleLocation, scale);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    bindVertexArray(gl, null);
    return destination;
  }

  private renderCopy(
    gl: Context,
    source: Framebuffer,
    destination: Framebuffer
  ) {
    gl.useProgram(this._copyShader);
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionbuffer);
    gl.enableVertexAttribArray(this._copyAttributePositionLocation);
    gl.vertexAttribPointer(
      this._copyAttributePositionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvbuffer);
    gl.enableVertexAttribArray(this._copyAttributeUvLocation);
    gl.vertexAttribPointer(
      this._copyAttributeUvLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );
    bindVertexArray(gl, this._vao);
    gl.uniform1i(this._copySourceLocation, 0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    bindVertexArray(gl, null);
    return destination;
  }

  private pingpong(
    gl: Context,
    initial: Framebuffer,
    alpha: Framebuffer,
    beta: Framebuffer,
    count: number,
    func: (source: Framebuffer, destination: Framebuffer) => Framebuffer
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

  private resetFramebuffers(gl: Context) {
    gl.clearColor(0, 0, 0, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._ping.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this._pong.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.deleteTexture(this._ping.texture);
    gl.deleteFramebuffer(this._ping.framebuffer);
    gl.deleteTexture(this._pong.texture);
    gl.deleteFramebuffer(this._pong.framebuffer);
    gl.deleteTexture(this._starfield.texture);
    gl.deleteFramebuffer(this._starfield.framebuffer);
    this.setupFramebuffers(gl);
  }

  private draw(gl: Context): void {
    this.resetFramebuffers(gl);
    this.renderCopy(
      gl,
      { framebuffer: null, texture: this._pointStarTexture },
      this._ping
    )!;
    const nebulaeOut = this.pingpong(
      gl,
      this._ping,
      this._ping,
      this._pong,
      this._nebulaeCount,
      (source: Framebuffer, destination: Framebuffer) =>
        this.renderNebulae(
          gl,
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
      gl,
      nebulaeOut,
      this._ping,
      this._pong,
      this._starCount,
      (source: Framebuffer, destination: Framebuffer) =>
        this.renderStar(
          gl,
          source,
          [1, 1, 1],
          0.0,
          [Math.random(), Math.random(), Math.random()],
          Math.random() * 1024 + 32,
          [Math.random(), Math.random()],
          [gl.canvas.width, gl.canvas.height],
          this._scale,
          destination
        )
    );

    const sunOut = this.renderStar(
      gl,
      starOut,
      [1, 1, 1],
      Math.random() * 0.025 + 0.025,
      [Math.random(), Math.random(), Math.random()],
      Math.random() * 32 + 32,
      [Math.random(), Math.random()],
      [gl.canvas.width, gl.canvas.height],
      this._scale,
      this._starfield
    );

    this._resultTexture = sunOut.texture!;
  }

  public render(
    gl: Context,
    source: Framebuffer,
    destination: Framebuffer
  ): void {
    if (this.width != gl.canvas.width || this.height != gl.canvas.height) {
      this.width = gl.canvas.width;
      this.height = gl.canvas.height;
      this.draw(gl);
    }
    this.renderCopy(
      gl,
      { framebuffer: null, texture: this._resultTexture },
      destination
    )!;
  }
}

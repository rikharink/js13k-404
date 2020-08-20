import { Framebuffer } from "./framebuffer";
import { Context } from "./util";

export abstract class PingPong {
  protected _ping: Framebuffer;
  protected _pong: Framebuffer;

  constructor(gl: Context) {
    [this._ping, this._pong] = this.setupFramebuffers(gl);
  }

  protected pingpong(
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

  protected resetFramebuffers(gl: Context): void {
    gl.deleteTexture(this._ping.texture);
    gl.deleteFramebuffer(this._ping.framebuffer);
    gl.deleteTexture(this._pong.texture);
    gl.deleteFramebuffer(this._pong.framebuffer);
    [this._ping, this._pong] = this.setupFramebuffers(gl);
  }

  protected setupFramebuffers(gl: Context): [Framebuffer, Framebuffer] {
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
    const ping = {
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
    const pong = {
      framebuffer: pongFramebuffer,
      texture: pongTexture,
    };

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return [ping, pong];
  }
}

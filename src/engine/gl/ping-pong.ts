import { Framebuffer } from "./framebuffer";
import { Context, createAndSetupTexture } from "./util";
import { GLConstants } from "./constants";

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
    const pingTexture = createAndSetupTexture(gl, {
      wrap: GLConstants.CLAMP_TO_EDGE,
      filter: GLConstants.LINEAR,
      format: GLConstants.RGBA,
      width: gl.canvas.width,
      height: gl.canvas.height,
      pixels: null
    });
    const pingFramebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, pingFramebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.framebufferTexture2D(
      GLConstants.FRAMEBUFFER,
      GLConstants.COLOR_ATTACHMENT0,
      GLConstants.TEXTURE_2D,
      pingTexture,
      0
    );
    gl.clear(GLConstants.COLOR_BUFFER_BIT);
    const ping = {
      framebuffer: pingFramebuffer,
      texture: pingTexture,
    };
    const pongTexture = createAndSetupTexture(gl, {
      wrap: GLConstants.CLAMP_TO_EDGE,
      filter: GLConstants.LINEAR,
      format: GLConstants.RGBA,
      width: gl.canvas.width,
      height: gl.canvas.height,
      pixels: null
    });
    const pongFramebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, pongFramebuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.framebufferTexture2D(
      GLConstants.FRAMEBUFFER,
      GLConstants.COLOR_ATTACHMENT0,
      GLConstants.TEXTURE_2D,
      pongTexture,
      0
    );
    gl.clear(GLConstants.COLOR_BUFFER_BIT);
    const pong = {
      framebuffer: pongFramebuffer,
      texture: pongTexture,
    };

    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, null);
    return [ping, pong];
  }
}

import { IRenderable } from "./renderable";
import { Context, createAndSetupTexture } from "./gl/util";

export abstract class PingPong implements IRenderable {
    public gl: Context;
    public abstract resolutionLocation: WebGLUniformLocation | null;
    public width: number;
    public height: number;
  
    protected _texture: WebGLTexture;
    protected _textures: WebGLTexture[];
    protected _framebuffers: WebGLFramebuffer[];
    protected _currentIndex = 0;
  
    protected constructor(gl: Context, width: number, height: number) {
      this.gl = gl;
      [this.width, this.height] = [width, height];
      [this._textures, this._framebuffers] = this.init();
      this._texture = createAndSetupTexture(gl);
      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );
    }
  
    protected init(): [WebGLTexture[], WebGLFramebuffer[]] {
      let texturePing = createAndSetupTexture(this.gl);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texturePing);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.width,
        this.height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      );
      let fbPing = this.gl.createFramebuffer()!;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbPing);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        texturePing,
        0
      );
  
      let texturePong = createAndSetupTexture(this.gl);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texturePong);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.width,
        this.height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      );
      let fbPong = this.gl.createFramebuffer()!;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbPong);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        texturePong,
        0
      );
  
      return [
        [texturePing, texturePong],
        [fbPing, fbPong],
      ];
    }
  
    protected pingpong(): [WebGLTexture, WebGLFramebuffer] {
      const result: [WebGLTexture, WebGLFramebuffer] = [
        this._textures[this._currentIndex],
        this._framebuffers[this._currentIndex],
      ];
      this._currentIndex = (this._currentIndex + 1) % this._textures.length;
      return result;
    }
  
    public abstract render(now?: number): void;
  }
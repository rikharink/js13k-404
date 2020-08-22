import { TextureRenderer } from "./texture-renderer";
import { Context, Vao, createVAO, bindVAO } from "./../util";
import { ShaderStore } from "./../shaders/shaders";
import { GLConstants } from "../constants";
import { Shaders } from "../../../game";
import { Framebuffer } from "../framebuffer";
import { Layer } from "./layer";
import { Point } from "./point";
import { Sprite } from "./sprite";
import { Frame } from "./frame";

const maxBatch = 65535;
const depth = 1e5;

export class SpriteRenderer {
  _zeroLayer: Layer;
  _layers: Layer[];
  _gl: Context;
  _ext: ANGLE_instanced_arrays;
  _program: WebGLProgram;
  // _vao: Vao;
  private _matrixLocation: WebGLUniformLocation;
  private _textureLocation: WebGLUniformLocation;
  private _alphaTestLocation: WebGLUniformLocation;
  private _width!: number;
  private _height!: number;
  private _count: number;
  private _currentFrame: Frame | null;
  private _alphaTestMode: boolean;
  private _blend: GLConstants;
  private _arrayBuffer: ArrayBuffer;
  private _floatView: Float32Array;
  private _uintView: Uint32Array;
  public camera = {
    at: new Point(),
    to: new Point(),
    angle: 0,
  };
  private _textureRenderer: TextureRenderer;
  private _floatSize: number;
  private _byteSize: number;
  private _indices: Uint8Array;
  private _vertices: Float32Array;

  constructor(gl: Context, shaders: ShaderStore, alpha: boolean) {
    bindVAO(gl, null);
    this._textureRenderer = new TextureRenderer(gl, shaders);
    this._zeroLayer = new Layer(0);
    this._layers = [this._zeroLayer];

    this._floatSize = 13;
    this._byteSize = this._floatSize * 4;

    this._arrayBuffer = new ArrayBuffer(maxBatch * this._byteSize);
    this._floatView = new Float32Array(this._arrayBuffer);
    this._uintView = new Uint32Array(this._arrayBuffer);
    this._blend = alpha ? GLConstants.ONE : GLConstants.SRC_ALPHA;
    this._gl = gl;
    this._ext = this._gl.getExtension("ANGLE_instanced_arrays")!;
    this._program = shaders.getShader(Shaders.Sprite)!;
    this._indices = new Uint8Array([0 , 1, 2, 2, 1, 3]);
    this._vertices = new Float32Array([0, 0, 0, 1, 1, 0, 1, 1])

    this._bindStuff();
    this._matrixLocation = this._getUniformLocation("m");
    this._textureLocation = this._getUniformLocation("x");
    this._alphaTestLocation = this._getUniformLocation("j");

    this._width = this._gl.drawingBufferWidth;
    this._height = this._gl.drawingBufferHeight;
    this._count = 0;
    this._currentFrame = null;
    this._alphaTestMode = false;
  }

  private _bindStuff() {
    // indicesBuffer
    this._createBuffer(
      GLConstants.ELEMENT_ARRAY_BUFFER,
      this._indices
    );

    // vertexBuffer
    this._createBuffer(
      GLConstants.ARRAY_BUFFER,
      this._vertices
    );

    // vertexLocation
    this._bindAttrib("g", 2);

    // dynamicBuffer
    this._createBuffer(
      GLConstants.ARRAY_BUFFER,
      this._arrayBuffer,
      GLConstants.DYNAMIC_DRAW
    );

    // anchorLocation
    this._bindAttrib("a", 2, this._byteSize, 1);
    // scaleLocation
    this._bindAttrib("s", 2, this._byteSize, 1, 8);
    // rotationLocation
    this._bindAttrib("r", 1, this._byteSize, 1, 16);
    // translationLocation
    this._bindAttrib("t", 2, this._byteSize, 1, 20);
    // uvsLocation
    this._bindAttrib("u", 4, this._byteSize, 1, 28);
    // colorLocation
    this._bindAttrib(
      "c",
      4,
      this._byteSize,
      1,
      44,
      GLConstants.UNSIGNED_BYTE,
      true
    );
    // zLocation
    this._bindAttrib("z", 1, this._byteSize, 1, 48);
  }

  private _createBuffer(
    type: number,
    src: ArrayBuffer | null,
    usage?: number
  ): WebGLBuffer {
    const buffer = this._gl.createBuffer()!;
    this._gl.bindBuffer(type, buffer);
    this._gl.bufferData(type, src, usage ?? GLConstants.STATIC_DRAW);
    return buffer;
  }

  private _bindAttrib(
    name: string,
    size: number,
    stride?: number,
    divisor?: number,
    offset?: number,
    type?: number,
    norm?: boolean
  ) {
    const location = this._gl.getAttribLocation(this._program, name);
    this._gl.enableVertexAttribArray(location);
    this._gl.vertexAttribPointer(
      location,
      size,
      type || GLConstants.FLOAT,
      !!norm,
      stride || 0,
      offset || 0
    );
    divisor && this._ext.vertexAttribDivisorANGLE(location, divisor);
  }

  private _getUniformLocation(name: string): WebGLUniformLocation {
    return this._gl.getUniformLocation(this._program, name)!;
  }

  private _flush() {
    if (!this._count) {
      return;
    }
    this._bindStuff();
    this._gl.blendFunc(
      this._alphaTestMode ? GLConstants.ONE : this._blend,
      this._alphaTestMode ? GLConstants.ZERO : GLConstants.ONE_MINUS_SRC_ALPHA
    );
    this._gl.depthFunc(
      this._alphaTestMode ? GLConstants.LESS : GLConstants.LEQUAL
    );

    let texUnit = 0;
    this._gl.activeTexture(GLConstants.TEXTURE0 + texUnit);
    this._gl.bindTexture(GLConstants.TEXTURE_2D, this._currentFrame!.p!.t);
    //@ts-ignore
    this._gl.uniform1i(this._textureLocation, texUnit);
    this._gl.uniform1f(
      this._alphaTestLocation,
      this._alphaTestMode ? this._currentFrame!.p!.a! : 0
    );

    this._gl.bufferSubData(
      GLConstants.ARRAY_BUFFER,
      0,
      this._floatView.subarray(0, this._count * this._floatSize)
    );
    this._ext.drawElementsInstancedANGLE(
      GLConstants.TRIANGLES,
      6,
      GLConstants.UNSIGNED_BYTE,
      0,
      this._count
    );
    this._count = 0;
  }

  private _draw(sprite: Sprite) {
    if (!sprite.visible) {
      return;
    }
    if (this._count >= maxBatch) {
      return;
    }
    const { frame } = sprite;
    const { uvs } = frame;

    if (this._currentFrame?.p.t !== frame.p.t) {
      if (this._currentFrame?.p.t) {
        this._flush();
      }
      this._currentFrame = frame;
    }
    let i = this._count * this._floatSize;

    this._floatView[i++] = frame!.anchor!.x;
    this._floatView[i++] = frame!.anchor!.y;

    this._floatView[i++] = sprite.scale.x * frame!.size!.x;
    this._floatView[i++] = sprite.scale.y * frame!.size!.y;

    this._floatView[i++] = sprite.rotation;

    this._floatView[i++] = sprite.position.x;
    this._floatView[i++] = sprite.position.y;
    this._floatView[i++] = uvs![0];
    this._floatView[i++] = uvs![1];
    this._floatView[i++] = uvs![2];
    this._floatView[i++] = uvs![3];
    this._uintView[i++] =
      (((sprite.tint & 0xffffff) << 8) | ((sprite.alpha * 255) & 255)) >>> 0;
    this._floatView[i] = sprite.layer!.z;

    this._count++;
  }

  render(gl: Context, source: Framebuffer, destination: Framebuffer) {
    if (
      this._width !== gl.drawingBufferWidth ||
      this._height !== gl.drawingBufferHeight
    ) {
      [this._width, this._height] = [
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
      ];
    }
    this._textureRenderer.render(gl, source.texture!, destination.framebuffer);
    const { at, to, angle } = this.camera;

    const x = at.x - this._width * to.x;
    const y = at.y - this._height * to.y;

    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const w = 2 / this._width;
    const h = -2 / this._height;

    // prettier-ignore
    const projection = [
      c * w, s * h, 0, 0,
      -s * w, c * h, 0, 0,
      0, 0, -1 / depth, 0,

      (at.x * (1 - c) + at.y * s) * w - 2 * x / this._width - 1,
      (at.y * (1 - c) - at.x * s) * h + 2 * y / this._height + 1,
      0, 1,
    ];

    gl.useProgram(this._program);
    bindVAO(gl, null);
    gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination.framebuffer);
    gl.enable(GLConstants.BLEND);
    gl.enable(GLConstants.DEPTH_TEST);
    gl.viewport(0, 0, this._width, this._height);
    gl.uniformMatrix4fv(this._matrixLocation, false, projection);
    this._currentFrame = null;
    this._alphaTestMode = true;
    for (let layer of this._layers) {
      layer.o.i(this._draw.bind(this));
    }
    this._flush();

    this._alphaTestMode = false;
    for (let l = this._layers.length - 1; l >= 0; l--) {
      this._layers[l].t.i(this._draw.bind(this));
    }
    this._flush();
  }

  layer(z: number): Layer {
    let l = this._layers.find((layer) => layer.z === z);
    if (!l) {
      l = new Layer(z);
      this._layers.push(l);
      this._layers.sort((a, b) => b.z - a.z);
    }
    return l;
  }

  add(sprite: Sprite) {
    this._zeroLayer.add(sprite);
  }

  texture(source: TexImageSource, alphaTest: number) {
    const srcWidth = source.width;
    const srcHeight = source.height;
    const t = this._gl.createTexture()!;

    this._gl.bindTexture(GLConstants.TEXTURE_2D, t);
    this._gl.texParameteri(
      GLConstants.TEXTURE_2D,
      GLConstants.TEXTURE_MAG_FILTER,
      GLConstants.NEAREST
    );
    this._gl.texParameteri(
      GLConstants.TEXTURE_2D,
      GLConstants.TEXTURE_MIN_FILTER,
      GLConstants.NEAREST
    );
    this._gl.texImage2D(
      GLConstants.TEXTURE_2D,
      0,
      GLConstants.RGBA,
      GLConstants.RGBA,
      GLConstants.UNSIGNED_BYTE,
      source
    );
    return new Frame(
      srcWidth,
      srcHeight,
      new Point(srcWidth, srcHeight),
      new Point(),
      [0, 0, 1, 1],
      {
        a: alphaTest === 0 ? 0 : alphaTest || 1,
        t,
      }
    );
  }
}

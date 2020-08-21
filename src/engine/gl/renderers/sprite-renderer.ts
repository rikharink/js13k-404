import { TextureRenderer } from "./texture-renderer";
import { Context } from "./../util";
import { ShaderStore } from "./../shaders/shaders";
import { List, Node } from "../list";
import { GLConstants } from "../constants";
import { Shaders } from "../../../game";
import { Framebuffer } from "../framebuffer";

const maxBatch = 65535;
const depth = 1e5;
const nullFrame = { p: { t: 0 } };

class Layer {
  z: number;
  o: List;
  t: List;

  constructor(z: number) {
    this.z = z;
    this.o = new List();
    this.t = new List();
  }

  add(sprite: Sprite) {
    sprite.remove();
    sprite.layer = this;
    sprite.node = (sprite._alpha !== 1 || sprite.frame.p.a === 0
      ? this.t
      : this.o
    ).add(sprite);
  }
}

class Point {
  x!: number;
  y!: number;

  constructor(x?: number, y?: number) {
    this.set(x, y);
  }

  set(x?: number, y?: number): Point {
    this.x = x || 0;
    this.y = y || (y !== 0 ? this.x : 0);
    return this;
  }
}

interface SpriteProps {
  frame: Frame;
  visible: boolean;
  position: Point;
  rotation: number;
  scale: Point;
  tint: number;
  alpha: number;
  list: Layer | null;
  node: Node | null;
}

export class Sprite {
  _alpha: number;
  frame: Frame;
  layer: Layer | null = null;
  node: Node | null;
  visible: boolean;
  position: Point;
  rotation: number;
  scale: Point;
  tint: number;

  constructor(
    frame: Frame,
    {
      visible = true,
      position = new Point(),
      rotation = 0,
      scale = new Point(1),
      tint = 0xffffff,
      alpha = 1,
      list = null,
      node = null,
    }: SpriteProps
  ) {
    this.frame = frame;
    this.visible = visible;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.tint = tint;
    this._alpha = alpha;
    this.layer = list;
    this.node = node;
  }

  get alpha() {
    return this._alpha;
  }

  set alpha(value) {
    const change =
      (value < 1 && this._alpha === 1) || (value === 1 && this._alpha < 1);
    this._alpha = value;
    change && this.frame!.p!.a! > 0 && this.layer && this.layer.add(this);
  }

  remove() {
    this.node && this.node.r();
    this.layer = null;
    this.node = null;
  }
}

export class SpriteRenderer {
  _zeroLayer: Layer;
  _layers: Layer[];
  _gl: Context;
  _ext: ANGLE_instanced_arrays;
  _program: WebGLProgram;
  private _matrixLocation: WebGLUniformLocation;
  private _textureLocation: WebGLUniformLocation;
  private _alphaTestLocation: WebGLUniformLocation;
  private _width!: number;
  private _height!: number;
  private _count: number;
  private _currentFrame: Frame | null;
  private _alphaTestMode: boolean;
  private _blend: GLConstants;
  private _floatSize: number;
  private _byteSize: number;
  private _arrayBuffer: ArrayBuffer;
  private _floatView: Float32Array;
  private _uintView: Uint32Array;
  private _camera = {
    at: new Point(),
    to: new Point(),
    angle: 0,
  };
  private _textureRenderer: TextureRenderer;

  constructor(gl: Context, shaders: ShaderStore, alpha: boolean) {
    this._textureRenderer = new TextureRenderer(gl, shaders);
    this._zeroLayer = new Layer(0);
    this._layers = [this._zeroLayer];
    this._floatSize = 2 + 2 + 1 + 2 + 4 + 1 + 1;
    this._byteSize = this._floatSize * 4;
    this._arrayBuffer = new ArrayBuffer(maxBatch * this._byteSize);
    this._floatView = new Float32Array(this._arrayBuffer);
    this._uintView = new Uint32Array(this._arrayBuffer);
    this._blend = alpha ? GLConstants.ONE : GLConstants.SRC_ALPHA;
    this._gl = gl;
    this._ext = this._gl.getExtension("ANGLE_instanced_arrays")!;
    this._program = shaders.getShader(Shaders.Sprite)!;

    // indicesBuffer
    this._createBuffer(
      GLConstants.ELEMENT_ARRAY_BUFFER,
      new Uint8Array([0, 1, 2, 2, 1, 3])
    );

    // vertexBuffer
    this._createBuffer(
      GLConstants.ARRAY_BUFFER,
      new Float32Array([0, 0, 0, 1, 1, 0, 1, 1])
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
    this._matrixLocation = this._getUniformLocation("m");
    this._textureLocation = this._getUniformLocation("x");
    this._alphaTestLocation = this._getUniformLocation("j");

    this._width = this._gl.canvas.width;
    this._height = this._gl.canvas.height;
    this._count = 0;
    this._currentFrame = null;
    this._alphaTestMode = false;
  }

  private _createBuffer(
    type: number,
    src: ArrayBuffer | ArrayBufferView | null,
    usage?: number
  ) {
    this._gl.bindBuffer(type, this._gl.createBuffer());
    this._gl.bufferData(type, src, usage ?? GLConstants.STATIC_DRAW);
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
    if (this._alphaTestMode) {
      this._gl.disable(GLConstants.BLEND);
    } else {
      this._gl.enable(GLConstants.BLEND);
      this._gl.blendFunc(this._blend, GLConstants.ONE_MINUS_SRC_ALPHA);
    }

    this._gl.blendFunc(
      this._alphaTestMode ? GLConstants.ONE : this._blend,
      this._alphaTestMode ? GLConstants.ZERO : GLConstants.ONE_MINUS_SRC_ALPHA
    );
    this._gl.depthFunc(
      this._alphaTestMode ? GLConstants.LESS : GLConstants.LEQUAL
    );

    this._gl.bindTexture(GLConstants.TEXTURE_2D, this._currentFrame!.p!.t);
    this._gl.uniform1i(this._textureLocation, 0);
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
    if (this._count === maxBatch) {
      return;
    }
    const { frame } = sprite;
    const { uvs } = frame;

    if (this._currentFrame!.p.t !== frame.p.t) {
      this._currentFrame!.p.t && this._flush();
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
      (((sprite.tint & 0xffffff) << 8) | ((sprite._alpha * 255) & 255)) >>> 0;
    this._floatView[i] = sprite.layer!.z;

    this._count++;
  }

  render(source: Framebuffer, destination: Framebuffer) {
    this._textureRenderer.render(
      this._gl,
      source.texture!,
      destination.framebuffer
    );
    const { at, to, angle } = this._camera;

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

    
    this._gl.useProgram(this._program);
    this._gl.bindFramebuffer(GLConstants.FRAMEBUFFER, destination.framebuffer);
    this._gl.enable(GLConstants.BLEND);
    this._gl.enable(GLConstants.DEPTH_TEST);
    this._gl.viewport(0, 0, this._width, this._height);
    this._gl.uniformMatrix4fv(this._matrixLocation, false, projection);
    // this._gl.clear(GLConstants.COLOR_BUFFER_BIT | GLConstants.DEPTH_BUFFER_BIT);
    this._currentFrame = nullFrame;
    this._alphaTestMode = true;
    this._layers.forEach((layer) => layer.o.i(this._draw));
    this._flush();

    this._alphaTestMode = false;
    for (let l = this._layers.length - 1; l >= 0; l--) {
      this._layers[l].t.i(this._draw);
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

  texture(
    source: TexImageSource,
    alphaTest: number,
    smooth: boolean,
    mipmap: boolean
  ) {
    const srcWidth = source.width;
    const srcHeight = source.height;
    const t = this._gl.createTexture()!;

    this._gl.bindTexture(GLConstants.TEXTURE_2D, t);
    // NEAREST || LINEAR
    this._gl.texParameteri(
      GLConstants.TEXTURE_2D,
      GLConstants.TEXTURE_MAG_FILTER,
      GLConstants.NEAREST | +smooth
    );
    // NEAREST || LINEAR || NEAREST_MIPMAP_LINEAR || LINEAR_MIPMAP_LINEAR
    this._gl.texParameteri(
      GLConstants.TEXTURE_2D,
      GLConstants.TEXTURE_MIN_FILTER,
      GLConstants.NEAREST | +smooth | (+mipmap << 8) | (+mipmap << 1)
    );
    this._gl.texImage2D(
      GLConstants.TEXTURE_2D,
      0,
      GLConstants.RGBA,
      GLConstants.RGBA,
      GLConstants.UNSIGNED_BYTE,
      source
    );
    mipmap && this._gl.generateMipmap(GLConstants.TEXTURE_2D);

    return {
      size: new Point(srcWidth, srcHeight),
      anchor: new Point(),
      uvs: [0, 0, 1, 1],
      p: {
        a: alphaTest === 0 ? 0 : alphaTest || 1,
        t,
      },
      frame(origin: Point, size: Point, anchor?: Point): Frame {
        return {
          size,
          anchor: anchor || this.anchor,
          uvs: [
            origin.x / srcWidth,
            origin.y / srcHeight,
            size.x / srcWidth,
            size.y / srcHeight,
          ],
          p: this.p,
        };
      },
    };
  }
}

interface Frame {
  size?: Point;
  anchor?: Point;
  uvs?: [number, number, number, number];
  p: { a?: number; t: WebGLTexture };
}

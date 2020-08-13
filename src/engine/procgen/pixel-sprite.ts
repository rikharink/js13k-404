/**
 * Pixel Sprite Generator v0.0.2
 *
 * This is a TypeScript version of the javascript version of David Bollinger's pixelrobots and
 * pixelspaceships algorithm.
 *
 * Javascript license:
 * The MIT License (MIT)
 * Copyright (c) 2014 Zelimir Fedoran
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Javascript version:
 * https://github.com/zfedoran/pixel-sprite-generator/
 *
 * More info:
 * http://www.davebollinger.com/works/pixelrobots/
 * http://www.davebollinger.com/works/pixelspaceships/
 *
 * Archived website (links above are down):
 * http://web.archive.org/web/20080228054405/http://www.davebollinger.com/works/pixelrobots/
 * http://web.archive.org/web/20080228054410/http://www.davebollinger.com/works/pixelspaceships/
 *
 */

const enum MaskData {
  AlwaysBorder = -1,
  Empty = 0,
  EmptyBody = 1,
  BorderBody = 2,
}

export class Mask {
  public width: number;
  public height: number;
  public data: MaskData[];
  public mirrorX: boolean;
  public mirrorY: boolean;

  constructor(
    data: MaskData[],
    width: number,
    height: number,
    mirrorX?: boolean,
    mirrorY?: boolean
  ) {
    this.width = width;
    this.height = height;
    this.data = data;
    this.mirrorX = mirrorX ?? true;
    this.mirrorY = mirrorY ?? true;
  }
}

interface SpriteOptions {
  colored: boolean;
  edgeBrightness: number;
  colorVariations: number;
  brightnessNoise: number;
  saturation: number;
}

export class Sprite {
  width: number;
  height: number;
  mask: Mask;
  data: MaskData[];
  options: SpriteOptions;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  pixels: any;

  constructor(
    mask: Mask,
    {
      colored = true,
      edgeBrightness = 0.3,
      colorVariations = 0.2,
      brightnessNoise = 0.3,
      saturation = 0.5,
    }: SpriteOptions
  ) {
    this.width = mask.width * (mask.mirrorX ? 2 : 1);
    this.height = mask.height * (mask.mirrorY ? 2 : 1);
    this.mask = mask;
    this.data = new Array(this.width * this.height);

    this.options = {
      colored,
      edgeBrightness,
      colorVariations,
      brightnessNoise,
      saturation,
    };

    this.init();
  }

  init() {
    this.initCanvas();
    this.initContext();
    this.initData();

    this.applyMask();
    this.generateRandomSample();

    if (this.mask.mirrorX) {
      this.mirrorX();
    }

    if (this.mask.mirrorY) {
      this.mirrorY();
    }

    this.generateEdges();
    this.renderPixelData();
  }

  initCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initContext() {
    this.ctx = this.canvas.getContext("2d")!;
    this.pixels = this.ctx.createImageData(this.width, this.height);
  }

  getData(x: number, y: number) {
    return this.data[y * this.width + x];
  }

  setData(x: number, y: number, value: MaskData) {
    this.data[y * this.width + x] = value;
  }

  initData() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.setData(x, y, -1);
      }
    }
  }

  applyMask() {
    const w = this.mask.width;
    for (let y = 0; y < this.mask.height; y++) {
      for (let x = 0; x < w; x++) {
        this.setData(x, y, this.mask.data[y * w + x]);
      }
    }
  }

  generateRandomSample() {
    const h = this.height;
    const w = this.width;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const val = this.getData(x, y);
        if (val === MaskData.EmptyBody) {
          this.setData(x, y, val * Math.round(Math.random()));
        } else if (val === MaskData.BorderBody) {
          if (Math.random() > 0.5) {
            this.setData(x, y, 1);
          } else {
            this.setData(x, y, -1);
          }
        }
      }
    }
  }

  mirrorX() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < Math.floor(this.width / 2); x++) {
        this.setData(this.width - x - 1, y, this.getData(x, y));
      }
    }
  }

  mirrorY() {
    for (let y = 0; y < Math.floor(this.height / 2); y++) {
      for (let x = 0; x < this.width; x++) {
        this.setData(x, this.height - y - 1, this.getData(x, y));
      }
    }
  }

  generateEdges() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.getData(x, y) > 0) {
          if (y - 1 >= 0 && this.getData(x, y - 1) === 0) {
            this.setData(x, y - 1, -1);
          }
          if (y + 1 < this.height && this.getData(x, y + 1) === 0) {
            this.setData(x, y + 1, -1);
          }
          if (x - 1 >= 0 && this.getData(x - 1, y) === 0) {
            this.setData(x - 1, y, -1);
          }
          if (x + 1 < this.width && this.getData(x + 1, y) === 0) {
            this.setData(x + 1, y, -1);
          }
        }
      }
    }
  }

  renderPixelData() {
    const isVerticalGradient = Math.random() > 0.5;
    const saturation = Math.max(
      Math.min(Math.random() * this.options.saturation, 1),
      0
    );
    let hue = Math.random();
    let ulen, vlen;
    if (isVerticalGradient) {
      ulen = this.height;
      vlen = this.width;
    } else {
      ulen = this.width;
      vlen = this.height;
    }

    for (let u = 0; u < ulen; u++) {
      // Create a non-uniform random number between 0 and 1 (lower numbers more likely)
      let isNewColor = Math.abs(
        (Math.random() * 2 -
          1 +
          (Math.random() * 2 - 1) +
          (Math.random() * 2 - 1)) /
          3
      );

      // Only change the color sometimes (values above 0.8 are less likely than others)
      if (isNewColor > 1 - this.options.colorVariations) {
        hue = Math.random();
      }

      for (let v = 0; v < vlen; v++) {
        let val, index;
        if (isVerticalGradient) {
          val = this.getData(v, u);
          index = (u * vlen + v) * 4;
        } else {
          val = this.getData(u, v);
          index = (v * ulen + u) * 4;
        }

        let rgb = { r: 1, g: 1, b: 1 };

        if (val !== 0) {
          if (this.options.colored) {
            // Fade brightness away towards the edges
            let brightness =
              Math.sin((u / ulen) * Math.PI) *
                (1 - this.options.brightnessNoise) +
              Math.random() * this.options.brightnessNoise;

            // Get the RGB color value
            this.hslToRgb(hue, saturation, brightness, rgb);

            // If this is an edge, then darken the pixel
            if (val === -1) {
              rgb.r *= this.options.edgeBrightness;
              rgb.g *= this.options.edgeBrightness;
              rgb.b *= this.options.edgeBrightness;
            }
          } else {
            // Not colored, simply output black
            if (val === -1) {
              rgb.r = 0;
              rgb.g = 0;
              rgb.b = 0;
            }
          }
        }

        this.pixels.data[index + 0] = rgb.r * 255;
        this.pixels.data[index + 1] = rgb.g * 255;
        this.pixels.data[index + 2] = rgb.b * 255;
        this.pixels.data[index + 3] = 255;
      }
    }

    this.ctx.putImageData(this.pixels, 0, 0);
  }

  hslToRgb(
    h: number,
    s: number,
    l: number,
    result?: { r: number; g: number; b: number }
  ) {
    result = result ?? { r: 0, g: 0, b: 0 };

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = l * (1 - s);
    const q = l * (1 - f * s);
    const t = l * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        (result.r = l), (result.g = t), (result.b = p);
        break;
      case 1:
        (result.r = q), (result.g = l), (result.b = p);
        break;
      case 2:
        (result.r = p), (result.g = l), (result.b = t);
        break;
      case 3:
        (result.r = p), (result.g = q), (result.b = l);
        break;
      case 4:
        (result.r = t), (result.g = p), (result.b = l);
        break;
      case 5:
        (result.r = l), (result.g = p), (result.b = q);
        break;
    }

    return result;
  }

  toString() {
    let output = "";
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        var val = this.getData(x, y);
        output += val >= 0 ? " " + val : "" + val;
      }
      output += "\n";
    }
    return output;
  }
}

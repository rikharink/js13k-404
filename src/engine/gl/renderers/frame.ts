import { Point } from "./point";

export class Frame {
  size?: Point;
  anchor: Point;
  uvs?: [number, number, number, number];
  p!: { a?: number; t: WebGLTexture; };
  srcWidth: number;
  srcHeight: number;

  constructor(
    srcWidth: number,
    srcHeight: number,
    size: Point,
    anchor: Point,
    uvs: [number, number, number, number],
    p: { a?: number; t: WebGLTexture; }
  ) {
    this.srcWidth = srcWidth;
    this.srcHeight = srcHeight;
    this.size = size;
    this.anchor = anchor;
    this.uvs = uvs;
    this.p = p;
  }

  frame(origin: Point, size: Point, anchor?: Point) {
    return new Frame(
      this.srcWidth,
      this.srcHeight,
      size,
      anchor || this.anchor,
      [
        origin.x / this.srcWidth,
        origin.y / this.srcHeight,
        size.x / this.srcWidth,
        size.y / this.srcHeight,
      ],
      this.p
    );
  }
}

export class Point {
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

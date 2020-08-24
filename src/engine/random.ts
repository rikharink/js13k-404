export class Random {
  private _seedString!: string;
  private _seed!: () => number;
  public random!: () => number;

  public set seed(seed: string) {
    this._seedString = seed;
    this._seed = this.xmur3(seed);
    this.random = this.sfc32(
      this._seed(),
      this._seed(),
      this._seed(),
      this._seed()
    );
  }

  public rand(min: number, max?: number): number {
    if (!max) {
      max = min;
      min = 0;
    }
    return this.random() * (max - min) + min;
  }

  public randInt(min: number, max?: number): number {
    if (!max) {
      max = min;
      min = 0;
    }
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  public reset() {
    this.seed = this._seedString;
  }

  public get seed() {
    return this._seedString;
  }

  public get seedNumber(){
    return this._seed;
  }

  constructor(seed: string) {
    this.seed = seed;
  }

  xmur3(str: string) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
      (h = Math.imul(h ^ str.charCodeAt(i), 3432918353)),
        (h = (h << 13) | (h >>> 19));
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  sfc32(a: number, b: number, c: number, d: number) {
    return function () {
      a >>>= 0;
      b >>>= 0;
      c >>>= 0;
      d >>>= 0;
      var t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }
}

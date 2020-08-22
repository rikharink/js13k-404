import { List } from "../list";
import { Sprite } from "./sprite";
export class Layer {
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
    sprite.node = (sprite.alpha !== 1 || sprite.frame.p.a === 0
      ? this.t
      : this.o
    ).add(sprite);
  }
}

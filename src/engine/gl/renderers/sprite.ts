import { Node } from "../list";
import { Layer } from "./layer";
import { Point } from "./point";
import { Frame } from "./frame";

export interface SpriteProps {
    frame?: Frame;
    visible?: boolean;
    position?: Point;
    rotation?: number;
    scale?: Point;
    tint?: number;
    alpha?: number;
    list?: Layer | null;
    node?: Node | null;
  }

export class Sprite {
  malpha: number;
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
      node = null, }: SpriteProps
  ) {
    this.frame = frame;
    this.visible = visible;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.tint = tint;
    this.malpha = alpha;
    this.layer = list;
    this.node = node;
  }

  get alpha() {
    return this.malpha;
  }

  set alpha(value) {
    const change = (value < 1 && this.alpha === 1) || (value === 1 && this.alpha < 1);
    this.malpha = value;
    change && this.frame!.p!.a! > 0 && this.layer && this.layer.add(this);
  }

  remove() {
    this.node && this.node.r();
    this.layer = null;
    this.node = null;
  }
}

export class Node {
  public list: List;
  public cargo: any;
  public next: Node | null;
  public previous: Node | null;
  constructor(list: List, cargo: any, next: Node | null) {
    this.list = list;
    this.cargo = cargo;
    this.next = next;
    this.previous = null;
  }

  r() {
    if (this.previous) {
      this.previous.next = this.next;
    } else {
      this.list.h = this.next;
    }
    this.next && (this.next.previous = this.previous);
  }
}

export class List {
  public h: Node | null;
  constructor() {
    this.h = null;
  }

  add(cargo: any) {
    const node = new Node(this, cargo, this.h);
    this.h && (this.h.previous = node);
    this.h = node;
    return node;
  }

  i(fn: (cargo: any) => void) {
    let node = this.h;
    while (node) {
      fn(node.cargo);
      node = node.next;
    }
  }
}

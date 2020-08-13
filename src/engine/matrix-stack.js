import { identity, zRotate, scale,  translate } from "./math/m4";

export class MatrixStack {
    stack = [identity()];

    restore() {
        this.stack.pop();
        if (this.stack.length < 1) {
            this.stack[0] = identity();
        }
    }

    save() {
        this.stack.push(this.getCurrentMatrix());
    }

    getCurrentMatrix() {
        return this.stack[this.stack.length - 1].slice();
    }

    setCurrentMatrix(m) {
        return this.stack[this.stack.length - 1] = m;
    }

    translate(x, y, z = 0) {
        this.setCurrentMatrix(translate(this.getCurrentMatrix(), x, y, z))
    }

    rotateZ(angle) {
        this.setCurrentMatrix(zRotate(this.getCurrentMatrix(), angle));
    }

    scale(x, y, z = 0) {
        this.setCurrentMatrix(scale(this.getCurrentMatrix(), x, y, z));
    }
}
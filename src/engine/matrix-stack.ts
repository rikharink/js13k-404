import { m4, identity, zRotate, scale,  translate } from "./math/m4";

const dst = new Float32Array(16);

export class MatrixStack {
    stack = [identity(dst)];

    restore() {
        this.stack.pop();
        if (this.stack.length < 1) {
            this.stack[0] = identity(dst);
        }
    }

    save() {
        this.stack.push(this.getCurrentMatrix());
    }

    getCurrentMatrix() {
        return this.stack[this.stack.length - 1].slice();
    }

    setCurrentMatrix(m: m4) {
        return this.stack[this.stack.length - 1] = m;
    }

    translate(x: number, y: number, z = 0) {
        this.setCurrentMatrix(translate(this.getCurrentMatrix(), x, y, z, dst))
    }

    rotateZ(angle: number) {
        this.setCurrentMatrix(zRotate(this.getCurrentMatrix(), angle, dst));
    }

    scale(x: number, y: number, z: number = 0) {
        this.setCurrentMatrix(scale(this.getCurrentMatrix(), x, y, z, dst));
    }
}
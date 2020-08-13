import { orthographic, translate, scale, translation } from "./math/m4";

const dst = new Float32Array(16);

export class Sprite {
    constructor(gl, shader, img, position, shape, frames, tint, timePerFrame) {
        this.gl = gl;
        this.width = shape[0];
        this.height = shape[1];
        this.frames = frames;
        this.tint = tint;
        this.timePerFrame = timePerFrame;
        this.img = img;
        this.program = shader;
        this.currentFrame = 0;
        this.texX = 0;
        this.texY = 0;
        this.x = position[0];
        this.y = position[1];
        this.dt = 0;
    }

    prepare() {
        this.tex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.img);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.texcoordAttributeLocation = this.gl.getAttribLocation(this.program, "a_texcoord");
        this.matrixLocation = this.gl.getUniformLocation(this.program, "u_matrix");
        this.textureLocation = this.gl.getUniformLocation(this.program, "u_texture");
        this.colorLocation = this.gl.getUniformLocation(this.program, "u_color");
        this.textureMatrixLocation = this.gl.getUniformLocation(this.program, "u_textureMatrix");
        this.vao = this.gl.createVertexArray();
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.positions = [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);


        this.texcoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
        this.texcoords = [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.texcoords), this.gl.STATIC_DRAW);
    }

    render(deltaTime) {
        this.animate(deltaTime);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.texcoordAttributeLocation);
        this.gl.vertexAttribPointer(this.texcoordAttributeLocation, 2, this.gl.FLOAT, true, 0, 0);
        const texWidth = this.width * this.frames;
        const texHeight = this.height;
        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);
        const textureUnit = 0;
        this.gl.uniform1i(this.textureLocation, textureUnit);
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
        let matrix = orthographic(0, this.gl.canvas.clientWidth, this.gl.canvas.clientHeight, 0, -1, 1, dst);
        matrix = translate(matrix, this.x, this.y, 0);
        matrix = scale(matrix, 32, 32, 1);
        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);
        let texMatrix = translation(this.texX / texWidth, this.texY / texHeight, 0);
        texMatrix = scale(texMatrix, this.width / texWidth, this.height / texHeight, 1);
        this.gl.uniformMatrix4fv(this.textureMatrixLocation, false, texMatrix);
        this.gl.uniform4f(this.colorLocation, this.tint[0], this.tint[1], this.tint[2], this.tint[3]);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    animate(deltaTime) {
        this.dt += deltaTime;
        if (this.dt >= this.timePerFrame) {
            this.dt = 0;
            this.nextFrame();
        }
    }

    nextFrame() {
        this.currentFrame++;
        if (this.currentFrame > this.frames - 1) {
            this.currentFrame = 0;
        }
        this.texX = this.width * this.currentFrame;
    }
}
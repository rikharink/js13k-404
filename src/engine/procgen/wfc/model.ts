/** Adapted and ported to typescript from https://github.com/kchapelier/wavefunctioncollapse 
 * 
 * The MIT License (MIT)
 * Copyright (c) 2014 Kevin Chapelier
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
*/

import { randomIndice } from "./random-indice";

export abstract class Model {
  FMX = 0;
  FMY = 0;
  FMXxFMY = 0;
  T = 0;
  N = 0;
  initiliazedField = false;
  generationComplete = false;

  wave: boolean[][] = [];
  compatible: number[][][] = [];
  weightLogWeights: number[] = [];
  sumOfWeights = 0;
  sumOfWeightLogWeights = 0;

  startingEntropy = 0;

  sumsOfOnes: number[] = [];
  sumsOfWeights: number[] = [];
  sumsOfWeightLogWeights: number[] = [];
  weights: number[] = [];
  entropies: number[] = [];

  propagator: number[][][] = [];
  observed: number[] = [];
  distribution: number[] = [];

  stack: number[][] = [];
  stackSize = 0;

  DX = [-1, 0, 1, 0];
  DY = [0, 1, 0, -1];
  opposite = [2, 3, 0, 1];

  protected initialize() {
    this.distribution = new Array(this.T);

    this.wave = new Array(this.FMXxFMY);
    this.compatible = new Array(this.FMXxFMY);

    for (let i = 0; i < this.FMXxFMY; i++) {
      this.wave[i] = new Array(this.T);
      this.compatible[i] = new Array(this.T);

      for (let t = 0; t < this.T; t++) {
        this.compatible[i][t] = [0, 0, 0, 0];
      }
    }

    this.weightLogWeights = new Array(this.T);
    this.sumOfWeights = 0;
    this.sumOfWeightLogWeights = 0;

    for (let t = 0; t < this.T; t++) {
      this.weightLogWeights[t] = this.weights[t] * Math.log(this.weights[t]);
      this.sumOfWeights += this.weights[t];
      this.sumOfWeightLogWeights += this.weightLogWeights[t];
    }

    this.startingEntropy =
      Math.log(this.sumOfWeights) -
      this.sumOfWeightLogWeights / this.sumOfWeights;

    this.sumsOfOnes = new Array(this.FMXxFMY);
    this.sumsOfWeights = new Array(this.FMXxFMY);
    this.sumsOfWeightLogWeights = new Array(this.FMXxFMY);
    this.entropies = new Array(this.FMXxFMY);

    this.stack = new Array(this.FMXxFMY * this.T);
    this.stackSize = 0;
  }

  protected observe(rng: () => number) {
    let min = 1000;
    let argmin = -1;

    for (let i = 0; i < this.FMXxFMY; i++) {
      if (this.onBoundary(i % this.FMX, (i / this.FMX) | 0)) continue;

      const amount = this.sumsOfOnes[i];

      if (amount === 0) return false;

      const entropy = this.entropies[i];

      if (amount > 1 && entropy <= min) {
        const noise = 0.000001 * rng();

        if (entropy + noise < min) {
          min = entropy + noise;
          argmin = i;
        }
      }
    }

    if (argmin === -1) {
      this.observed = new Array(this.FMXxFMY);

      for (let i = 0; i < this.FMXxFMY; i++) {
        for (let t = 0; t < this.T; t++) {
          if (this.wave[i][t]) {
            this.observed[i] = t;
            break;
          }
        }
      }

      return true;
    }

    for (let t = 0; t < this.T; t++) {
      this.distribution[t] = this.wave[argmin][t] ? this.weights[t] : 0;
    }
    const r = randomIndice(this.distribution!, rng());

    const w = this.wave[argmin];
    for (let t = 0; t < this.T; t++) {
      if (w[t] !== (t === r)) {
        this.ban(argmin, t);
      }
    }

    return null;
  }

  protected abstract onBoundary(x: number, y: number): boolean;

  protected propagate() {
    while (this.stackSize > 0) {
      const e1 = this.stack[this.stackSize - 1];
      this.stackSize--;

      const i1 = e1[0];
      const x1 = i1 % this.FMX;
      const y1 = (i1 / this.FMX) | 0;

      for (let d = 0; d < 4; d++) {
        const dx = this.DX[d];
        const dy = this.DY[d];

        let x2 = x1 + dx;
        let y2 = y1 + dy;

        if (this.onBoundary(x2, y2)) {
          continue;
        }

        if (x2 < 0) x2 += this.FMX;
        else if (x2 >= this.FMX) x2 -= this.FMX;
        if (y2 < 0) y2 += this.FMY;
        else if (y2 >= this.FMY) y2 -= this.FMY;

        const i2 = x2 + y2 * this.FMX;
        const p = this.propagator[d][e1[1]];
        const compat = this.compatible[i2];

        for (let l = 0; l < p.length; l++) {
          const t2 = p[l];
          const comp = compat[t2];
          comp[d]--;
          if (comp[d] == 0) this.ban(i2, t2);
        }
      }
    }
  }

  public singleIteration(rng: () => number) {
    const result = this.observe(rng);

    if (result !== null) {
      this.generationComplete = result;

      return !!result;
    }

    this.propagate();

    return null;
  }

  public iterate(iterations: number, rng: () => number): boolean {
    if (!this.wave) {
      this.initialize();
    }

    if (!this.initiliazedField) {
      this.clear();
    }

    iterations = iterations || 0;
    rng = rng || Math.random;

    for (let i = 0; i < iterations || iterations === 0; i++) {
      const result = this.singleIteration(rng);

      if (result !== null) {
        return !!result;
      }
    }

    return true;
  }

  public generate(rng: () => number) {
    rng = rng || Math.random;

    if (!this.wave) {
      this.initialize();
    }
    this.clear();
    while (true) {
      const result = this.singleIteration(rng);

      if (result !== null) {
        return !!result;
      }
    }
  }

  public isGenerationComplete(): boolean {
    return this.generationComplete;
  }

  protected ban(i: number, t: number) {
    const comp = this.compatible[i][t];

    for (let d = 0; d < 4; d++) {
      comp[d] = 0;
    }

    this.wave[i][t] = false;

    this.stack[this.stackSize] = [i, t];
    this.stackSize++;

    this.sumsOfOnes[i] -= 1;
    this.sumsOfWeights[i] -= this.weights[t];
    this.sumsOfWeightLogWeights[i] -= this.weightLogWeights[t];

    const sum = this.sumsOfWeights[i];
    this.entropies[i] = Math.log(sum) - this.sumsOfWeightLogWeights[i] / sum;
  }

  protected clear() {
    for (let i = 0; i < this.FMXxFMY; i++) {
      for (let t = 0; t < this.T; t++) {
        this.wave[i][t] = true;

        for (let d = 0; d < 4; d++) {
          this.compatible[i][t][d] = this.propagator[this.opposite[d]][
            t
          ].length;
        }
      }

      this.sumsOfOnes[i] = this.weights.length;
      this.sumsOfWeights[i] = this.sumOfWeights;
      this.sumsOfWeightLogWeights[i] = this.sumOfWeightLogWeights;
      this.entropies[i] = this.startingEntropy;
    }

    this.initiliazedField = true;
    this.generationComplete = false;
  }
}

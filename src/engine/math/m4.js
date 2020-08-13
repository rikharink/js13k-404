import { normalize, subtract, cross } from "./v3";

export function orthographic(left, right, bottom, top, near, far, dst) {
  return copy16(
    2 / (right - left),
    0,
    0,
    0,
    0,
    2 / (top - bottom),
    0,
    0,
    0,
    0,
    2 / (near - far),
    0,
    (left + right) / (left - right),
    (bottom + top) / (bottom - top),
    (near + far) / (near - far),
    1,
    dst || new Float32Array(16)
  );
}

export function perspective(fov, aspect, near, far, dst) {
  const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
  const rangeInv = 1.0 / (near - far);
  return copy16(
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (near + far) * rangeInv,
    -1,
    0,
    0,
    near * far * rangeInv * 2,
    0,
    dst || new Float32Array(16)
  );
}

export function projection(width, height, depth, dst) {
  return copy16(
    2 / width,
    0,
    0,
    0,
    0,
    -2 / height,
    0,
    0,
    0,
    0,
    2 / depth,
    0,
    -1,
    1,
    0,
    1,
    dst || new Float32Array(16)
  );
}

export function multiply(a, b) {
  a[0] =
    b[0 * 4 + 0] * a[0 * 4 + 0] +
    b[0 * 4 + 1] * a[1 * 4 + 0] +
    b[0 * 4 + 2] * a[2 * 4 + 0] +
    b[0 * 4 + 3] * a[3 * 4 + 0];
  a[1] =
    b[0 * 4 + 0] * a[0 * 4 + 1] +
    b[0 * 4 + 1] * a[1 * 4 + 1] +
    b[0 * 4 + 2] * a[2 * 4 + 1] +
    b[0 * 4 + 3] * a[3 * 4 + 1];
  a[2] =
    b[0 * 4 + 0] * a[0 * 4 + 2] +
    b[0 * 4 + 1] * a[1 * 4 + 2] +
    b[0 * 4 + 2] * a[2 * 4 + 2] +
    b[0 * 4 + 3] * a[3 * 4 + 2];
  a[3] =
    b[0 * 4 + 0] * a[0 * 4 + 3] +
    b[0 * 4 + 1] * a[1 * 4 + 2] +
    b[0 * 4 + 2] * a[2 * 4 + 3] +
    b[0 * 4 + 3] * a[3 * 4 + 3];
  a[4] =
    b[1 * 4 + 0] * a[0 * 4 + 0] +
    b[1 * 4 + 1] * a[1 * 4 + 0] +
    b[1 * 4 + 2] * a[2 * 4 + 0] +
    b[1 * 4 + 3] * a[3 * 4 + 0];
  a[5] =
    b[1 * 4 + 0] * a[0 * 4 + 1] +
    b[1 * 4 + 1] * a[1 * 4 + 1] +
    b[1 * 4 + 2] * a[2 * 4 + 1] +
    b[1 * 4 + 3] * a[3 * 4 + 1];
  a[6] =
    b[1 * 4 + 0] * a[0 * 4 + 2] +
    b[1 * 4 + 1] * a[1 * 4 + 2] +
    b[1 * 4 + 2] * a[2 * 4 + 2] +
    b[1 * 4 + 3] * a[3 * 4 + 2];
  a[7] =
    b[1 * 4 + 0] * a[0 * 4 + 3] +
    b[1 * 4 + 1] * a[1 * 4 + 2] +
    b[1 * 4 + 2] * a[2 * 4 + 3] +
    b[1 * 4 + 3] * a[3 * 4 + 3];
  a[8] =
    b[2 * 4 + 0] * a[0 * 4 + 0] +
    b[2 * 4 + 1] * a[1 * 4 + 0] +
    b[2 * 4 + 2] * a[2 * 4 + 0] +
    b[2 * 4 + 3] * a[3 * 4 + 0];
  a[9] =
    b[2 * 4 + 0] * a[0 * 4 + 1] +
    b[2 * 4 + 1] * a[1 * 4 + 1] +
    b[2 * 4 + 2] * a[2 * 4 + 1] +
    b[2 * 4 + 3] * a[3 * 4 + 1];
  a[10] =
    b[2 * 4 + 0] * a[0 * 4 + 2] +
    b[2 * 4 + 1] * a[1 * 4 + 2] +
    b[2 * 4 + 2] * a[2 * 4 + 2] +
    b[2 * 4 + 3] * a[3 * 4 + 2];
  a[11] =
    b[2 * 4 + 0] * a[0 * 4 + 3] +
    b[2 * 4 + 1] * a[1 * 4 + 2] +
    b[2 * 4 + 2] * a[2 * 4 + 3] +
    b[2 * 4 + 3] * a[3 * 4 + 3];
  a[12] =
    b[3 * 4 + 0] * a[0 * 4 + 0] +
    b[3 * 4 + 1] * a[1 * 4 + 0] +
    b[3 * 4 + 2] * a[2 * 4 + 0] +
    b[3 * 4 + 3] * a[3 * 4 + 0];
  a[13] =
    b[3 * 4 + 0] * a[0 * 4 + 1] +
    b[3 * 4 + 1] * a[1 * 4 + 1] +
    b[3 * 4 + 2] * a[2 * 4 + 1] +
    b[3 * 4 + 3] * a[3 * 4 + 1];
  a[14] =
    b[3 * 4 + 0] * a[0 * 4 + 2] +
    b[3 * 4 + 1] * a[1 * 4 + 2] +
    b[3 * 4 + 2] * a[2 * 4 + 2] +
    b[3 * 4 + 3] * a[3 * 4 + 2];
  a[15] =
    b[3 * 4 + 0] * a[0 * 4 + 3] +
    b[3 * 4 + 1] * a[1 * 4 + 2] +
    b[3 * 4 + 2] * a[2 * 4 + 3] +
    b[3 * 4 + 3] * a[3 * 4 + 3];
  return a;
}

export function translation(tx, ty, tz, dst) {
  return copy16(
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    tx,
    ty,
    tz,
    1,
    dst || new Float32Array(16)
  );
}

export function xRotation(angleInRadians, dst) {
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  return copy16(
    1,
    0,
    0,
    0,
    0,
    c,
    s,
    0,
    0,
    -s,
    c,
    0,
    0,
    0,
    0,
    1,
    dst || new Float32Array(16)
  );
}

export function yRotation(angleInRadians, dst) {
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  return copy16(
    c,
    0,
    -s,
    0,
    0,
    1,
    0,
    0,
    s,
    0,
    c,
    0,
    0,
    0,
    0,
    1,
    dst || new Float32Array(16)
  );
}

export function zRotation(angleInRadians, dst) {
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  return copy16(
    c,
    s,
    0,
    0,
    -s,
    c,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    dst || new Float32Array(16)
  );
}

export function scaling(sx, sy, sz, dst) {
  return copy16(
    sx,
    0,
    0,
    0,
    0,
    sy,
    0,
    0,
    0,
    0,
    sz,
    0,
    0,
    0,
    0,
    1,
    dst || new Float32Array(16)
  );
}
const temp = new Float32Array(16);
export function translate(m, tx, ty, tz, dst) {
  return multiply(m, translation(tx, ty, tz, temp), dst);
}

export function xRotate(m, angleInRadians, dst) {
  return multiply(m, xRotation(angleInRadians, temp), dst);
}

export function yRotate(m, angleInRadians, dst) {
  return multiply(m, yRotation(angleInRadians, temp), dst);
}

export function zRotate(m, angleInRadians, dst) {
  return multiply(m, zRotation(angleInRadians, temp), dst);
}

export function scale(m, sx, sy, sz, dst) {
  return multiply(m, scaling(sx, sy, sz, temp), dst);
}

export function inverse(m, dst) {
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  const tmp_0 = m22 * m33;
  const tmp_1 = m32 * m23;
  const tmp_2 = m12 * m33;
  const tmp_3 = m32 * m13;
  const tmp_4 = m12 * m23;
  const tmp_5 = m22 * m13;
  const tmp_6 = m02 * m33;
  const tmp_7 = m32 * m03;
  const tmp_8 = m02 * m23;
  const tmp_9 = m22 * m03;
  const tmp_10 = m02 * m13;
  const tmp_11 = m12 * m03;
  const tmp_12 = m20 * m31;
  const tmp_13 = m30 * m21;
  const tmp_14 = m10 * m31;
  const tmp_15 = m30 * m11;
  const tmp_16 = m10 * m21;
  const tmp_17 = m20 * m11;
  const tmp_18 = m00 * m31;
  const tmp_19 = m30 * m01;
  const tmp_20 = m00 * m21;
  const tmp_21 = m20 * m01;
  const tmp_22 = m00 * m11;
  const tmp_23 = m10 * m01;

  const t0 =
    tmp_0 * m11 +
    tmp_3 * m21 +
    tmp_4 * m31 -
    (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
  const t1 =
    tmp_1 * m01 +
    tmp_6 * m21 +
    tmp_9 * m31 -
    (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
  const t2 =
    tmp_2 * m01 +
    tmp_7 * m11 +
    tmp_10 * m31 -
    (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
  const t3 =
    tmp_5 * m01 +
    tmp_8 * m11 +
    tmp_11 * m21 -
    (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

  const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

  return copy16(
    d * t0,
    d * t1,
    d * t2,
    d * t3,
    d *
      (tmp_1 * m10 +
        tmp_2 * m20 +
        tmp_5 * m30 -
        (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
    d *
      (tmp_0 * m00 +
        tmp_7 * m20 +
        tmp_8 * m30 -
        (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
    d *
      (tmp_3 * m00 +
        tmp_6 * m10 +
        tmp_11 * m30 -
        (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
    d *
      (tmp_4 * m00 +
        tmp_9 * m10 +
        tmp_10 * m20 -
        (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
    d *
      (tmp_12 * m13 +
        tmp_15 * m23 +
        tmp_16 * m33 -
        (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
    d *
      (tmp_13 * m03 +
        tmp_18 * m23 +
        tmp_21 * m33 -
        (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
    d *
      (tmp_14 * m03 +
        tmp_19 * m13 +
        tmp_22 * m33 -
        (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
    d *
      (tmp_17 * m03 +
        tmp_20 * m13 +
        tmp_23 * m23 -
        (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
    d *
      (tmp_14 * m22 +
        tmp_17 * m32 +
        tmp_13 * m12 -
        (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
    d *
      (tmp_20 * m32 +
        tmp_12 * m02 +
        tmp_19 * m22 -
        (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
    d *
      (tmp_18 * m12 +
        tmp_23 * m32 +
        tmp_15 * m02 -
        (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
    d *
      (tmp_22 * m22 +
        tmp_16 * m02 +
        tmp_21 * m12 -
        (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)),
    dst || new Float32Array(16)
  );
}

export function transformVector(m, v) {
  for (let i = 0; i < 4; ++i) {
    m[i] = 0.0;
    for (let j = 0; j < 4; ++j) {
      m[i] += v[j] * m[j * 4 + i];
    }
  }
  return m;
}

const tempVecA = [0, 0, 0];
const tempVecB = [0, 0, 0];
const tempVecC = [0, 0, 0];
export function lookAt(cameraPosition, target, up, dst) {
  const zAxis = normalize(subtract(cameraPosition, target, tempVecA), tempVecA);
  const xAxis = normalize(cross(up, zAxis, tempVecB), tempVecB);
  const yAxis = normalize(cross(zAxis, xAxis, tempVecC), tempVecC);

  return copy16(
    xAxis[0],
    xAxis[1],
    xAxis[2],
    0,
    yAxis[0],
    yAxis[1],
    yAxis[2],
    0,
    zAxis[0],
    zAxis[1],
    zAxis[2],
    0,
    cameraPosition[0],
    cameraPosition[1],
    cameraPosition[2],
    1,
    dst || new Float32Array(16)
  );
}

export function transpose(m, dst) {
  return copy16(
    m[0],
    m[4],
    m[8],
    m[12],
    m[1],
    m[5],
    m[9],
    m[13],
    m[2],
    m[6],
    m[10],
    m[14],
    m[3],
    m[7],
    m[11],
    m[15],
    dst || new Float32Array(16)
  );
}

export function identity(dst) {
  return copy16(
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    dst || new Float32Array(16)
  );
}

function copy16(a, b, c, d, e, f, g, h, j, i, k, l, m, n, o, p, dst) {
  dst[0] = a;
  dst[1] = b;
  dst[2] = c;
  dst[3] = d;
  dst[4] = e;
  dst[5] = f;
  dst[6] = g;
  dst[7] = h;
  dst[8] = i;
  dst[9] = j;
  dst[10] = k;
  dst[11] = l;
  dst[12] = m;
  dst[13] = n;
  dst[14] = o;
  dst[15] = p;
  return dst;
}

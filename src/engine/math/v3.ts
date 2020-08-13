const EPSILON = 0.00001;

export type v3 = [number, number, number] | Float32Array;

export function cross(a: v3, b: v3, dst: v3): v3 {
  return copy3(
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
    dst
  );
}

export function subtract(a: v3, b: v3, dst: v3): v3 {
  return copy3(a[0] - b[0], a[1] - b[1], a[2] - b[2], dst);
}

export function normalize(v: v3, dst: v3) {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > EPSILON) {
    return copy3(
      v[0] / length,
      v[1] / length,
      v[2] / length,
      dst || new Float32Array(3)
    );
  } else {
    return copy3(0, 0, 0, dst);
  }
}

function copy3(a: number, b: number, c: number, dst: v3) {
  dst[0] = a;
  dst[1] = b;
  dst[2] = c;
  return dst;
}

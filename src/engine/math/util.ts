export function random(min: number, max: number) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number) {
  return Math.floor(random(min, max));
}

export function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number) {
  return (radians * 180) / Math.PI;
}

export function ease(t: number) {
  return Math.cos(t) * 0.5 + 0.5;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function easeLerp(a: number, b: number, t: number) {
  return lerp(a, b, ease(t));
}

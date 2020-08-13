export function random(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(random(min, max));
}

export function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

export function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

export function ease(t) {
  return Math.cos(t) * .5 + .5;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeLerp(a, b, t) {
  return lerp(a, b, ease(t));
}

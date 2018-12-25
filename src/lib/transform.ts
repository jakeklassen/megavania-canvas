export function Transform({ x = 0, y = 0, rotation = 0 }) {
  return Object.freeze({
    get x() {
      return x;
    },

    set x(value) {
      x = value;
    },

    get y() {
      return y;
    },

    set y(value) {
      y = value;
    },

    get rotation() {
      return rotation;
    },

    set rotation(value) {
      rotation = value;
    },
  });
}

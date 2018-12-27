export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export const rectangleFactory = (
  x: number,
  y: number,
  width: number,
  height: number,
): Rectangle => ({
  x,
  y,
  width,
  height,
  get left() {
    return this.x;
  },
  get right() {
    return this.x + this.width;
  },
  get top() {
    return this.y;
  },
  get bottom() {
    return this.y + this.height;
  },
});

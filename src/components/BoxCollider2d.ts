import { Component } from '@jakeklassen/ecs';

export class BoxCollider2d extends Component {
  constructor(
    public x = 0,
    public y = 0,
    public readonly width = 0,
    public readonly height = 0,
  ) {
    super();
  }

  get left() {
    return this.x;
  }

  get right() {
    return this.x + this.width;
  }

  get top() {
    return this.y;
  }

  get bottom() {
    return this.y + this.height;
  }

  get centerX() {
    return this.x + this.width / 2;
  }
}

const bc = new BoxCollider2d(0, 0, 10, 10);

console.log(JSON.stringify(bc));

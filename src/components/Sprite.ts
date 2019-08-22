import { Component } from '@jakeklassen/ecs';

export class Sprite extends Component {
  constructor(public texture: ImageBitmap) {
    super();
  }
}

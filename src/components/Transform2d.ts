import { Component } from '@jakeklassen/ecs';
import { Vector2d } from '../lib/vector2d';

export class Transform2d extends Component {
  constructor(public position = Vector2d.Zero()) {
    super();
  }
}

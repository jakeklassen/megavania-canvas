import { Rectangle } from './rectangle';

// https://developer.mozilla.org/kab/docs/Games/Techniques/2D_collision_detection
// Axis-Aligned Bounding Box - no rotation
export const intersects = (rect1: Rectangle, rect2: Rectangle): boolean =>
  rect1.left < rect2.right &&
  rect1.right > rect2.left &&
  rect1.top < rect2.bottom &&
  rect1.bottom > rect2.top;

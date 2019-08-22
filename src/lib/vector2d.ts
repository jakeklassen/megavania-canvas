export class Vector2d {
  public static Zero() {
    return new Vector2d(0, 0);
  }

  constructor(public x = 0, public y = 0) {}
}

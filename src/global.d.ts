declare module '*.png';
declare module '*.ttf';

declare module 'contro';

declare module 'lerp' {
  /**
   * Linear interpolation function
   * @param start
   * @param end
   * @param alpha Interpolation value from 0.0 to 1.0
   */
  function lerp(start: number, end: number, alpha: number): number;
  export = lerp;
}

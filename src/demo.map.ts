import { rectangleFactory, Rectangle } from './lib/collision/rectangle';

export interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  collider: Rectangle;
  rgba: string;
  visible: boolean;
}

export const convertMapTextureToTilesArray = (
  texture: CanvasImageSource,
  tileWidth = 16,
  tileHeight = 16,
) => {
  const textureWidth = texture.width as number;
  const textureHeight = texture.height as number;

  // Temporary canvas to render levels on and read pixel data from
  const canvas = document.createElement('canvas');
  canvas.width = textureWidth;
  canvas.height = textureHeight;

  const ctx = canvas.getContext('2d');
  if (ctx == null) throw new Error('Failed to obtain 2d context');

  ctx.drawImage(texture, 0, 0);

  const tiles = [];

  for (let y = 0; y < textureHeight; ++y) {
    const row = [];

    for (let x = 0; x < textureWidth; ++x) {
      const pixel = ctx.getImageData(x, y, 1, 1);
      const data = pixel.data;
      const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;

      // Transparent pixel, no tile.
      // NOTE: Alpha is expressed in the range of 0 - 1, so we normalize the value
      // by dividing by 255.
      if (data[3] / 255 === 0) {
        row.push(null);
        continue;
      }

      const posX = x * tileWidth;
      const posY = y * tileHeight;

      row.push({
        x: posX,
        y: posY,
        width: tileWidth,
        height: tileHeight,
        collider: rectangleFactory(posX, posY, tileWidth, tileHeight),
        rgba,
        visible: true,
      } as Tile);
    }

    tiles.push(row);
  }

  return tiles;
};

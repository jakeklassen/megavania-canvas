import lerp from 'lerp';
import megamanSheet from '../assets/images/megaman.png';
import nesSafeAreaImage from '../assets/images/nes_safe_area.png';
import mapTexture from '../assets/images/map.png';
import visitorFontUrl from '../assets/fonts/visitor/visitor1.ttf';
import { controls } from './lib/gamepad';
import { convertMapTextureToTilesArray, Tile } from './demo.map';
import MainLoop from 'mainloop.js';
import { getResolution } from './lib/screen';
import { rectangleFactory } from './lib/collision/rectangle';
import { intersects } from './lib/collision/aabb';

function drawLine(
  ctx: CanvasRenderingContext2D,
  pixel: ImageData,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {}

const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

if (ctx == null) {
  throw new Error('Failed to obtain 2d rendering context');
}

const redPixel = ctx.createImageData(1, 1);
redPixel.data[0] = 255;
redPixel.data[1] = 0;
redPixel.data[2] = 0;
redPixel.data[3] = 255;

const PPU = 16;
const assets: { [key: string]: any; asset<T>(name: string): () => T } = {
  asset<T>(name: string) {
    return assets[name] as T;
  },
};
const GAME_WIDTH = 256;
const GAME_HEIGHT = 240;
const minJumpHeight = 1;
const maxJumpHeight = 3 * PPU;
const timeToJumpMin = 0.2;
const timeToJumpApex = 0.4;
const jumpCooldown = 0.15;
const maxFallSpeed = 30 * PPU;
const gravity = (2 * maxJumpHeight) / Math.pow(timeToJumpApex, 2);
const jumpVelocity = -gravity * timeToJumpApex;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
ctx.imageSmoothingEnabled = false;
canvas.style.width = `${GAME_WIDTH}px`;
canvas.style.height = `${GAME_HEIGHT}px`;

let map: (Tile | null)[][];

const megaman = {
  sprite: {} as ImageBitmap,
  collider: rectangleFactory(150 + 12, 0 + 10, 11, 22),
  airborne: false,
  collisions: {
    above: false,
    below: false,
    left: false,
    right: false,
  },
  pos: {
    x: 150,
    y: 0,
  },
  lastPos: {
    x: 150,
    y: 0,
  },
  vel: {
    x: 0,
    y: 0,
  },
  dir: {
    x: 1,
    y: 1,
  },
  timers: {
    jump: 0,
  },
  move(pos: { x: number; y: number }) {
    const { x, y } = pos;

    this.pos.x += x;
    this.pos.y += y;

    this.collider.x += x;
    this.collider.y += y;
  },
};

const resize = () => {
  // Scale canvas to fit window while maintaining 16x9
  const { innerWidth, innerHeight } = window;
  const { width, height, factor } = getResolution(
    innerWidth,
    innerHeight,
    GAME_WIDTH,
    GAME_HEIGHT,
  );

  canvas.style.transform = `scale(${factor})`;
  canvas.style.left = `${innerWidth / 2 - canvas.width / 2}px`;
  canvas.style.top = `${innerHeight / 2 - canvas.height / 2}px`;
};

resize();

window.addEventListener('resize', resize);

function update(delta: number) {
  const dt = delta / 1000;

  megaman.lastPos.x = megaman.pos.x;
  megaman.lastPos.y = megaman.pos.y;
  megaman.vel.x = 0;
  megaman.timers.jump += dt;

  // Prepare velocities for collision checking
  if (megaman.collisions.above || megaman.collisions.below) {
    megaman.vel.y = 0;
  }

  if (controls.left.query()) {
    megaman.dir.x = -1;
    megaman.vel.x = 150;
  } else if (controls.right.query()) {
    megaman.dir.x = 1;
    megaman.vel.x = 150;
  }

  if (
    megaman.timers.jump >= jumpCooldown &&
    controls.jump.query() &&
    megaman.collisions.below &&
    !megaman.collisions.above &&
    !megaman.airborne
  ) {
    megaman.timers.jump = 0;
    megaman.airborne = true;
    megaman.vel.y = jumpVelocity;
  }

  if (megaman.airborne && megaman.collisions.below) {
    megaman.airborne = false;
  }

  megaman.vel.y += gravity * dt;

  if (megaman.vel.y > maxFallSpeed) {
    megaman.vel.y = maxFallSpeed;
  }

  const newX = megaman.dir.x * megaman.vel.x * dt;

  megaman.collisions.left = false;
  megaman.collisions.right = false;
  megaman.collisions.above = false;
  megaman.collisions.below = false;

  // Move X

  let collider = rectangleFactory(
    megaman.pos.x + 12 + newX,
    megaman.pos.y + 10,
    11,
    22,
  );
  let collisionX = false;

  for (let y = 0; y < assets.map.height; ++y) {
    for (let x = 0; x < assets.map.width; ++x) {
      const tile = map[y][x];

      if (tile != null) {
        if (
          tile.collider.bottom <= megaman.collider.top ||
          tile.collider.top >= megaman.collider.bottom
        ) {
          continue;
        }

        if (intersects(collider, tile.collider)) {
          collisionX = true;

          if (megaman.dir.x > 0) {
            megaman.collisions.right = true;

            const adjust = tile.x - megaman.collider.right;
            megaman.move({ x: adjust, y: 0 });
          } else if (megaman.dir.x < 0) {
            megaman.collisions.left = true;

            const adjust = tile.collider.right - megaman.collider.x;
            megaman.move({ x: adjust, y: 0 });
          }

          break;
        }
      }
    }

    if (collisionX) {
      break;
    }
  }

  if (collisionX === false) {
    megaman.move({ x: newX, y: 0 });
  }

  // Move Y

  const newY = megaman.vel.y * dt;

  collider = rectangleFactory(
    megaman.pos.x + 12,
    megaman.pos.y + 10 + newY,
    11,
    22,
  );
  let collisionY = false;

  for (let y = 0; y < assets.map.height; ++y) {
    for (let x = 0; x < assets.map.width; ++x) {
      const tile = map[y][x];

      if (tile != null) {
        if (intersects(collider, tile.collider)) {
          collisionY = true;
          megaman.vel.y = 0;

          if (tile.collider.top < megaman.collider.top) {
            megaman.collisions.above = true;

            const adjust = tile.collider.bottom - megaman.collider.top;
            megaman.move({ x: 0, y: adjust });
          } else if (tile.collider.bottom > megaman.collider.bottom) {
            megaman.collisions.below = true;

            const adjust = tile.collider.top - megaman.collider.bottom;
            megaman.move({ x: 0, y: adjust });
          }

          break;
        }
      }
    }

    if (collisionY) {
      break;
    }
  }

  if (collisionY === false) {
    megaman.move({ x: 0, y: newY });
  }

  // megaman.move({
  //   x: megaman.dir.x * megaman.vel.x * dt,
  //   y: megaman.vel.y * gravity * dt,
  // });

  // megaman.move({
  //   x: megaman.dir.x * megaman.vel.x * dt,
  //   y: megaman.vel.y * dt,
  // });
  // megaman.pos.x += megaman.dir.x * megaman.vel.x * dt;
  // megaman.pos.y += megaman.vel.y * dt;
}

function draw(interpolation: number) {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = 'green';
  for (let y = 0; y < assets.map.height; ++y) {
    for (let x = 0; x < assets.map.width; ++x) {
      const tile = map[y][x];

      if (tile != null) {
        ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
      }
    }
  }

  const megamanRenderPos = {
    x: lerp(megaman.lastPos.x, megaman.pos.x, interpolation),
    y: lerp(megaman.lastPos.y, megaman.pos.y, interpolation),
    // x: megaman.lastPos.x + (megaman.pos.x - megaman.lastPos.x) * interpolation,
    // y: megaman.lastPos.y + (megaman.pos.y - megaman.lastPos.y) * interpolation,
  };

  if (megaman.dir.x === 1) {
    ctx.drawImage(
      megaman.sprite,
      0,
      0,
      32,
      32,
      megamanRenderPos.x,
      megamanRenderPos.y,
      32,
      32,
    );
  } else {
    ctx.drawImage(
      megaman.sprite,
      64,
      0,
      32,
      32,
      megamanRenderPos.x,
      megamanRenderPos.y,
      32,
      32,
    );
  }

  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  // ctx.fillRect(
  //   Math.round(megaman.collider.x),
  //   Math.round(megaman.collider.y),
  //   megaman.collider.width,
  //   megaman.collider.height,
  // );

  ctx.globalAlpha = 0.5;
  ctx.drawImage(assets.nesSafeArea, 0, 0);
  ctx.globalAlpha = 1.0;

  // ctx.putImageData(redPixel, 100, 100);

  // ctx.lineWidth = 1;
  // ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
  // ctx.strokeRect(-1, -1, 258, 8);
  // ctx.strokeRect(-1, 232, 258, 232);

  // ctx.strokeStyle = 'rgba(136, 136, 0, 1)';
  // ctx.strokeRect(0, 8, 256, 232);

  // ctx.lineCap = 'square';
  // // Danger
  // ctx.beginPath();
  // ctx.strokeStyle = 'rgba(255, 0, 0, 1.0)';
  // ctx.moveTo(0, 0);
  // ctx.lineTo(256, 0);
  // ctx.stroke();

  // ctx.moveTo(0, 240);
  // ctx.lineTo(256, 240);
  // ctx.stroke();
  // ctx.closePath();

  // Action
  // ctx.beginPath();
  // ctx.strokeStyle = 'rgba(136, 136, 0, 1.0)';
  // ctx.lineWidth = 8;
  // ctx.moveTo(0, 12);
  // ctx.lineTo(252, 12);
  // ctx.lineTo(252, 228);
  // ctx.lineTo(4, 228);
  // ctx.lineTo(4, 12);
  // ctx.stroke();
  // ctx.closePath();

  // // Safe
  // ctx.beginPath();
  // ctx.strokeStyle = 'rgba(102, 102, 255, 1.0)';
  // ctx.lineWidth = 8;
  // ctx.moveTo(12, 20);
  // ctx.lineTo(244, 20);
  // ctx.lineTo(244, 224);
  // ctx.stroke();
  // ctx.closePath();

  // ctx.beginPath();
  // ctx.strokeStyle = 'rgba(102, 102, 255, 1.0)';
  // ctx.lineWidth = 12;
  // ctx.moveTo(242, 222);
  // ctx.lineTo(16, 222);
  // ctx.stroke();
  // ctx.closePath();

  // ctx.beginPath();
  // ctx.strokeStyle = 'rgba(102, 102, 255, 1.0)';
  // ctx.lineWidth = 8;
  // ctx.moveTo(12, 224);
  // ctx.lineTo(12, 20);
  // ctx.stroke();
  // ctx.closePath();

  // Title
  // ctx.beginPath();
  // ctx.strokeStyle = 'rgba(102, 102, 102, 0.25)';
  // ctx.lineWidth = 8;
  // ctx.moveTo(20, 28);
  // ctx.lineTo(236, 28);
  // ctx.lineTo(236, 212);
  // ctx.lineTo(20, 212);
  // ctx.lineTo(20, 28);
  // ctx.stroke();
  // ctx.closePath();

  ctx.fillStyle = 'white';
  ctx.font = '10px Visitor';

  ctx.fillText('FPS: ' + String(MainLoop.getFPS().toFixed(2)), 20, 20);
  ctx.fillText('Interp: ' + String(interpolation.toFixed(2)), 20, 30);
}

async function onload() {
  const font = new FontFace('Visitor', `url(${visitorFontUrl})`);
  const visitorFont = await font.load();
  document.fonts.add(visitorFont);

  let image: HTMLImageElement = await new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);

    image.src = megamanSheet;
  });

  assets.megaman = await createImageBitmap(image);

  image = await new Promise(resolve => {
    const _image = new Image();
    _image.onload = () => resolve(_image);

    _image.src = nesSafeAreaImage;
  });

  assets.nesSafeArea = image;

  let mapImage: HTMLImageElement = await new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);

    image.src = mapTexture;
  });

  assets.map = await createImageBitmap(mapImage);

  megaman.sprite = assets.megaman;

  map = convertMapTextureToTilesArray(assets.map, 16, 16);

  MainLoop.setUpdate(update)
    .setDraw(draw)
    .start();
}

window.onload = () => onload().catch(console.error);

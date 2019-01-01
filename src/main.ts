import { FixedSizeList } from 'fixed-size-list';
import megamanSheet from '../assets/images/megaman.png';
import mapTexture from '../assets/images/map.png';
import visitorFontUrl from '../assets/fonts/visitor/visitor1.ttf';
import { controls } from './lib/gamepad';
import { convertMapTextureToTilesArray, Tile } from './demo.map';
import * as MainLoop from 'mainloop.js';
import { get16x9Resolution } from './lib/screen';
import { rectangleFactory } from './lib/collision/rectangle';
import { intersects } from './lib/collision/aabb';

const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

if (ctx == null) {
  throw new Error('Failed to obtain 2d rendering context');
}

const PPU = 16;
const frames = new FixedSizeList<number>(10);
const assets: { [key: string]: any; asset<T>(name: string): () => T } = {
  asset<T>(name: string) {
    return assets[name] as T;
  },
};
const GAME_WIDTH = 512;
const GAME_HEIGHT = 288;
const minJumpHeight = 1;
const maxJumpHeight = 3 * PPU;
const timeToJumpMin = 0.2;
const timeToJumpApex = 0.4;
const jumpCooldown = 0.15;
const maxFallSpeed = 30 * PPU;
const gravity = (2 * maxJumpHeight) / Math.pow(timeToJumpApex, 2);
const jumpVelocity = -gravity * timeToJumpApex;

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
  const { width, height } = get16x9Resolution(
    innerWidth,
    innerHeight,
    GAME_WIDTH,
    GAME_HEIGHT,
  );

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};

resize();

window.addEventListener('resize', resize);

function update(delta: number) {
  const dt = delta / 1000;

  frames.add(dt);

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

function draw() {
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

  if (megaman.dir.x === 1) {
    ctx.drawImage(
      megaman.sprite,
      0,
      0,
      32,
      32,
      Math.round(megaman.pos.x),
      Math.round(megaman.pos.y),
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
      Math.round(megaman.pos.x),
      Math.round(megaman.pos.y),
      32,
      32,
    );
  }

  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  ctx.fillRect(
    Math.round(megaman.collider.x),
    Math.round(megaman.collider.y),
    megaman.collider.width,
    megaman.collider.height,
  );

  ctx.fillStyle = 'white';
  ctx.font = '10px Visitor';

  const averageFps =
    1 / ([...frames].reduce((a, b) => a + b, 0) / frames.length);
  ctx.fillText(String(Math.round(averageFps)), 20, 10);
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

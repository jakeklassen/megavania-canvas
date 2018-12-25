import { FixedSizeList } from 'fixed-size-list';
import megamanSheet from '../assets/images/megaman.png';
import mapTexture from '../assets/images/map.png';
import visitorFontUrl from '../assets/fonts/visitor/visitor1.ttf';
import { controls } from './lib/gamepad';
import { convertMapTextureToTilesArray } from './demo.map';

const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (ctx == null) {
  throw new Error('Failed to obtain 2d rendering context');
}

const frames = new FixedSizeList<number>(10);
const assets: { [key: string]: any } = {};
const GAME_WIDTH = 512;
const GAME_HEIGHT = 288;
const minJumpHeight = 1;
const maxJumpHeight = 3.5;
const timeToJumpMin = 0.2;
const timeToJumpApex = 0.4;
const jumpCooldown = 0.15;
const maxFallSpeed = 30;
const gravity = 2 * maxJumpHeight / Math.pow(timeToJumpApex, 2);
const jumpVelocity = -Math.abs(gravity) * timeToJumpApex;
const fps = 60;
const step = 1 / fps;

let map = [[]];

const megaman = {
  sprite: Image,
  pos: {
    x: 0,
    y: 0,
  },
  vel: {
    x: 5,
    y: 5,
  },
  dir: {
    x: 1,
    y: 1,
  },
};

ctx.imageSmoothingEnabled = false;
canvas.style.width = `${GAME_WIDTH}px`;
canvas.style.height = `${GAME_HEIGHT}px`;

const get16x9Resolution = (
  containerWidth: number,
  containerHeight: number,
  minWidth: number,
  minHeight: number,
) => {
  if (containerWidth <= minWidth || containerHeight <= minHeight) {
    return {
      width: minWidth,
      height: minHeight,
    };
  }

  let factor = 1;
  let width = minWidth * factor;
  let height = minHeight * factor;

  while (width <= containerWidth && height <= containerHeight) {
    factor++;

    width = minWidth * factor;
    height = minHeight * factor;
  }

  factor--;

  return {
    width: minWidth * factor,
    height: minHeight * factor,
  };
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

let dt = 0;
let last = 0;
let isPaused = false;

function loop(hrt: DOMHighResTimeStamp) {
  if (ctx == null) {
    throw new Error('Canvas context2d lost');
  }

  // One additional note is that requestAnimationFrame might pause if our browser
  // loses focus, resulting in a very, very large dt after it resumes.
  // We can workaround this by limiting the delta to one second:
  // dt = dt + Math.min(1, (now - last) / 1000);
  dt = (hrt - last) / 1000;
  frames.add(dt);

  megaman.vel.x = 0;
  megaman.vel.y = 0;

  if (controls.left.query()) {
    megaman.dir.x = -1;
    megaman.vel.x = 150;
  } else if (controls.right.query()) {
    megaman.dir.x = 1;
    megaman.vel.x = 150;
  }

  megaman.pos.x += megaman.dir.x * megaman.vel.x * dt;
  megaman.pos.y += megaman.vel.y * dt;

  if (isPaused === false) {
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
        Math.floor(megaman.pos.x),
        Math.floor(megaman.pos.y),
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
        Math.floor(megaman.pos.x),
        Math.floor(megaman.pos.y),
        32,
        32,
      );
    }

    ctx.fillStyle = 'white';
    ctx.font = '10px Visitor';

    const averageFps =
      1 / ([...frames].reduce((a, b) => a + b, 0) / frames.length);
    ctx.fillText(String(Math.floor(averageFps)), 20, 10);
  } else {
  }

  last = hrt;

  requestAnimationFrame(loop);
}

async function onload() {
  const font = new FontFace('Visitor', `url(${visitorFontUrl})`);
  const visitorFont = await font.load();
  document.fonts.add(visitorFont);

  assets.megaman = await new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);

    image.src = megamanSheet;
  });

  assets.map = await new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);

    image.src = mapTexture;
  });

  megaman.sprite = assets.megaman;

  map = convertMapTextureToTilesArray(assets.map, 16, 16);

  loop(performance.now());
}

window.onload = () => onload().catch(console.error);

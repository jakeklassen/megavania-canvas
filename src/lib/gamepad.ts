import { Gamepad, Keyboard, or } from 'contro';

const gamepad = new Gamepad();
const keyboard = new Keyboard();

export const controls = {
  left: or(gamepad.button('Left'), keyboard.key('Left')),
  right: or(gamepad.button('Right'), keyboard.key('Right')),
  jump: or(gamepad.button('A').trigger, keyboard.key('Space').trigger),
  menu: or(gamepad.button('Back').trigger, keyboard.key('Esc').trigger),
  inventory: or(gamepad.button('LB').trigger, keyboard.key('E').trigger),
  map: or(gamepad.button('RB').trigger, keyboard.key('M').trigger),
  statusOverlay: or(gamepad.button('RB'), keyboard.key('Tab')),
};

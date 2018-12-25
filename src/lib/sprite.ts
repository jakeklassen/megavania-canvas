export function Sprite({ texture } = { texture: Image }) {
  if (!(texture instanceof Image)) {
    throw new Error('`texture` is required');
  }
}

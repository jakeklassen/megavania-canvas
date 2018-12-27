export const get16x9Resolution = (
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

export const getResolution = (
  containerWidth: number,
  containerHeight: number,
  minWidth: number,
  minHeight: number,
) => {
  if (containerWidth <= minWidth || containerHeight <= minHeight) {
    return {
      width: minWidth,
      height: minHeight,
      factor: 1,
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
    factor,
  };
};

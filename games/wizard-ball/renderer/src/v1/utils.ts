export function roundFloat(value: number, decimalPlaces: number = 2): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

export function attributeToColor(
  value: number,
  max: number = 20,
): {
  bg: string;
  text: string;
} {
  // Clamp value between 1 and max
  const v = Math.max(1, Math.min(value, max));
  // Calculate percentage (0 = red, 0.5 = yellow, 1 = green)
  const percent = (v - 1) / (max - 1);
  // Interpolate color: red (255,0,0) -> yellow (255,255,0) -> green (0,200,0)
  let r, g, b;
  if (percent < 0.5) {
    // red to yellow
    r = 255;
    g = Math.round(255 * (percent / 0.5));
    b = 0;
  } else {
    // yellow to green
    r = Math.round(255 * (1 - (percent - 0.5) / 0.5));
    g = 200;
    b = 0;
  }
  const bg = `rgb(${r},${g},${b}, .8)`;
  const text = `rgb(${r},${g},${b}, 1)`;
  return { bg, text };
}

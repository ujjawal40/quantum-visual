// Turning wavelengths into colours, and naming parts of the spectrum.

export const VISIBLE_MIN = 380;
export const VISIBLE_MAX = 750;

export const isVisible = (nm) => nm >= VISIBLE_MIN && nm <= VISIBLE_MAX;

/** Region of the electromagnetic spectrum for a wavelength in nm. */
export function region(nm) {
  if (nm < 0.01) return "gamma ray";
  if (nm < 10) return "X-ray";
  if (nm < VISIBLE_MIN) return "ultraviolet";
  if (nm <= VISIBLE_MAX) return "visible";
  if (nm < 1e6) return "infrared";
  if (nm < 1e9) return "microwave";
  return "radio";
}

/** Everyday colour name for a visible wavelength. */
export function colourName(nm) {
  if (!isVisible(nm)) return region(nm);
  if (nm < 450) return "violet";
  if (nm < 495) return "blue";
  if (nm < 520) return "cyan";
  if (nm < 570) return "green";
  if (nm < 590) return "yellow";
  if (nm < 620) return "orange";
  return "red";
}

/**
 * Approximate sRGB colour of a wavelength (Bruton's piecewise model with
 * intensity fall-off at the edges of vision). Returns [r, g, b] in 0–255.
 * Outside the visible range returns a neutral grey so UV/IR still draw.
 */
export function wavelengthToRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm >= 440 && nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm >= 490 && nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm >= 580 && nm < 645) { r = 1; g = (645 - nm) / 65; }
  else if (nm >= 645 && nm <= 750) { r = 1; }
  else return [150, 150, 160];

  let f = 1;
  if (nm < 420) f = 0.3 + (0.7 * (nm - 380)) / 40;
  else if (nm > 700) f = 0.3 + (0.7 * (750 - nm)) / 50;

  const gamma = 0.8;
  const ch = (x) => Math.round(255 * Math.pow(x * f, gamma));
  return [ch(r), ch(g), ch(b)];
}

export const wavelengthToCSS = (nm, alpha = 1) => {
  const [r, g, b] = wavelengthToRGB(nm);
  return alpha === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;
};

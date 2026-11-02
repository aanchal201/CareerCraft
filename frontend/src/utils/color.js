/** Small color helpers for user-chosen theme colors. */

/** "#0f766e" -> { r: 15, g: 118, b: 110 } */
export function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Best text color on top of `hex`: white for dark colors, near-black for light
 * ones - so buttons and banners stay readable whatever color the user picks.
 */
export function contrastText(hex) {
  return luminance(hex) > 0.36 ? '#111418' : '#ffffff';
}

export function isValidHex(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

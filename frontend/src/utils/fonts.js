/**
 * Font pairings for portfolios. Fonts are loaded from Google Fonts only when
 * a pairing is first used, so the rest of the app doesn't pay for them.
 */
export const FONT_PAIRINGS = {
  modern: {
    name: 'Modern',
    description: 'Clean geometric sans',
    heading: "'Plus Jakarta Sans', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
    googleFamilies: null, // already loaded by index.html
  },
  editorial: {
    name: 'Editorial',
    description: 'Elegant serif headings',
    heading: "'Playfair Display', Georgia, serif",
    body: "'Source Sans 3', system-ui, sans-serif",
    googleFamilies: ['Playfair+Display:wght@600;700', 'Source+Sans+3:wght@400;600'],
  },
  tech: {
    name: 'Tech',
    description: 'Sharp, developer-friendly',
    heading: "'Space Grotesk', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    googleFamilies: ['Space+Grotesk:wght@500;700', 'Inter:wght@400;500;600'],
  },
  friendly: {
    name: 'Friendly',
    description: 'Rounded and warm',
    heading: "'Poppins', system-ui, sans-serif",
    body: "'Nunito Sans', system-ui, sans-serif",
    googleFamilies: ['Poppins:wght@600;700', 'Nunito+Sans:wght@400;600'],
  },
};

const loaded = new Set();

/** Adds the Google Fonts stylesheet for a pairing (once). Safe to call often. */
export function ensureFontPairing(key) {
  const pairing = FONT_PAIRINGS[key];
  if (!pairing?.googleFamilies || loaded.has(key) || typeof document === 'undefined') return;
  loaded.add(key);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${pairing.googleFamilies.map((f) => `family=${f}`).join('&')}&display=swap`;
  link.dataset.fontPairing = key;
  document.head.appendChild(link);
}

export function getFontPairing(key) {
  return FONT_PAIRINGS[key] || FONT_PAIRINGS.modern;
}

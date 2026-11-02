/**
 * Maps a 0-100 score to a label and a color, used consistently across the
 * analyzer (rings, bars, history badges).
 */
export function scoreTone(score) {
  if (score >= 80) return { label: 'Excellent', tone: 'excellent', color: '#067647' };
  if (score >= 65) return { label: 'Good', tone: 'good', color: '#0f766e' };
  if (score >= 50) return { label: 'Fair', tone: 'fair', color: '#b54708' };
  return { label: 'Needs work', tone: 'poor', color: '#b42318' };
}

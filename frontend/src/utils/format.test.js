import { describe, expect, it } from 'vitest';
import { contrastText, isValidHex } from './color';
import { formatMonth, formatRange, formatRelativeTime } from './date';
import { prettyUrl, resumeDateRange, toLines } from './resume';
import { scoreTone } from './score';

describe('color helpers', () => {
  it('picks readable text colors', () => {
    expect(contrastText('#000000')).toBe('#ffffff');
    expect(contrastText('#ffffff')).toBe('#111418');
    expect(contrastText('#0f766e')).toBe('#ffffff');
  });
  it('validates 6-digit hex colors', () => {
    expect(isValidHex('#0f766e')).toBe(true);
    expect(isValidHex('#fff')).toBe(false);
    expect(isValidHex('red')).toBe(false);
  });
});

describe('date helpers', () => {
  it('formats months and ranges without timezone shifts', () => {
    expect(formatMonth('2023-06-01')).toBe('Jun 2023');
    expect(formatMonth('2024-01')).toBe('Jan 2024');
    expect(formatRange('2023-06', null, true)).toBe('Jun 2023 – Present');
    expect(resumeDateRange('2023-06', '2024-02', false)).toBe('Jun 2023 – Feb 2024');
  });
  it('formats relative times', () => {
    const now = new Date('2026-01-10T12:00:00Z');
    expect(formatRelativeTime('2026-01-10T11:59:50Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-01-10T11:55:00Z', now)).toBe('5 min ago');
    expect(formatRelativeTime('2026-01-10T09:00:00Z', now)).toBe('3 h ago');
    expect(formatRelativeTime('2026-01-08T12:00:00Z', now)).toBe('2 days ago');
  });
});

describe('resume helpers', () => {
  it('splits descriptions into bullet lines', () => {
    expect(toLines('• Built X\n- Led Y\n\n* Shipped Z')).toEqual(['Built X', 'Led Y', 'Shipped Z']);
  });
  it('shortens URLs for display', () => {
    expect(prettyUrl('https://www.github.com/asha/')).toBe('github.com/asha');
  });
});

describe('scoreTone', () => {
  it('maps scores to labels', () => {
    expect(scoreTone(85).label).toBe('Excellent');
    expect(scoreTone(70).label).toBe('Good');
    expect(scoreTone(55).label).toBe('Fair');
    expect(scoreTone(10).label).toBe('Needs work');
  });
});

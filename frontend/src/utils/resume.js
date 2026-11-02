/**
 * Helpers shared by the resume editor and the resume templates.
 */
import { formatMonth } from './date';

export const SKILL_LEVEL_LABELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

export const SKILL_LEVEL_RANK = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };

/** Unique id for new list items (used as React keys and stored in the resume). */
export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** A blank item for each list section. */
export function createEmptyItem(sectionKey) {
  const id = newId();
  switch (sectionKey) {
    case 'experience':
      return { id, jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' };
    case 'education':
      return {
        id,
        institution: '',
        degree: '',
        fieldOfStudy: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        grade: '',
        description: '',
      };
    case 'skills':
      return { id, name: '', level: 'INTERMEDIATE' };
    case 'projects':
      return { id, name: '', role: '', technologies: '', link: '', startDate: '', endDate: '', description: '' };
    case 'certifications':
      return { id, name: '', issuer: '', date: '', link: '' };
    case 'achievements':
      return { id, title: '', date: '', description: '' };
    case 'languages':
      return { id, name: '', proficiency: 'Professional' };
    default:
      throw new Error(`Unknown section: ${sectionKey}`);
  }
}

/** "2024-06" .. "2025-01" / current -> "Jun 2024 – Present" */
export function resumeDateRange(start, end, current) {
  const from = formatMonth(start);
  const to = current ? 'Present' : formatMonth(end);
  if (from && to) return `${from} – ${to}`;
  return from || to || '';
}

/**
 * Splits a description into bullet lines. Leading "•", "-", "*" are removed.
 * One line -> rendered as a paragraph; several -> a bullet list.
 */
export function toLines(text) {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean);
}

/** "https://www.github.com/asha/" -> "github.com/asha" (for display) */
export function prettyUrl(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

/** True if the item has at least one filled-in text field (ignores id/flags). */
export function itemHasContent(item) {
  return Object.entries(item).some(([key, value]) => key !== 'id' && key !== 'level' && key !== 'proficiency' && hasText(value))
    || (hasText(item.name));
}

/** Items worth printing in a section (skips completely empty ones). */
export function filledItems(content, sectionKey) {
  return (content[sectionKey] || []).filter(itemHasContent);
}

/** Does this section have anything to show? */
export function sectionHasContent(content, sectionKey) {
  if (sectionKey === 'summary') return hasText(content.summary);
  return filledItems(content, sectionKey).length > 0;
}

/** Visible, non-empty sections in the user's order. */
export function visibleSections(content) {
  return (content.sections || []).filter((section) => section.visible && sectionHasContent(content, section.key));
}

/** Contact entries for the header, in display order. */
export function contactItems(personal) {
  return [
    { key: 'email', value: personal.email, href: personal.email ? `mailto:${personal.email}` : null },
    { key: 'phone', value: personal.phone },
    { key: 'location', value: personal.location },
    { key: 'linkedin', value: prettyUrl(personal.linkedin), href: personal.linkedin },
    { key: 'github', value: prettyUrl(personal.github), href: personal.github },
    { key: 'website', value: prettyUrl(personal.website), href: personal.website },
  ].filter((item) => hasText(item.value));
}

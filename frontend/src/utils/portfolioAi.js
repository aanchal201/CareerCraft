/** Helpers shared by the "Generate from resume" and "Write with AI" dialogs. */

export const AI_TONES = [
  { value: 'PROFESSIONAL', label: 'Professional — clear and polished' },
  { value: 'FRIENDLY', label: 'Friendly — warm and personal' },
  { value: 'BOLD', label: 'Bold — confident and punchy' },
];

/** Public address of a published portfolio, e.g. https://careercraft.app/p/asha-verma */
export function publicPortfolioUrl(slug) {
  return `${window.location.origin}/p/${slug}`;
}

/** Turns what the user types into a valid address: "Asha Verma!" -> "asha-verma". */
export function toSlug(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 40);
}

const lower = (value) => (value || '').trim().toLowerCase();

/**
 * Lists the suggestions the AI returned, as checkable items for the dialog.
 * Only items that would actually change something are included.
 */
export function describeSuggestions(content, ai) {
  if (!ai) return [];
  const items = [];
  const add = (key, label, value, current) => {
    if (value && value.trim() && value.trim() !== (current || '').trim()) items.push({ key, label, value });
  };

  add('headline', 'Headline', ai.headline, content.hero.headline);
  add('tagline', 'Tagline', ai.tagline, content.hero.tagline);
  add('about', 'About me', ai.about, content.about.text);
  add('contactMessage', 'Contact message', ai.contactMessage, content.contact.message);

  const groups = (ai.skillGroups || []).filter((g) => g.category && g.skills?.length);
  if (groups.length > 0) {
    items.push({
      key: 'skillGroups',
      label: 'Skill groups',
      value: groups.map((g) => `${g.category}: ${g.skills.join(', ')}`).join('\n'),
    });
  }

  (ai.projectDescriptions || []).forEach((project, index) => {
    const existing = content.projects.find((p) => lower(p.name) === lower(project.name));
    if (existing) add(`project:${index}`, `Project — ${existing.name}`, project.description, existing.description);
  });

  return items;
}

/** Applies the chosen suggestions to the portfolio content (returns new content). */
export function applySuggestions(content, ai, selectedKeys) {
  const selected = new Set(selectedKeys);
  let next = { ...content };

  if (selected.has('headline')) next.hero = { ...next.hero, headline: ai.headline.trim() };
  if (selected.has('tagline')) next.hero = { ...next.hero, tagline: ai.tagline.trim() };
  if (selected.has('about')) next.about = { ...next.about, text: ai.about.trim() };
  if (selected.has('contactMessage')) next.contact = { ...next.contact, message: ai.contactMessage.trim() };

  if (selected.has('skillGroups')) {
    const categoryBySkill = new Map();
    (ai.skillGroups || []).forEach((group) =>
      (group.skills || []).forEach((skill) => categoryBySkill.set(lower(skill), group.category))
    );
    next.skills = next.skills.map((skill) =>
      categoryBySkill.has(lower(skill.name)) ? { ...skill, category: categoryBySkill.get(lower(skill.name)) } : skill
    );
  }

  const descriptions = new Map();
  (ai.projectDescriptions || []).forEach((project, index) => {
    if (selected.has(`project:${index}`)) descriptions.set(lower(project.name), project.description.trim());
  });
  if (descriptions.size > 0) {
    next.projects = next.projects.map((project) =>
      descriptions.has(lower(project.name)) ? { ...project, description: descriptions.get(lower(project.name)) } : project
    );
  }

  return next;
}

import { describe, expect, it } from 'vitest';
import { applySuggestions, describeSuggestions, toSlug } from './portfolioAi';

const content = {
  hero: { name: 'Asha', headline: 'Developer', tagline: '' },
  about: { text: 'Old about' },
  contact: { message: '' },
  skills: [
    { id: 's1', name: 'React', category: '' },
    { id: 's2', name: 'Java', category: '' },
  ],
  projects: [{ id: 'p1', name: 'CareerCraft', description: 'Old' }],
};

const ai = {
  headline: 'Frontend engineer',
  tagline: 'I build fast apps.',
  about: 'Old about', // unchanged -> not offered
  contactMessage: 'Say hello!',
  skillGroups: [{ category: 'Frontend', skills: ['react'] }, { category: 'Backend', skills: ['Java', 'Kubernetes'] }],
  projectDescriptions: [
    { name: 'careercraft', description: 'An AI resume builder.' },
    { name: 'Unknown project', description: 'ignored' },
  ],
};

describe('toSlug', () => {
  it('turns any text into a valid address', () => {
    expect(toSlug('Asha Verma')).toBe('asha-verma');
    expect(toSlug('José  Núñez!!')).toBe('jose-nunez-');
    expect(toSlug('a--b__c')).toBe('a-b-c');
    expect(toSlug('x'.repeat(60))).toHaveLength(40);
    expect(toSlug(undefined)).toBe('');
  });
});

describe('describeSuggestions', () => {
  it('lists only suggestions that change something, for existing projects only', () => {
    const keys = describeSuggestions(content, ai).map((item) => item.key);
    expect(keys).toEqual(['headline', 'tagline', 'contactMessage', 'skillGroups', 'project:0']);
  });
  it('handles a missing response', () => {
    expect(describeSuggestions(content, null)).toEqual([]);
  });
});

describe('applySuggestions', () => {
  it('applies only the selected suggestions and never adds skills or projects', () => {
    const next = applySuggestions(content, ai, ['headline', 'skillGroups', 'project:0']);
    expect(next.hero.headline).toBe('Frontend engineer');
    expect(next.hero.tagline).toBe(''); // not selected
    expect(next.skills).toHaveLength(2);
    expect(next.skills.map((s) => s.category)).toEqual(['Frontend', 'Backend']);
    expect(next.projects).toHaveLength(1);
    expect(next.projects[0].description).toBe('An AI resume builder.');
  });
  it('does not mutate the original content', () => {
    applySuggestions(content, ai, ['headline', 'skillGroups']);
    expect(content.hero.headline).toBe('Developer');
    expect(content.skills[0].category).toBe('');
  });
});

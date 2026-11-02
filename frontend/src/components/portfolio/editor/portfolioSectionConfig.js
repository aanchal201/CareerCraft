import { BadgeCheck, Briefcase, FolderKanban, GraduationCap, Mail, Sparkles, UserRound, Wrench } from 'lucide-react';
import { newId, resumeDateRange } from '../../../utils/resume';
import { formatMonth } from '../../../utils/date';

/**
 * Field definitions for the portfolio editor. The same FieldRenderer /
 * ListEditor used by the resume builder turn these into forms.
 */

export const HERO_FIELDS = [
  { name: 'name', label: 'Your name', maxLength: 100 },
  { name: 'headline', label: 'Headline', placeholder: 'Full-stack developer', maxLength: 120 },
  {
    name: 'tagline',
    label: 'Tagline',
    type: 'textarea',
    rows: 2,
    full: true,
    maxLength: 300,
    placeholder: 'One sentence about what you do and what you care about.',
  },
  { name: 'availability', label: 'Status badge', placeholder: 'Open to work', maxLength: 60, hint: 'Leave empty to hide.' },
  { name: 'ctaLabel', label: 'Main button text', placeholder: 'Get in touch', maxLength: 40 },
  { name: 'showAvatar', label: 'Show my profile photo', type: 'checkbox', full: true },
];

export const ABOUT_FIELDS = [
  {
    name: 'text',
    label: 'About you',
    type: 'textarea',
    rows: 6,
    full: true,
    maxLength: 3000,
    hint: 'Leave an empty line between paragraphs.',
  },
  { name: 'location', label: 'Location', placeholder: 'Mumbai, India', maxLength: 100 },
];

export const CONTACT_FIELDS = [
  {
    name: 'message',
    label: 'Invitation',
    type: 'textarea',
    rows: 2,
    full: true,
    maxLength: 300,
    placeholder: 'I’m open to new opportunities — let’s talk!',
  },
  { name: 'email', label: 'Email', maxLength: 150 },
  { name: 'phone', label: 'Phone', maxLength: 30 },
  { name: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/in/you' },
  { name: 'github', label: 'GitHub', type: 'url', placeholder: 'https://github.com/you' },
  { name: 'website', label: 'Website', type: 'url', placeholder: 'https://…', full: true },
];

/** Icons for every editor card. */
export const SECTION_ICONS = {
  hero: Sparkles,
  about: UserRound,
  skills: Wrench,
  projects: FolderKanban,
  experience: Briefcase,
  education: GraduationCap,
  certifications: BadgeCheck,
  contact: Mail,
};

/** List sections: ListEditor config + a factory for new items. */
export const PORTFOLIO_LISTS = {
  skills: {
    config: {
      addLabel: 'Add skill',
      compact: true,
      fields: [
        { name: 'name', label: 'Skill', placeholder: 'e.g. React', maxLength: 60 },
        { name: 'category', label: 'Group (optional)', placeholder: 'e.g. Frontend', maxLength: 40 },
      ],
    },
    createItem: () => ({ id: newId(), name: '', category: '' }),
  },

  projects: {
    config: {
      addLabel: 'Add project',
      itemTitle: (item) => item.name || 'New project',
      itemSubtitle: (item) => [item.featured ? '★ Featured' : '', item.technologies].filter(Boolean).join(' · '),
      fields: [
        { name: 'name', label: 'Project name', placeholder: 'CareerCraft', maxLength: 120 },
        { name: 'technologies', label: 'Technologies (comma separated)', placeholder: 'React, Spring Boot', maxLength: 200 },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          rows: 3,
          full: true,
          maxLength: 1500,
          placeholder: 'What it does, your role, and the result.',
        },
        { name: 'liveUrl', label: 'Live demo link', type: 'url', placeholder: 'https://…' },
        { name: 'repoUrl', label: 'Source code link', type: 'url', placeholder: 'https://github.com/…' },
        {
          name: 'imageUrl',
          label: 'Screenshot URL (optional)',
          type: 'url',
          full: true,
          placeholder: 'https://…/screenshot.png',
          hint: 'Paste a link to an image hosted online. Leave empty for a clean placeholder.',
        },
        { name: 'featured', label: 'Feature this project (shown first)', type: 'checkbox', full: true },
      ],
    },
    createItem: () => ({ id: newId(), name: '', description: '', technologies: '', liveUrl: '', repoUrl: '', imageUrl: '', featured: false }),
  },

  experience: {
    config: {
      addLabel: 'Add experience',
      itemTitle: (item) => [item.jobTitle, item.company].filter(Boolean).join(' at ') || 'New position',
      itemSubtitle: (item) => resumeDateRange(item.startDate, item.endDate, item.current),
      fields: [
        { name: 'jobTitle', label: 'Job title', maxLength: 120 },
        { name: 'company', label: 'Company', maxLength: 150 },
        { name: 'startDate', label: 'Start date', type: 'month' },
        { name: 'endDate', label: 'End date', type: 'month', disabledBy: 'current' },
        { name: 'current', label: 'I currently work here', type: 'checkbox', full: true },
        { name: 'location', label: 'Location', full: true, maxLength: 100 },
        {
          name: 'description',
          label: 'Highlights',
          type: 'textarea',
          rows: 4,
          full: true,
          maxLength: 2000,
          hint: 'One point per line — each becomes a bullet.',
        },
      ],
    },
    createItem: () => ({ id: newId(), jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' }),
  },

  education: {
    config: {
      addLabel: 'Add education',
      itemTitle: (item) => item.degree || item.institution || 'New education',
      itemSubtitle: (item) => [item.institution, resumeDateRange(item.startDate, item.endDate, item.current)].filter(Boolean).join(' · '),
      fields: [
        { name: 'institution', label: 'School / University', full: true, maxLength: 150 },
        { name: 'degree', label: 'Degree', maxLength: 120 },
        { name: 'fieldOfStudy', label: 'Field of study', maxLength: 120 },
        { name: 'startDate', label: 'Start date', type: 'month' },
        { name: 'endDate', label: 'End date', type: 'month', disabledBy: 'current' },
        { name: 'current', label: 'I currently study here', type: 'checkbox', full: true },
        { name: 'description', label: 'Highlights', type: 'textarea', rows: 3, full: true, maxLength: 1000 },
      ],
    },
    createItem: () => ({ id: newId(), institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', current: false, description: '' }),
  },

  certifications: {
    config: {
      addLabel: 'Add certification',
      itemTitle: (item) => item.name || 'New certification',
      itemSubtitle: (item) => [item.issuer, formatMonth(item.date)].filter(Boolean).join(' · '),
      fields: [
        { name: 'name', label: 'Name', full: true, maxLength: 150 },
        { name: 'issuer', label: 'Issuer', maxLength: 150 },
        { name: 'date', label: 'Date', type: 'month' },
        { name: 'link', label: 'Credential link', type: 'url', full: true },
      ],
    },
    createItem: () => ({ id: newId(), name: '', issuer: '', date: '', link: '' }),
  },
};

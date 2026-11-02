import { AlignLeft, BadgeCheck, Briefcase, FolderKanban, GraduationCap, Languages, Trophy, Wrench } from 'lucide-react';
import { resumeDateRange } from '../../../utils/resume';
import { formatMonth } from '../../../utils/date';

/**
 * Describes how each resume section is edited. The generic ListEditor reads
 * these field definitions, so adding a field is a one-line change here.
 *
 * Field options:
 *  name, label, type ('text' | 'month' | 'url' | 'textarea' | 'select' | 'checkbox'),
 *  placeholder, hint, full (span both columns), rows, maxLength, options (for select),
 *  disabledBy (name of a checkbox field that disables this field, e.g. "current")
 */
const SKILL_LEVEL_OPTIONS = [
  { value: '', label: 'Don’t show level' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

const LANGUAGE_LEVEL_OPTIONS = ['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'].map((level) => ({
  value: level,
  label: level,
}));

export const SECTION_CONFIG = {
  summary: {
    icon: AlignLeft,
    help: '2–4 sentences: who you are, your strongest skills, and what you’re looking for.',
  },

  experience: {
    icon: Briefcase,
    addLabel: 'Add experience',
    itemTitle: (item) => [item.jobTitle, item.company].filter(Boolean).join(' at ') || 'New position',
    itemSubtitle: (item) => resumeDateRange(item.startDate, item.endDate, item.current),
    fields: [
      { name: 'jobTitle', label: 'Job title', placeholder: 'Software Engineer', maxLength: 120 },
      { name: 'company', label: 'Company', placeholder: 'Acme Corp', maxLength: 150 },
      { name: 'startDate', label: 'Start date', type: 'month' },
      { name: 'endDate', label: 'End date', type: 'month', disabledBy: 'current' },
      { name: 'current', label: 'I currently work here', type: 'checkbox', full: true },
      { name: 'location', label: 'Location', placeholder: 'Bengaluru · Remote', full: true, maxLength: 100 },
      {
        name: 'description',
        label: 'What you did',
        type: 'textarea',
        rows: 5,
        full: true,
        maxLength: 3000,
        placeholder: 'Built …\nImproved … by 30%\nLed …',
        hint: 'One achievement per line — each line becomes a bullet point.',
      },
    ],
  },

  education: {
    icon: GraduationCap,
    addLabel: 'Add education',
    itemTitle: (item) => item.degree || item.institution || 'New education',
    itemSubtitle: (item) => [item.institution, resumeDateRange(item.startDate, item.endDate, item.current)].filter(Boolean).join(' · '),
    fields: [
      { name: 'institution', label: 'School / University', full: true, placeholder: 'University of Mumbai', maxLength: 150 },
      { name: 'degree', label: 'Degree', placeholder: 'B.Tech', maxLength: 120 },
      { name: 'fieldOfStudy', label: 'Field of study', placeholder: 'Computer Science', maxLength: 120 },
      { name: 'startDate', label: 'Start date', type: 'month' },
      { name: 'endDate', label: 'End date', type: 'month', disabledBy: 'current' },
      { name: 'current', label: 'I currently study here', type: 'checkbox', full: true },
      { name: 'location', label: 'Location', placeholder: 'Mumbai', maxLength: 100 },
      { name: 'grade', label: 'Grade / CGPA', placeholder: '8.7 CGPA', maxLength: 30 },
      {
        name: 'description',
        label: 'Highlights',
        type: 'textarea',
        rows: 3,
        full: true,
        maxLength: 1500,
        placeholder: 'Relevant coursework, honours, activities',
      },
    ],
  },

  projects: {
    icon: FolderKanban,
    addLabel: 'Add project',
    itemTitle: (item) => item.name || 'New project',
    itemSubtitle: (item) => item.technologies,
    fields: [
      { name: 'name', label: 'Project name', placeholder: 'CareerCraft', maxLength: 120 },
      { name: 'role', label: 'Your role', placeholder: 'Full-stack developer', maxLength: 120 },
      { name: 'technologies', label: 'Technologies', full: true, placeholder: 'React, Spring Boot, MySQL', maxLength: 200 },
      { name: 'link', label: 'Link', type: 'url', full: true, placeholder: 'https://github.com/you/project' },
      { name: 'startDate', label: 'Start date', type: 'month' },
      { name: 'endDate', label: 'End date', type: 'month' },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        rows: 4,
        full: true,
        maxLength: 2000,
        hint: 'One point per line — each line becomes a bullet point.',
      },
    ],
  },

  skills: {
    icon: Wrench,
    addLabel: 'Add skill',
    compact: true,
    fields: [
      { name: 'name', label: 'Skill', placeholder: 'e.g. React', maxLength: 60 },
      { name: 'level', label: 'Level', type: 'select', options: SKILL_LEVEL_OPTIONS },
    ],
  },

  certifications: {
    icon: BadgeCheck,
    addLabel: 'Add certification',
    itemTitle: (item) => item.name || 'New certification',
    itemSubtitle: (item) => [item.issuer, formatMonth(item.date)].filter(Boolean).join(' · '),
    fields: [
      { name: 'name', label: 'Name', full: true, placeholder: 'AWS Certified Cloud Practitioner', maxLength: 150 },
      { name: 'issuer', label: 'Issuer', placeholder: 'Amazon Web Services', maxLength: 150 },
      { name: 'date', label: 'Date', type: 'month' },
      { name: 'link', label: 'Credential link', type: 'url', full: true, placeholder: 'https://…' },
    ],
  },

  achievements: {
    icon: Trophy,
    addLabel: 'Add achievement',
    itemTitle: (item) => item.title || 'New achievement',
    itemSubtitle: (item) => formatMonth(item.date),
    fields: [
      { name: 'title', label: 'Title', placeholder: 'Winner, Smart India Hackathon', maxLength: 150 },
      { name: 'date', label: 'Date', type: 'month' },
      { name: 'description', label: 'Details', type: 'textarea', rows: 3, full: true, maxLength: 1000 },
    ],
  },

  languages: {
    icon: Languages,
    addLabel: 'Add language',
    compact: true,
    fields: [
      { name: 'name', label: 'Language', placeholder: 'e.g. English', maxLength: 60 },
      { name: 'proficiency', label: 'Proficiency', type: 'select', options: LANGUAGE_LEVEL_OPTIONS },
    ],
  },
};

import ClassicTemplate from './ClassicTemplate.jsx';
import ModernTemplate from './ModernTemplate.jsx';
import MinimalTemplate from './MinimalTemplate.jsx';

/**
 * Every resume template the app offers. The ids must match
 * ResumeTemplates.java on the backend.
 */
export const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless serif layout, centered header. Safe for any industry.',
    component: ClassicTemplate,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Two columns with a tinted sidebar for skills and contact details.',
    component: ModernTemplate,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean single column with lots of white space.',
    component: MinimalTemplate,
  },
];

export function getTemplate(templateId) {
  return TEMPLATES.find((template) => template.id === templateId) || TEMPLATES[0];
}

/** Professional, print-friendly accent colors. */
export const ACCENT_COLORS = [
  { value: '#0f766e', name: 'Teal' },
  { value: '#1e3a8a', name: 'Navy' },
  { value: '#334155', name: 'Slate' },
  { value: '#9f1239', name: 'Burgundy' },
  { value: '#166534', name: 'Forest' },
  { value: '#6b21a8', name: 'Plum' },
  { value: '#b45309', name: 'Amber' },
  { value: '#111827', name: 'Black' },
];

/** Example content used for the template thumbnails in the "New resume" dialog. */
export const SAMPLE_CONTENT = {
  personal: {
    fullName: 'Riya Sharma',
    jobTitle: 'Software Engineer',
    email: 'riya@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    linkedin: 'https://linkedin.com/in/riya',
    github: 'https://github.com/riya',
    website: '',
  },
  summary:
    'Software engineer with 3 years of experience building scalable web applications with React and Spring Boot. Passionate about clean code and great user experiences.',
  experience: [
    {
      id: 's1',
      jobTitle: 'Software Engineer',
      company: 'Nimbus Labs',
      location: 'Bengaluru',
      startDate: '2023-07',
      endDate: '',
      current: true,
      description: 'Led a migration to React 19, cutting load time by 35%\nBuilt REST APIs used by 40k daily users\nMentored two interns',
    },
    {
      id: 's2',
      jobTitle: 'SDE Intern',
      company: 'Orbit Systems',
      location: 'Pune',
      startDate: '2022-05',
      endDate: '2022-08',
      current: false,
      description: 'Automated test pipelines with JUnit and GitHub Actions',
    },
  ],
  education: [
    {
      id: 's3',
      institution: 'National Institute of Technology',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Science',
      location: '',
      startDate: '2019-08',
      endDate: '2023-05',
      current: false,
      grade: '8.7 CGPA',
      description: '',
    },
  ],
  skills: [
    { id: 'k1', name: 'React', level: 'EXPERT' },
    { id: 'k2', name: 'Java', level: 'ADVANCED' },
    { id: 'k3', name: 'Spring Boot', level: 'ADVANCED' },
    { id: 'k4', name: 'MySQL', level: 'INTERMEDIATE' },
    { id: 'k5', name: 'Docker', level: 'INTERMEDIATE' },
  ],
  projects: [
    {
      id: 'p1',
      name: 'CareerCraft',
      role: '',
      technologies: 'React, Spring Boot, MySQL',
      link: '',
      startDate: '',
      endDate: '',
      description: 'AI-powered resume and portfolio builder',
    },
  ],
  certifications: [{ id: 'c1', name: 'AWS Cloud Practitioner', issuer: 'Amazon', date: '2024-02', link: '' }],
  achievements: [],
  languages: [
    { id: 'l1', name: 'English', proficiency: 'Fluent' },
    { id: 'l2', name: 'Hindi', proficiency: 'Native' },
  ],
  sections: [
    { key: 'summary', title: 'Professional Summary', visible: true },
    { key: 'experience', title: 'Work Experience', visible: true },
    { key: 'projects', title: 'Projects', visible: true },
    { key: 'education', title: 'Education', visible: true },
    { key: 'skills', title: 'Skills', visible: true },
    { key: 'certifications', title: 'Certifications', visible: true },
    { key: 'achievements', title: 'Achievements', visible: true },
    { key: 'languages', title: 'Languages', visible: true },
  ],
};

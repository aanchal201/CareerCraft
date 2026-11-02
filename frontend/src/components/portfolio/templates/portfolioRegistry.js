import MinimalPortfolio from './MinimalPortfolio.jsx';
import BoldPortfolio from './BoldPortfolio.jsx';
import SidebarPortfolio from './SidebarPortfolio.jsx';

/** Portfolio templates. Ids must match PortfolioTemplates.java on the backend. */
export const PORTFOLIO_TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Airy single column with a clean top navigation.',
    component: MinimalPortfolio,
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Full-width colored hero and alternating sections.',
    component: BoldPortfolio,
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Sticky profile sidebar next to your content.',
    component: SidebarPortfolio,
  },
];

export function getPortfolioTemplate(id) {
  return PORTFOLIO_TEMPLATES.find((template) => template.id === id) || PORTFOLIO_TEMPLATES[0];
}

export const PORTFOLIO_COLORS = [
  { value: '#0f766e', name: 'Teal' },
  { value: '#2563eb', name: 'Blue' },
  { value: '#7c3aed', name: 'Violet' },
  { value: '#db2777', name: 'Pink' },
  { value: '#ea580c', name: 'Orange' },
  { value: '#16a34a', name: 'Green' },
  { value: '#0f172a', name: 'Ink' },
  { value: '#ca8a04', name: 'Gold' },
];

export const DEFAULT_DESIGN = {
  primaryColor: '#0f766e',
  colorMode: 'LIGHT',
  fontPairing: 'modern',
  heroAlign: 'LEFT',
  projectLayout: 'GRID',
};

/** Example content for template thumbnails. */
export const SAMPLE_PORTFOLIO = {
  hero: {
    name: 'Riya Sharma',
    headline: 'Full-stack developer',
    tagline: 'I build fast, accessible web apps with React and Spring Boot.',
    availability: 'Open to work',
    ctaLabel: 'Get in touch',
    showAvatar: true,
  },
  about: {
    text: 'Software engineer with 3 years of experience shipping products used by thousands of people. I care about clean code, thoughtful design and great user experiences.',
    location: 'Bengaluru, India',
  },
  skills: [
    { id: 's1', name: 'React', category: 'Frontend' },
    { id: 's2', name: 'TypeScript', category: 'Frontend' },
    { id: 's3', name: 'Spring Boot', category: 'Backend' },
    { id: 's4', name: 'MySQL', category: 'Backend' },
  ],
  projects: [
    { id: 'p1', name: 'CareerCraft', description: 'AI resume and portfolio builder.', technologies: 'React, Spring Boot', liveUrl: '', repoUrl: 'https://github.com/riya/careercraft', imageUrl: '', featured: true },
    { id: 'p2', name: 'TaskFlow', description: 'Kanban board with real-time sync.', technologies: 'React, WebSockets', liveUrl: 'https://taskflow.dev', repoUrl: '', imageUrl: '', featured: false },
  ],
  experience: [
    { id: 'e1', jobTitle: 'Software Engineer', company: 'Nimbus Labs', location: 'Bengaluru', startDate: '2023-07', endDate: '', current: true, description: 'Led a migration to React 19\nBuilt APIs used by 40k users' },
  ],
  education: [
    { id: 'd1', institution: 'National Institute of Technology', degree: 'B.Tech', fieldOfStudy: 'Computer Science', startDate: '2019-08', endDate: '2023-05', current: false, description: '' },
  ],
  certifications: [{ id: 'c1', name: 'AWS Cloud Practitioner', issuer: 'Amazon', date: '2024-02', link: '' }],
  contact: {
    message: 'I’m open to new opportunities — let’s talk!',
    email: 'riya@example.com',
    phone: '',
    linkedin: 'https://linkedin.com/in/riya',
    github: 'https://github.com/riya',
    website: '',
  },
  sections: [
    { key: 'about', title: 'About Me', visible: true },
    { key: 'skills', title: 'Skills', visible: true },
    { key: 'projects', title: 'Projects', visible: true },
    { key: 'experience', title: 'Experience', visible: true },
    { key: 'education', title: 'Education', visible: true },
    { key: 'certifications', title: 'Certifications', visible: true },
    { key: 'contact', title: 'Get in Touch', visible: true },
  ],
};

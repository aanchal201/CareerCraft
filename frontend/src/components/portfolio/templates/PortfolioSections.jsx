import { Code, ExternalLink, GraduationCap, Link2, Mail, MapPin, Phone, Star, BadgeCheck, Globe } from 'lucide-react';
import { buildApiUrl } from '../../../api/axios';
import { formatMonth } from '../../../utils/date';
import { prettyUrl, resumeDateRange, toLines } from '../../../utils/resume';

/**
 * Building blocks shared by all portfolio templates. Templates decide the
 * page layout (hero, nav, columns); these blocks render each section's
 * content. Class names start with "pf-" to stay isolated from the app.
 */

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

// ------------------------------------------------------------ section helpers

/** Does this section have anything to show? */
export function sectionHasContent(content, key) {
  switch (key) {
    case 'about':
      return hasText(content.about?.text);
    case 'contact': {
      const c = content.contact || {};
      return [c.message, c.email, c.phone, c.linkedin, c.github, c.website].some(hasText);
    }
    default:
      return (content[key] || []).some((item) =>
        Object.entries(item).some(([k, v]) => k !== 'id' && typeof v === 'string' && hasText(v))
      );
  }
}

/** Visible, non-empty sections in the user's order. */
export function visiblePortfolioSections(content) {
  return (content.sections || []).filter((s) => s.visible && sectionHasContent(content, s.key));
}

/** Items with at least a name/title filled in. */
function filled(list, field) {
  return (list || []).filter((item) => hasText(item[field]));
}

export function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// ------------------------------------------------------------ small pieces

export function Avatar({ name, avatarPath, className = '' }) {
  const src = buildApiUrl(avatarPath);
  return (
    <span className={`pf-avatar ${className}`}>
      {src ? <img src={src} alt={name ? `${name}` : 'Profile'} /> : <span>{initials(name)}</span>}
    </span>
  );
}

function Paragraphs({ text, className = 'pf-text' }) {
  if (!hasText(text)) return null;
  return text
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para, index) => (
      <p key={index} className={className}>
        {para}
      </p>
    ));
}

function Bullets({ text }) {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  if (lines.length === 1) return <p className="pf-text">{lines[0]}</p>;
  return (
    <ul className="pf-bullets">
      {lines.map((line, index) => (
        <li key={`${index}-${line}`}>{line}</li>
      ))}
    </ul>
  );
}

function Tags({ text }) {
  const tags = (text || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length === 0) return null;
  return (
    <ul className="pf-tags">
      {tags.map((tag) => (
        <li key={tag}>{tag}</li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------ section bodies

function About({ content }) {
  return (
    <div className="pf-about">
      <Paragraphs text={content.about.text} className="pf-lead" />
      {hasText(content.about.location) && (
        <p className="pf-meta">
          <MapPin size={15} aria-hidden="true" /> {content.about.location}
        </p>
      )}
    </div>
  );
}

function Skills({ content }) {
  const skills = filled(content.skills, 'name');
  const groups = new Map();
  skills.forEach((skill) => {
    const key = hasText(skill.category) ? skill.category.trim() : '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(skill);
  });
  const grouped = groups.size > 1 || !groups.has('');

  if (!grouped) {
    return (
      <ul className="pf-skill-cloud">
        {skills.map((skill) => (
          <li key={skill.id}>{skill.name}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="pf-skill-groups">
      {[...groups.entries()].map(([category, items]) => (
        <div key={category || 'other'} className="pf-skill-group">
          <h3>{category || 'Other'}</h3>
          <ul className="pf-skill-cloud">
            {items.map((skill) => (
              <li key={skill.id}>{skill.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Projects({ content, layout }) {
  const projects = filled(content.projects, 'name');
  // featured projects first, otherwise keep the user's order
  const ordered = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)];

  return (
    <div className={`pf-projects pf-projects--${layout === 'LIST' ? 'list' : 'grid'}`}>
      {ordered.map((project) => (
        <article key={project.id} className="pf-project">
          <div className="pf-project__media">
            {hasText(project.imageUrl) ? (
              <img src={project.imageUrl} alt={`${project.name} screenshot`} loading="lazy" />
            ) : (
              <span className="pf-project__placeholder" aria-hidden="true">
                {initials(project.name)}
              </span>
            )}
          </div>
          <div className="pf-project__body">
            <div className="pf-project__title-row">
              <h3>{project.name}</h3>
              {project.featured && (
                <span className="pf-badge">
                  <Star size={12} aria-hidden="true" /> Featured
                </span>
              )}
            </div>
            <Paragraphs text={project.description} />
            <Tags text={project.technologies} />
            {(hasText(project.liveUrl) || hasText(project.repoUrl)) && (
              <div className="pf-project__links">
                {hasText(project.liveUrl) && (
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={15} aria-hidden="true" /> Live demo
                  </a>
                )}
                {hasText(project.repoUrl) && (
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Code size={15} aria-hidden="true" /> Source code
                  </a>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Experience({ content }) {
  return (
    <ol className="pf-timeline">
      {filled(content.experience, 'jobTitle').map((item) => (
        <li key={item.id} className="pf-timeline__item">
          <p className="pf-timeline__date">{resumeDateRange(item.startDate, item.endDate, item.current)}</p>
          <div>
            <h3>{item.jobTitle}</h3>
            <p className="pf-timeline__org">
              {[item.company, item.location].filter(hasText).join(' · ')}
            </p>
            <Bullets text={item.description} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Education({ content }) {
  return (
    <div className="pf-cards">
      {filled(content.education, 'institution').map((item) => (
        <article key={item.id} className="pf-card">
          <GraduationCap size={20} className="pf-card__icon" aria-hidden="true" />
          <h3>{[item.degree, item.fieldOfStudy].filter(hasText).join(', ') || item.institution}</h3>
          {(hasText(item.degree) || hasText(item.fieldOfStudy)) && <p className="pf-card__org">{item.institution}</p>}
          <p className="pf-card__date">{resumeDateRange(item.startDate, item.endDate, item.current)}</p>
          <Paragraphs text={item.description} />
        </article>
      ))}
    </div>
  );
}

function Certifications({ content }) {
  return (
    <ul className="pf-certs">
      {filled(content.certifications, 'name').map((item) => (
        <li key={item.id}>
          <BadgeCheck size={20} className="pf-certs__icon" aria-hidden="true" />
          <div>
            <p className="pf-certs__name">
              {hasText(item.link) ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.name}
                </a>
              ) : (
                item.name
              )}
            </p>
            <p className="pf-certs__meta">{[item.issuer, formatMonth(item.date)].filter(hasText).join(' · ')}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function contactLinks(contact) {
  return [
    { key: 'email', icon: Mail, label: contact.email, href: hasText(contact.email) ? `mailto:${contact.email}` : null },
    { key: 'phone', icon: Phone, label: contact.phone, href: hasText(contact.phone) ? `tel:${contact.phone.replace(/\s/g, '')}` : null },
    { key: 'linkedin', icon: Link2, label: prettyUrl(contact.linkedin), href: contact.linkedin },
    { key: 'github', icon: Code, label: prettyUrl(contact.github), href: contact.github },
    { key: 'website', icon: Globe, label: prettyUrl(contact.website), href: contact.website },
  ].filter((link) => hasText(link.label));
}

function Contact({ content }) {
  const contact = content.contact;
  const links = contactLinks(contact);
  return (
    <div className="pf-contact">
      {hasText(contact.message) && <p className="pf-lead">{contact.message}</p>}
      {hasText(contact.email) && (
        <a className="pf-button" href={`mailto:${contact.email}`}>
          <Mail size={18} aria-hidden="true" /> Email me
        </a>
      )}
      {links.length > 0 && (
        <ul className="pf-contact__links">
          {links.map(({ key, icon: Icon, label, href }) => (
            <li key={key}>
              <a href={href} target={key === 'email' || key === 'phone' ? undefined : '_blank'} rel="noopener noreferrer">
                <Icon size={16} aria-hidden="true" /> {label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const BODIES = { about: About, skills: Skills, projects: Projects, experience: Experience, education: Education, certifications: Certifications, contact: Contact };

/** A full section with heading; `id` lets nav links jump to it (#pf-projects). */
export function PortfolioSection({ section, content, design, className = '' }) {
  const Body = BODIES[section.key];
  if (!Body) return null;
  return (
    <section id={`pf-${section.key}`} className={`pf-section pf-section--${section.key} ${className}`}>
      <div className="pf-container">
        <h2 className="pf-section__title">{section.title}</h2>
        <Body content={content} layout={design.projectLayout} />
      </div>
    </section>
  );
}

/** "Projects", "Experience"… links to visible sections. */
export function NavLinks({ sections }) {
  return (
    <ul className="pf-nav__links">
      {sections.map((section) => (
        <li key={section.key}>
          <a href={`#pf-${section.key}`}>{section.title}</a>
        </li>
      ))}
    </ul>
  );
}

export function Footer({ name }) {
  return (
    <footer className="pf-footer">
      <div className="pf-container">
        © {new Date().getFullYear()} {name || 'Portfolio'} · Built with CareerCraft
      </div>
    </footer>
  );
}

/** Hero call-to-action buttons: primary goes to Contact, secondary to Projects. */
export function HeroActions({ content, sections, inverted = false }) {
  const hasContact = sections.some((s) => s.key === 'contact');
  const hasProjects = sections.some((s) => s.key === 'projects');
  if (!hasContact && !hasProjects) return null;
  return (
    <div className="pf-hero__actions">
      {hasContact && (
        <a href="#pf-contact" className={`pf-button ${inverted ? 'pf-button--inverted' : ''}`}>
          {content.hero.ctaLabel || 'Get in touch'}
        </a>
      )}
      {hasProjects && (
        <a href="#pf-projects" className={`pf-button pf-button--ghost ${inverted ? 'pf-button--ghost-inverted' : ''}`}>
          View my work
        </a>
      )}
    </div>
  );
}

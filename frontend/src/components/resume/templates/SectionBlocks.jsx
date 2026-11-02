import { filledItems, prettyUrl, resumeDateRange, SKILL_LEVEL_LABELS, SKILL_LEVEL_RANK, toLines } from '../../../utils/resume';
import { formatMonth } from '../../../utils/date';

/**
 * Markup for each resume section, shared by all templates. Templates only
 * change the layout and styling (via CSS), not what each section contains.
 * Class names start with "rs-" (resume section) to stay separate from app CSS.
 */

export function Description({ text }) {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  if (lines.length === 1) return <p className="rs-text">{lines[0]}</p>;
  return (
    <ul className="rs-bullets">
      {lines.map((line, index) => (
        // lines can repeat, so the index is part of the key
        <li key={`${index}-${line}`}>{line}</li>
      ))}
    </ul>
  );
}

function ItemHeader({ title, subtitle, meta, aside }) {
  return (
    <div className="rs-item__head">
      <div className="rs-item__titles">
        {title && <p className="rs-item__title">{title}</p>}
        {subtitle && <p className="rs-item__subtitle">{subtitle}</p>}
      </div>
      {(aside || meta) && (
        <div className="rs-item__aside">
          {aside && <p className="rs-item__date">{aside}</p>}
          {meta && <p className="rs-item__meta">{meta}</p>}
        </div>
      )}
    </div>
  );
}

function Summary({ content }) {
  return <Description text={content.summary} />;
}

function Experience({ content }) {
  return filledItems(content, 'experience').map((item) => (
    <div key={item.id} className="rs-item">
      <ItemHeader
        title={item.jobTitle}
        subtitle={item.company}
        aside={resumeDateRange(item.startDate, item.endDate, item.current)}
        meta={item.location}
      />
      <Description text={item.description} />
    </div>
  ));
}

function Education({ content }) {
  return filledItems(content, 'education').map((item) => {
    const degree = [item.degree, item.fieldOfStudy].filter(Boolean).join(', ');
    return (
      <div key={item.id} className="rs-item">
        <ItemHeader
          title={degree || item.institution}
          subtitle={degree ? item.institution : null}
          aside={resumeDateRange(item.startDate, item.endDate, item.current)}
          meta={[item.location, item.grade].filter(Boolean).join(' · ')}
        />
        <Description text={item.description} />
      </div>
    );
  });
}

function Projects({ content }) {
  return filledItems(content, 'projects').map((item) => (
    <div key={item.id} className="rs-item">
      <ItemHeader
        title={item.name}
        subtitle={[item.role, item.technologies].filter(Boolean).join(' · ')}
        aside={resumeDateRange(item.startDate, item.endDate, false)}
        meta={item.link ? prettyUrl(item.link) : null}
      />
      <Description text={item.description} />
    </div>
  ));
}

function Skills({ content, variant }) {
  const skills = filledItems(content, 'skills');

  if (variant === 'bars') {
    return (
      <ul className="rs-skill-bars">
        {skills.map((skill) => (
          <li key={skill.id}>
            <span>{skill.name}</span>
            {skill.level && (
              <span className="rs-skill-bars__track" aria-label={SKILL_LEVEL_LABELS[skill.level]}>
                <span style={{ width: `${(SKILL_LEVEL_RANK[skill.level] / 4) * 100}%` }} />
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="rs-tags">
      {skills.map((skill) => (
        <li key={skill.id}>{skill.name}</li>
      ))}
    </ul>
  );
}

function Certifications({ content }) {
  return filledItems(content, 'certifications').map((item) => (
    <div key={item.id} className="rs-item rs-item--compact">
      <ItemHeader title={item.name} subtitle={item.issuer} aside={formatMonth(item.date)} />
    </div>
  ));
}

function Achievements({ content }) {
  return filledItems(content, 'achievements').map((item) => (
    <div key={item.id} className="rs-item rs-item--compact">
      <ItemHeader title={item.title} aside={formatMonth(item.date)} />
      <Description text={item.description} />
    </div>
  ));
}

function Languages({ content }) {
  return (
    <ul className="rs-languages">
      {filledItems(content, 'languages').map((item) => (
        <li key={item.id}>
          <span className="rs-languages__name">{item.name}</span>
          {item.proficiency && <span className="rs-languages__level">{item.proficiency}</span>}
        </li>
      ))}
    </ul>
  );
}

const SECTION_COMPONENTS = {
  summary: Summary,
  experience: Experience,
  education: Education,
  projects: Projects,
  skills: Skills,
  certifications: Certifications,
  achievements: Achievements,
  languages: Languages,
};

/** One titled section. `skillVariant` = 'tags' | 'bars'. */
export function ResumeSection({ section, content, skillVariant = 'tags' }) {
  const Body = SECTION_COMPONENTS[section.key];
  if (!Body) return null;
  return (
    <section className={`rs-section rs-section--${section.key}`}>
      <h2 className="rs-section__title">{section.title}</h2>
      <div className="rs-section__body">
        <Body content={content} variant={skillVariant} />
      </div>
    </section>
  );
}

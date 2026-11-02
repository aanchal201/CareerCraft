import { Code, Globe, Link2, Mail, MapPin, Phone } from 'lucide-react';
import { ResumeSection } from './SectionBlocks.jsx';
import { contactItems, visibleSections } from '../../../utils/resume';

const CONTACT_ICONS = { email: Mail, phone: Phone, location: MapPin, linkedin: Link2, github: Code, website: Globe };

/** Sections that live in the narrow sidebar column; everything else goes in the main column. */
const SIDEBAR_KEYS = new Set(['skills', 'languages', 'certifications']);

/** Modern: name band on top, tinted sidebar (contact, skills…) + main column. */
export default function ModernTemplate({ content }) {
  const { personal } = content;
  const contacts = contactItems(personal);
  const sections = visibleSections(content);
  const sidebar = sections.filter((section) => SIDEBAR_KEYS.has(section.key));
  const main = sections.filter((section) => !SIDEBAR_KEYS.has(section.key));

  return (
    <>
      <header className="rt-header">
        <h1 className="rt-name">{personal.fullName || 'Your Name'}</h1>
        {personal.jobTitle && <p className="rt-job-title">{personal.jobTitle}</p>}
      </header>

      <div className="rt-columns">
        <aside className="rt-sidebar">
          {contacts.length > 0 && (
            <section className="rs-section">
              <h2 className="rs-section__title">Contact</h2>
              <ul className="rt-contact-list">
                {contacts.map((item) => {
                  const Icon = CONTACT_ICONS[item.key];
                  return (
                    <li key={item.key}>
                      <Icon size={13} aria-hidden="true" />
                      <span>{item.value}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {sidebar.map((section) => (
            <ResumeSection key={section.key} section={section} content={content} skillVariant="bars" />
          ))}
        </aside>

        <div className="rt-main">
          {main.map((section) => (
            <ResumeSection key={section.key} section={section} content={content} />
          ))}
        </div>
      </div>
    </>
  );
}

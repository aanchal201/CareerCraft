import { ResumeSection } from './SectionBlocks.jsx';
import { contactItems, visibleSections } from '../../../utils/resume';

/** Classic: centered serif header, single column, ruled section headings. */
export default function ClassicTemplate({ content }) {
  const { personal } = content;
  const contacts = contactItems(personal);

  return (
    <>
      <header className="rt-header">
        <h1 className="rt-name">{personal.fullName || 'Your Name'}</h1>
        {personal.jobTitle && <p className="rt-job-title">{personal.jobTitle}</p>}
        {contacts.length > 0 && (
          <p className="rt-contacts">
            {contacts.map((item) => (
              <span key={item.key}>{item.value}</span>
            ))}
          </p>
        )}
      </header>

      {visibleSections(content).map((section) => (
        <ResumeSection key={section.key} section={section} content={content} />
      ))}
    </>
  );
}

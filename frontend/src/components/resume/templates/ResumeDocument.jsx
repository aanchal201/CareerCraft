import { forwardRef } from 'react';
import { getTemplate } from './templateRegistry.js';
import './resumeTemplates.css';

/**
 * The resume "paper": an A4-sized page (794 x 1123 CSS px at 96 dpi) that
 * renders the chosen template. Used by the live preview and the template
 * thumbnails. The accent color is passed as a CSS variable.
 */
const ResumeDocument = forwardRef(function ResumeDocument({ templateId, accentColor, content }, ref) {
  const { component: Template, id } = getTemplate(templateId);

  return (
    <div ref={ref} className={`resume resume--${id}`} style={{ '--resume-accent': accentColor }}>
      <Template content={content} />
    </div>
  );
});

export default ResumeDocument;

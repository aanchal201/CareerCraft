import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ResumeDocument from './templates/ResumeDocument.jsx';

/**
 * Renders an invisible, full-size copy of the resume that is used ONLY when
 * printing (see styles/print.css). While this component is mounted, the
 * browser's print / "Save as PDF" (and Ctrl/Cmd+P) outputs just the resume.
 */
export default function PrintableResume({ templateId, accentColor, content }) {
  useEffect(() => {
    document.body.classList.add('has-printable-resume');
    return () => document.body.classList.remove('has-printable-resume');
  }, []);

  return createPortal(
    <div className="print-portal" aria-hidden="true">
      <ResumeDocument templateId={templateId} accentColor={accentColor} content={content} />
    </div>,
    document.body
  );
}

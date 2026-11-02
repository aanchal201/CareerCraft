import ResumeDocument from './templates/ResumeDocument.jsx';

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

/**
 * A small, non-interactive picture of a resume (first page only).
 * Renders the real template, scaled down, so thumbnails always match.
 */
export default function ResumeThumbnail({ templateId, accentColor, content, width = 180 }) {
  const scale = width / PAGE_WIDTH;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width,
        height: PAGE_HEIGHT * scale,
        overflow: 'hidden',
        borderRadius: 4,
        background: '#fff',
        boxShadow: '0 1px 2px rgba(16,32,29,.08), 0 4px 12px -4px rgba(16,32,29,.15)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ResumeDocument templateId={templateId} accentColor={accentColor} content={content} />
      </div>
    </div>
  );
}

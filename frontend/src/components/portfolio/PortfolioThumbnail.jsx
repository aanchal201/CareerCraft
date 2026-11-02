import PortfolioDocument from './templates/PortfolioDocument.jsx';

const DESKTOP_WIDTH = 1280;

/** Small, non-interactive picture of the top of a portfolio (desktop layout). */
export default function PortfolioThumbnail({ templateId, design, content, width = 180, height = 120 }) {
  const scale = width / DESKTOP_WIDTH;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(16,32,29,.08), 0 4px 12px -4px rgba(16,32,29,.18)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: DESKTOP_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <PortfolioDocument templateId={templateId} design={design} content={content} interactive={false} />
      </div>
    </div>
  );
}

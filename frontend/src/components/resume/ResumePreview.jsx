import { useLayoutEffect, useRef, useState } from 'react';
import ResumeDocument from './templates/ResumeDocument.jsx';
import './ResumePreview.css';

const PAGE_WIDTH = 794; // A4 at 96 dpi
const PAGE_HEIGHT = 1123;

/**
 * Live, scaled-down preview of the resume.
 * The document is always rendered at its real A4 size and shrunk with a CSS
 * transform to fit the available width, so what you see matches the printed
 * page. Dashed lines show where page breaks will fall.
 */
export default function ResumePreview({ templateId, accentColor, content, showPageBreaks = true }) {
  const containerRef = useRef(null);
  const documentRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [docHeight, setDocHeight] = useState(PAGE_HEIGHT);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const doc = documentRef.current;
    if (!container || !doc) return undefined;

    const update = () => {
      setScale(Math.min(1, container.clientWidth / PAGE_WIDTH));
      setDocHeight(Math.max(PAGE_HEIGHT, doc.offsetHeight));
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(doc);
    return () => observer.disconnect();
  }, []);

  const pageCount = Math.max(1, Math.ceil(docHeight / PAGE_HEIGHT - 0.01));
  const breaks = Array.from({ length: pageCount - 1 }, (_, i) => (i + 1) * PAGE_HEIGHT);

  return (
    <div ref={containerRef} className="resume-preview">
      <div className="resume-preview__frame" style={{ height: docHeight * scale }}>
        <div className="resume-preview__scaler" style={{ transform: `scale(${scale})` }}>
          <ResumeDocument ref={documentRef} templateId={templateId} accentColor={accentColor} content={content} />
          {showPageBreaks &&
            breaks.map((top, index) => (
              <div key={top} className="resume-preview__break" style={{ top }}>
                <span>Page {index + 2}</span>
              </div>
            ))}
        </div>
      </div>
      {showPageBreaks && (
        <p className="resume-preview__pages">
          {pageCount} page{pageCount === 1 ? '' : 's'}
          {pageCount > 2 && ' · Most recruiters prefer 1–2 pages'}
        </p>
      )}
    </div>
  );
}

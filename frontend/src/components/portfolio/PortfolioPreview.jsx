import { useLayoutEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import PortfolioDocument from './templates/PortfolioDocument.jsx';
import './PortfolioPreview.css';

export const DEVICES = [
  { id: 'desktop', label: 'Desktop', width: 1280, icon: Monitor },
  { id: 'tablet', label: 'Tablet', width: 820, icon: Tablet },
  { id: 'mobile', label: 'Mobile', width: 390, icon: Smartphone },
];

/**
 * Live preview in a browser-style frame. The portfolio is rendered at the
 * real device width (1280 / 820 / 390 px) and scaled down to fit, so the
 * container-query layout is exactly what visitors on that device will see.
 */
export default function PortfolioPreview({ templateId, design, content, avatarPath, device, onDeviceChange }) {
  const frameRef = useRef(null);
  const docRef = useRef(null);
  const [frameWidth, setFrameWidth] = useState(800);
  const [docHeight, setDocHeight] = useState(800);

  const deviceWidth = (DEVICES.find((d) => d.id === device) || DEVICES[0]).width;
  const scale = Math.min(1, frameWidth / deviceWidth);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const doc = docRef.current;
    if (!frame || !doc) return undefined;
    const update = () => {
      setFrameWidth(frame.clientWidth);
      setDocHeight(doc.offsetHeight);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    observer.observe(doc);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pf-preview">
      <div className="pf-preview__toolbar">
        <div className="pf-preview__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="pf-preview__url">your-portfolio · {deviceWidth}px</span>
        <div className="pf-preview__devices" role="radiogroup" aria-label="Preview device">
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={device === id}
              aria-label={label}
              title={label}
              className={device === id ? 'is-active' : ''}
              onClick={() => onDeviceChange(id)}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      <div ref={frameRef} className="pf-preview__viewport">
        <div className="pf-preview__stage" style={{ height: docHeight * scale, width: deviceWidth * scale }}>
          <div className="pf-preview__scaler" style={{ width: deviceWidth, transform: `scale(${scale})` }}>
            <PortfolioDocument
              ref={docRef}
              templateId={templateId}
              design={design}
              content={content}
              avatarPath={avatarPath}
              interactive={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

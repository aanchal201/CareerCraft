import { forwardRef, useEffect } from 'react';
import { getPortfolioTemplate, DEFAULT_DESIGN } from './portfolioRegistry.js';
import { contrastText } from '../../../utils/color';
import { ensureFontPairing, getFontPairing } from '../../../utils/fonts';
import './portfolioTemplates.css';

const LIGHT = {
  '--pf-bg': '#ffffff',
  '--pf-surface': '#f5f6f8',
  '--pf-text': '#14181f',
  '--pf-muted': '#5b6470',
  '--pf-border': '#e3e6ea',
};

const DARK = {
  '--pf-bg': '#0f1115',
  '--pf-surface': '#171a21',
  '--pf-text': '#eef0f3',
  '--pf-muted': '#9aa3ad',
  '--pf-border': '#272b34',
};

/**
 * Renders a whole portfolio website with the chosen template and design.
 *
 * The root is a CSS *container* (container-type: inline-size). Templates use
 * container queries instead of media queries, so the same markup adapts to
 * the width of its box - that's what makes the desktop/tablet/mobile preview
 * accurate inside the editor, and it works the same on a real public page.
 *
 *  interactive=false (editor preview): links don't navigate.
 */
const PortfolioDocument = forwardRef(function PortfolioDocument(
  { templateId, design: designProp, content, avatarPath, interactive = true },
  ref
) {
  const design = { ...DEFAULT_DESIGN, ...designProp };
  const { component: Template, id } = getPortfolioTemplate(templateId);
  const fonts = getFontPairing(design.fontPairing);

  useEffect(() => {
    ensureFontPairing(design.fontPairing);
  }, [design.fontPairing]);

  const style = {
    ...(design.colorMode === 'DARK' ? DARK : LIGHT),
    '--pf-accent': design.primaryColor,
    '--pf-on-accent': contrastText(design.primaryColor),
    '--pf-font-heading': fonts.heading,
    '--pf-font-body': fonts.body,
  };

  // In the editor preview, stop links from navigating away (or jumping the editor page).
  const handleClickCapture = interactive
    ? undefined
    : (event) => {
        if (event.target.closest('a')) event.preventDefault();
      };

  return (
    <div
      ref={ref}
      className={`pf pf--${id} pf--${design.colorMode === 'DARK' ? 'dark' : 'light'}`}
      style={style}
      onClickCapture={handleClickCapture}
    >
      <div className="pf__page">
        <Template content={content} design={design} avatarPath={avatarPath} />
      </div>
    </div>
  );
});

export default PortfolioDocument;

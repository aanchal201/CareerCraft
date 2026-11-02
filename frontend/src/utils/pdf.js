/**
 * PDF export helpers. The PDF is produced by the browser's own print engine
 * ("Save as PDF"), which renders the exact same HTML/CSS as the live preview
 * and keeps the text selectable (important for applicant tracking systems).
 */

const TIPS_KEY = 'careercraft_pdf_tips_seen';

/**
 * "Asha Verma" + "Frontend Developer" -> "Asha_Verma_Frontend_Developer_Resume"
 * Browsers use the page title as the suggested PDF file name.
 */
export function buildPdfFileName({ fullName, title }) {
  const parts = [fullName, title].filter((part) => part && part.trim());
  const hasResumeWord = parts.some((part) => /resume|cv/i.test(part));
  if (!hasResumeWord) parts.push('Resume');

  const name = parts
    .join(' ')
    .normalize('NFKD') // é -> e + accent, so the next line keeps the "e"
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80);

  return name || 'Resume';
}

/**
 * Opens the print dialog for the printable resume currently on the page
 * (rendered by <PrintableResume>). Waits for web fonts first so the PDF
 * never uses fallback fonts.
 */
export async function printResume(fileName) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore - print anyway */
    }
  }

  const previousTitle = document.title;
  document.title = fileName;

  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = previousTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);

  window.print();

  // Chrome/Edge/Firefox block inside print(); Safari doesn't, so restore a
  // little later to be safe.
  window.setTimeout(restore, 1500);
}

export function hasSeenPdfTips() {
  try {
    return localStorage.getItem(TIPS_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPdfTipsSeen() {
  try {
    localStorage.setItem(TIPS_KEY, '1');
  } catch {
    /* storage unavailable - the tips will just show again */
  }
}

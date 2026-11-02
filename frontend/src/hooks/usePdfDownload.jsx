import { useCallback, useState } from 'react';
import PdfTipsModal from '../components/resume/PdfTipsModal.jsx';
import { hasSeenPdfTips, markPdfTipsSeen, printResume } from '../utils/pdf';

/**
 * PDF download flow:
 *  - first time: show the print-settings tips, then open the print dialog
 *  - afterwards: open the print dialog straight away
 *
 * The page must also render <PrintableResume> so there is something to print.
 *
 *   const { downloadPdf, tipsModal } = usePdfDownload();
 *   ...
 *   <Button onClick={() => downloadPdf(fileName)}>Download PDF</Button>
 *   {tipsModal}
 */
export default function usePdfDownload() {
  const [pendingFileName, setPendingFileName] = useState(null);

  const downloadPdf = useCallback((fileName) => {
    if (hasSeenPdfTips()) {
      printResume(fileName);
    } else {
      setPendingFileName(fileName);
    }
  }, []);

  function handleContinue(dontShowAgain) {
    if (dontShowAgain) markPdfTipsSeen();
    const fileName = pendingFileName;
    setPendingFileName(null);
    // let the dialog close before the (blocking) print dialog opens
    window.setTimeout(() => printResume(fileName), 80);
  }

  const tipsModal = (
    <PdfTipsModal
      open={Boolean(pendingFileName)}
      onCancel={() => setPendingFileName(null)}
      onContinue={handleContinue}
    />
  );

  return { downloadPdf, tipsModal };
}

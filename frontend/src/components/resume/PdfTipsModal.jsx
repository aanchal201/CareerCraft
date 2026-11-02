import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Checkbox from '../common/Checkbox.jsx';
import './PdfTipsModal.css';

const STEPS = [
  { label: 'Destination', value: 'Save as PDF' },
  { label: 'Paper size', value: 'A4' },
  { label: 'Margins', value: 'Default or None' },
  { label: 'Background graphics', value: 'On (keeps template colors)' },
  { label: 'Headers and footers', value: 'Off' },
];

/** Explains the print-dialog settings before the first PDF download. */
export default function PdfTipsModal({ open, onCancel, onContinue }) {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    if (open) setDontShowAgain(true);
  }, [open]);

  return (
    <Modal
      open={open}
      title="Download your resume as PDF"
      description="Your browser’s print dialog will open. Use these settings for a perfect PDF:"
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button icon={Printer} onClick={() => onContinue(dontShowAgain)}>
            Open print dialog
          </Button>
        </>
      }
    >
      <ul className="pdf-tips">
        {STEPS.map((step) => (
          <li key={step.label}>
            <span>{step.label}</span>
            <strong>{step.value}</strong>
          </li>
        ))}
      </ul>
      <p className="pdf-tips__note">
        Most settings are already correct in Chrome and Edge. Safari: choose <strong>PDF → Save as PDF</strong> at the
        bottom left.
      </p>
      <Checkbox
        label="Don’t show this again"
        checked={dontShowAgain}
        onChange={(event) => setDontShowAgain(event.target.checked)}
      />
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import FormInput from '../common/FormInput.jsx';
import Checkbox from '../common/Checkbox.jsx';
import Alert from '../common/Alert.jsx';
import Spinner from '../common/Spinner.jsx';
import portfolioService from '../../api/portfolioService';
import { getErrorMessage } from '../../api/axios';
import { AI_TONES, applySuggestions, describeSuggestions } from '../../utils/portfolioAi';
import './portfolioDialogs.css';

/**
 * "Write with AI" dialog in the portfolio editor.
 *  1. pick a tone  2. Grok suggests text  3. tick what to keep  4. apply.
 * Suggestions are applied to the draft only (then autosaved) - nothing is
 * changed until you click Apply.
 *
 * The draft is saved before asking, so the AI sees your latest edits.
 */
export default function AiWriteModal({ open, onClose, portfolioId, content, beforeRequest, onApply }) {
  const [step, setStep] = useState('setup'); // setup | working | review
  const [tone, setTone] = useState('PROFESSIONAL');
  const [aiStatus, setAiStatus] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setStep('setup');
    setSuggestions(null);
    setSelected([]);
    setError('');
    portfolioService
      .aiStatus()
      .then((status) => !cancelled && setAiStatus(status))
      .catch(() => !cancelled && setAiStatus(null));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const items = suggestions ? describeSuggestions(content, suggestions) : [];

  async function handleGenerate() {
    setError('');
    if (beforeRequest && !(await beforeRequest())) {
      setError('Save your latest changes first — fix the error shown in the toolbar and try again.');
      return;
    }
    setStep('working');
    try {
      const result = await portfolioService.aiWrite(portfolioId, tone);
      const list = describeSuggestions(content, result);
      setSuggestions(result);
      setSelected(list.map((item) => item.key));
      setAiStatus((status) => (status ? { ...status, remainingToday: Math.max(0, status.remainingToday - 1) } : status));
      setStep('review');
    } catch (err) {
      setError(getErrorMessage(err, 'The AI could not write suggestions right now.'));
      setStep('setup');
    }
  }

  function toggle(key) {
    setSelected((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  function handleApply() {
    onApply(applySuggestions(content, suggestions, selected));
  }

  const aiUsable = Boolean(aiStatus?.aiConfigured && aiStatus.remainingToday > 0);

  let body;
  let footer;
  if (step === 'working') {
    body = (
      <div className="pf-working" role="status">
        <Spinner size={28} label="Writing" />
        <strong>Writing suggestions…</strong>
        <span>This usually takes 10–40 seconds.</span>
      </div>
    );
    footer = null;
  } else if (step === 'review') {
    body = (
      <div className="pf-dialog">
        {items.length === 0 ? (
          <Alert type="success">Your text already matches what the AI suggested — nothing to change.</Alert>
        ) : (
          <>
            <div className="pf-suggestions__bar">
              <span>
                {selected.length} of {items.length} selected
              </span>
              <button
                type="button"
                className="pf-link-button"
                onClick={() => setSelected(selected.length === items.length ? [] : items.map((i) => i.key))}
              >
                {selected.length === items.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <ul className="pf-suggestions">
              {items.map((item) => (
                <li key={item.key} className={`pf-suggestion ${selected.includes(item.key) ? 'is-selected' : ''}`}>
                  <Checkbox label={<strong>{item.label}</strong>} checked={selected.includes(item.key)} onChange={() => toggle(item.key)} />
                  <p className="pf-suggestion__text">{item.value}</p>
                </li>
              ))}
            </ul>
            <p className="pf-dialog__note">Applied text goes into your draft — you can still edit it, and it isn’t public until you publish.</p>
          </>
        )}
      </div>
    );
    footer = (
      <>
        <Button variant="secondary" onClick={() => setStep('setup')}>
          Try another tone
        </Button>
        {items.length > 0 ? (
          <Button onClick={handleApply} disabled={selected.length === 0}>
            Apply {selected.length > 0 ? selected.length : ''} {selected.length === 1 ? 'change' : 'changes'}
          </Button>
        ) : (
          <Button onClick={onClose}>Done</Button>
        )}
      </>
    );
  } else {
    body = (
      <div className="pf-dialog">
        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          The AI reads what’s already in your portfolio and suggests a headline, tagline, about text, contact message,
          skill groups and project descriptions. You choose which suggestions to keep. It never adds skills or projects
          you don’t have.
        </p>
        <FormInput as="select" label="Writing tone" value={tone} onChange={(e) => setTone(e.target.value)} options={AI_TONES} />
        {aiStatus && !aiStatus.aiConfigured && (
          <Alert type="error">AI isn’t set up on the server yet (the GROK_API_KEY environment variable is missing).</Alert>
        )}
        {aiStatus?.aiConfigured && (
          <p className="pf-dialog__note">{aiStatus.remainingToday} AI uses left today.</p>
        )}
      </div>
    );
    footer = (
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button icon={Sparkles} onClick={handleGenerate} disabled={aiStatus !== null && !aiUsable}>
          Write suggestions
        </Button>
      </>
    );
  }

  return (
    <Modal
      open={open}
      size="lg"
      title="Write with AI"
      description="Get polished wording for your portfolio, based on your own details."
      onClose={step === 'working' ? () => {} : onClose}
      footer={footer}
    >
      {body}
    </Modal>
  );
}

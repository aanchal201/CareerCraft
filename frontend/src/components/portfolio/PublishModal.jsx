import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Globe, X } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Alert from '../common/Alert.jsx';
import Spinner from '../common/Spinner.jsx';
import portfolioService from '../../api/portfolioService';
import { getErrorMessage, getFieldErrors } from '../../api/axios';
import { publicPortfolioUrl, toSlug } from '../../utils/portfolioAi';
import useToast from '../../hooks/useToast';
import { formatRelativeTime } from '../../utils/date';
import './portfolioDialogs.css';

const CHECK_DELAY_MS = 400;

/**
 * Publish dialog: choose the public address (/p/your-name), publish the
 * current draft, republish changes, copy the link or unpublish.
 *
 * Publishing copies a *snapshot* of the draft. Later edits stay private
 * until you click "Publish changes".
 */
export default function PublishModal({ open, onClose, portfolioId, publishing, beforePublish, onPublishingChange }) {
  const toast = useToast();
  const [slug, setSlug] = useState('');
  const [check, setCheck] = useState({ state: 'idle', message: '' }); // idle | checking | ok | bad
  const [busy, setBusy] = useState(''); // '' | publish | unpublish
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const requestRef = useRef(0);

  const published = publishing?.published;
  const savedSlug = publishing?.slug || '';

  // On open: use the saved address, or ask the server to suggest one.
  useEffect(() => {
    if (!open) return;
    setError('');
    setCopied(false);
    if (savedSlug) {
      setSlug(savedSlug);
      setCheck({ state: 'ok', message: published ? 'This is your current address.' : 'This address is reserved for you.' });
      return;
    }
    setSlug('');
    setCheck({ state: 'checking', message: '' });
    const requestId = ++requestRef.current;
    portfolioService
      .checkSlug(portfolioId)
      .then((result) => {
        if (requestId !== requestRef.current) return;
        setSlug(result.slug || '');
        setCheck(result.available ? { state: 'ok', message: 'Available' } : { state: 'idle', message: '' });
      })
      .catch(() => requestId === requestRef.current && setCheck({ state: 'idle', message: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSlugChange(value) {
    const next = toSlug(value);
    setSlug(next);
    setError('');
    const requestId = ++requestRef.current;
    if (!next) {
      setCheck({ state: 'bad', message: 'Choose an address' });
      return;
    }
    setCheck({ state: 'checking', message: '' });
    window.setTimeout(async () => {
      if (requestId !== requestRef.current) return; // a newer keystroke replaced this check
      try {
        const result = await portfolioService.checkSlug(portfolioId, next);
        if (requestId !== requestRef.current) return;
        setCheck(result.available ? { state: 'ok', message: 'Available' } : { state: 'bad', message: result.message || 'Not available' });
      } catch (err) {
        if (requestId === requestRef.current) setCheck({ state: 'idle', message: '' });
      }
    }, CHECK_DELAY_MS);
  }

  async function handlePublish() {
    const finalSlug = slug.replace(/^-+|-+$/g, '');
    if (!finalSlug) {
      setCheck({ state: 'bad', message: 'Choose an address' });
      return;
    }
    setBusy('publish');
    setError('');
    try {
      // make sure the server has the latest draft - that's what gets published
      if (beforePublish && !(await beforePublish())) {
        setError('Your latest changes could not be saved, so nothing was published. Fix the error and try again.');
        return;
      }
      const saved = await portfolioService.publish(portfolioId, finalSlug);
      onPublishingChange(saved.publishing);
      setSlug(saved.publishing.slug);
      setCheck({ state: 'ok', message: 'This is your current address.' });
      toast.success(published ? 'Changes published' : 'Your portfolio is live!');
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (fieldErrors.slug) setCheck({ state: 'bad', message: fieldErrors.slug });
      else setError(getErrorMessage(err, 'Could not publish the portfolio.'));
    } finally {
      setBusy('');
    }
  }

  async function handleUnpublish() {
    setBusy('unpublish');
    setError('');
    try {
      const saved = await portfolioService.unpublish(portfolioId);
      onPublishingChange(saved.publishing);
      toast.success('Portfolio unpublished — the link no longer works');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not unpublish the portfolio.'));
    } finally {
      setBusy('');
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicPortfolioUrl(savedSlug));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select the link and copy it manually.');
    }
  }

  const slugChanged = published && slug !== savedSlug;
  const canPublish = check.state !== 'bad' && check.state !== 'checking' && slug.length > 0 && !busy;
  let publishLabel = 'Publish';
  if (published) publishLabel = slugChanged ? 'Move to new address' : 'Publish changes';

  const origin = typeof window !== 'undefined' ? window.location.host : '';

  return (
    <Modal
      open={open}
      title={published ? 'Your portfolio is live' : 'Publish your portfolio'}
      description={
        published
          ? 'Anyone with the link can see it. Edits stay private until you publish them.'
          : 'Choose a web address. Anyone with the link will be able to see your portfolio.'
      }
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={Boolean(busy)}>
            Close
          </Button>
          <Button
            icon={Globe}
            onClick={handlePublish}
            loading={busy === 'publish'}
            disabled={!canPublish || (published && !slugChanged && !publishing.hasUnpublishedChanges)}
          >
            {publishLabel}
          </Button>
        </>
      }
    >
      <div className="pf-dialog">
        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {published && (
          <div>
            <p className="pf-dialog__label">Live link</p>
            <div className="pf-live-link">
              <a href={publicPortfolioUrl(savedSlug)} target="_blank" rel="noopener noreferrer">
                {publicPortfolioUrl(savedSlug)}
              </a>
              <Button size="sm" variant="secondary" icon={copied ? Check : Copy} onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <a
                className="btn btn--ghost btn--sm"
                href={publicPortfolioUrl(savedSlug)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open live portfolio in a new tab"
              >
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="pf-live-meta">
              <p className="pf-dialog__note">
                {publishing.hasUnpublishedChanges
                  ? 'You have changes that aren’t live yet.'
                  : `Up to date · published ${formatRelativeTime(publishing.publishedAt)}`}
              </p>
              <Button
                size="sm"
                variant="ghost"
                icon={X}
                onClick={handleUnpublish}
                loading={busy === 'unpublish'}
                disabled={Boolean(busy)}
              >
                Unpublish
              </Button>
            </div>
          </div>
        )}

        <div>
          <label className="pf-dialog__label" htmlFor="pf-slug" style={{ display: 'block' }}>
            Web address
          </label>
          <div className={`pf-address ${check.state === 'bad' ? 'is-invalid' : ''}`}>
            <span className="pf-address__prefix" title={`${origin}/p/`}>
              {origin}/p/
            </span>
            <input
              id="pf-slug"
              value={slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              maxLength={40}
              placeholder="your-name"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={check.state === 'bad'}
              aria-describedby="pf-slug-state"
            />
          </div>
          <p id="pf-slug-state" className={`pf-address__state is-${check.state}`} aria-live="polite">
            {check.state === 'checking' && (
              <>
                <Spinner size={12} label="Checking" /> Checking…
              </>
            )}
            {check.state === 'ok' && (
              <>
                <Check size={14} aria-hidden="true" /> {check.message}
              </>
            )}
            {check.state === 'bad' && check.message}
            {check.state === 'idle' && '3–40 characters: lowercase letters, numbers and hyphens.'}
          </p>
          {slugChanged && <p className="pf-dialog__note">The old address will stop working.</p>}
        </div>
      </div>
    </Modal>
  );
}

import { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import FormInput from '../common/FormInput.jsx';
import Checkbox from '../common/Checkbox.jsx';
import Alert from '../common/Alert.jsx';
import Spinner from '../common/Spinner.jsx';
import PortfolioTemplatePicker from './PortfolioTemplatePicker.jsx';
import portfolioService from '../../api/portfolioService';
import resumeService from '../../api/resumeService';
import { getErrorMessage, getFieldErrors } from '../../api/axios';
import { AI_TONES } from '../../utils/portfolioAi';
import './portfolioDialogs.css';

const INITIAL = { name: '', templateId: 'minimal', resumeId: '', useAi: true, tone: 'PROFESSIONAL' };

/**
 * "Generate from resume" dialog.
 * Copies a resume into a new portfolio; optionally Grok rewrites the
 * headline, about text, skill groups and project descriptions. The AI only
 * rewords what's in the resume - it never adds skills or projects.
 */
export default function GeneratePortfolioModal({ open, onClose }) {
  const navigate = useNavigate();
  const formId = useId();
  const [form, setForm] = useState(INITIAL);
  const [resumes, setResumes] = useState(null); // null = loading
  const [aiStatus, setAiStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setForm(INITIAL);
    setErrors({});
    setFormError('');
    setResumes(null);
    setAiStatus(null);

    Promise.all([resumeService.list(), portfolioService.aiStatus().catch(() => null)])
      .then(([resumeList, status]) => {
        if (cancelled) return;
        setResumes(resumeList);
        setAiStatus(status);
        const aiUsable = Boolean(status?.aiConfigured && status.remainingToday > 0);
        setForm((prev) => ({
          ...prev,
          resumeId: resumeList[0] ? String(resumeList[0].id) : '',
          name: resumeList[0] ? `${resumeList[0].title} portfolio` : '',
          useAi: aiUsable,
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        setResumes([]);
        setFormError(getErrorMessage(err, 'Could not load your resumes.'));
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const aiUsable = Boolean(aiStatus?.aiConfigured && aiStatus.remainingToday > 0);
  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const name = form.name.trim();
    const nextErrors = {};
    if (!name) nextErrors.name = 'Give your portfolio a name';
    if (!form.resumeId) nextErrors.resumeId = 'Choose a resume';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setGenerating(true);
    setFormError('');
    try {
      const portfolio = await portfolioService.generate({
        name,
        templateId: form.templateId,
        resumeId: Number(form.resumeId),
        useAi: form.useAi && aiUsable,
        tone: form.useAi && aiUsable ? form.tone : '',
      });
      navigate(`/portfolios/${portfolio.id}`);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not generate the portfolio.'));
      setGenerating(false);
    }
  }

  let body;
  if (generating) {
    body = (
      <div className="pf-working" role="status">
        <Spinner size={28} label="Generating" />
        <strong>{form.useAi && aiUsable ? 'Writing your portfolio with AI…' : 'Building your portfolio…'}</strong>
        <span>{form.useAi && aiUsable ? 'This usually takes 10–40 seconds.' : 'Just a moment.'}</span>
      </div>
    );
  } else if (resumes === null) {
    body = (
      <div className="pf-working">
        <Spinner size={24} label="Loading resumes" />
      </div>
    );
  } else if (resumes.length === 0) {
    body = (
      <>
        {formError && <Alert type="error">{formError}</Alert>}
        <p className="pf-dialog__note" style={{ fontSize: 'var(--text-sm)' }}>
          You don’t have any resumes yet. <Link to="/resumes">Create a resume</Link> first, or start a portfolio from
          your profile instead.
        </p>
      </>
    );
  } else {
    body = (
      <form id={formId} onSubmit={handleSubmit} noValidate className="pf-dialog">
        {formError && (
          <Alert type="error" onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        <FormInput
          as="select"
          label="Resume"
          value={form.resumeId}
          onChange={(event) => set('resumeId', event.target.value)}
          options={resumes.map((resume) => ({ value: String(resume.id), label: resume.title }))}
          error={errors.resumeId}
          hint="Your summary, skills, projects, experience, education and links are copied in."
        />

        <FormInput
          label="Portfolio name"
          value={form.name}
          onChange={(event) => set('name', event.target.value)}
          error={errors.name}
          hint="Only you see this name."
          maxLength={120}
        />

        <div>
          <p className="pf-dialog__label">Template</p>
          <PortfolioTemplatePicker value={form.templateId} onChange={(templateId) => set('templateId', templateId)} />
        </div>

        <div className="pf-ai-box">
          <div className="pf-ai-box__head">
            <Checkbox
              label="Polish the text with AI"
              checked={form.useAi && aiUsable}
              disabled={!aiUsable}
              onChange={(event) => set('useAi', event.target.checked)}
            />
            {aiStatus?.aiConfigured && (
              <span className="pf-ai-box__quota">{aiStatus.remainingToday} AI uses left today</span>
            )}
          </div>
          {!aiStatus?.aiConfigured && (
            <p className="pf-dialog__note">AI isn’t set up on the server yet — your resume will be copied as it is.</p>
          )}
          {aiStatus?.aiConfigured && aiStatus.remainingToday === 0 && (
            <p className="pf-dialog__note">You’ve used today’s AI requests. Your resume will be copied as it is.</p>
          )}
          {form.useAi && aiUsable && (
            <>
              <FormInput
                as="select"
                label="Writing tone"
                value={form.tone}
                onChange={(event) => set('tone', event.target.value)}
                options={AI_TONES}
              />
              <p className="pf-dialog__note">
                The AI writes your headline, about text and project descriptions from your resume. It never adds skills,
                jobs or projects you don’t have.
              </p>
            </>
          )}
        </div>
      </form>
    );
  }

  const canSubmit = resumes !== null && resumes.length > 0;

  return (
    <Modal
      open={open}
      size="lg"
      title="Generate a portfolio from a resume"
      description="Turn a resume you’ve already built into a personal website in one step."
      onClose={generating ? () => {} : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          {canSubmit && (
            <Button type="submit" form={formId} icon={Sparkles} loading={generating}>
              Generate portfolio
            </Button>
          )}
        </>
      }
    >
      {body}
    </Modal>
  );
}

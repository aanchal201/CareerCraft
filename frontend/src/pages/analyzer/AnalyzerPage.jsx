import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, ScanSearch, Sparkles, Upload } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import FormInput from '../../components/common/FormInput.jsx';
import Alert from '../../components/common/Alert.jsx';
import ResumeDropzone from '../../components/analyzer/ResumeDropzone.jsx';
import AnalyzingState from '../../components/analyzer/AnalyzingState.jsx';
import ScoreBadge from '../../components/analyzer/ScoreBadge.jsx';
import analysisService from '../../api/analysisService';
import resumeService from '../../api/resumeService';
import { getErrorMessage, getFieldErrors } from '../../api/axios';
import { formatRelativeTime } from '../../utils/date';
import './AnalyzerPage.css';

const MAX_JD = 15000;

/**
 * Start a new analysis (upload a PDF or pick a saved resume, optionally paste
 * a job description) and see past analyses.
 * "Analyze again" from a result page arrives here with { resumeId, jobDescription } in location.state.
 */
export default function AnalyzerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preset = location.state || {};

  const [source, setSource] = useState(preset.resumeId ? 'saved' : 'upload');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [resumeId, setResumeId] = useState(preset.resumeId ? String(preset.resumeId) : '');
  const [jobDescription, setJobDescription] = useState(preset.jobDescription || '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState(null);
  const [status, setStatus] = useState(null);

  const loadSideData = useCallback(async () => {
    const [resumeList, historyList, aiStatus] = await Promise.allSettled([
      resumeService.list(),
      analysisService.list(),
      analysisService.status(),
    ]);
    if (resumeList.status === 'fulfilled') setResumes(resumeList.value);
    setHistory(historyList.status === 'fulfilled' ? historyList.value : []);
    if (aiStatus.status === 'fulfilled') setStatus(aiStatus.value);
  }, []);

  useEffect(() => {
    loadSideData();
  }, [loadSideData]);

  function validate() {
    const next = {};
    if (source === 'upload' && !file) next.file = 'Choose a PDF to analyze';
    if (source === 'saved' && !resumeId) next.resumeId = 'Choose one of your resumes';
    const jd = jobDescription.trim();
    if (jd && jd.length < 50) next.jobDescription = 'Paste the full job description (at least 50 characters)';
    if (jd.length > MAX_JD) next.jobDescription = `Job description must be at most ${MAX_JD} characters`;
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validate();
    if (validationErrors.file) setFileError(validationErrors.file);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setFormError('');
    setAnalyzing(true);
    try {
      const result = await analysisService.analyze({
        file: source === 'upload' ? file : null,
        resumeId: source === 'saved' ? resumeId : null,
        jobDescription,
      });
      navigate(`/analyzer/${result.id}`, { state: { analysis: result } });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (fieldErrors.file) setFileError(fieldErrors.file);
      setErrors(fieldErrors);
      setFormError(
        err.code === 'ECONNABORTED'
          ? 'The analysis took too long. Please try again in a moment.'
          : getErrorMessage(err, 'The analysis failed. Please try again.')
      );
      setAnalyzing(false);
      loadSideData(); // refresh the remaining-today counter
    }
  }

  const aiUnavailable = status && !status.aiConfigured;
  const limitReached = status && status.aiConfigured && status.remainingToday === 0;
  const resumeOptions = [
    { value: '', label: resumes.length ? 'Select a resume…' : 'No saved resumes yet' },
    ...resumes.map((r) => ({ value: String(r.id), label: r.title })),
  ];

  return (
    <div>
      <PageHeader
        title="Resume Analyzer"
        description="Get an estimated ATS score, specific improvements, and a match report for any job."
      />

      {aiUnavailable && (
        <div className="analyzer__banner">
          <Alert type="error">
            AI isn’t configured on the server yet. Add <code>GROK_API_KEY</code> to <code>backend/.env</code> and
            restart the backend.
          </Alert>
        </div>
      )}

      <div className="analyzer">
        <section className="card analyzer__form-card">
          {analyzing ? (
            <AnalyzingState withJob={Boolean(jobDescription.trim())} />
          ) : (
            <form className="card__body analyzer__form" onSubmit={handleSubmit} noValidate>
              {formError && (
                <Alert type="error" onClose={() => setFormError('')}>
                  {formError}
                </Alert>
              )}

              <div className="analyzer__step">
                <h2 className="analyzer__step-title">
                  <span>1</span> Choose a resume
                </h2>

                <div className="analyzer__source" role="tablist" aria-label="Resume source">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={source === 'upload'}
                    className={source === 'upload' ? 'is-active' : ''}
                    onClick={() => setSource('upload')}
                  >
                    <Upload size={16} /> Upload PDF
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={source === 'saved'}
                    className={source === 'saved' ? 'is-active' : ''}
                    onClick={() => setSource('saved')}
                  >
                    <FileText size={16} /> My resumes
                  </button>
                </div>

                {source === 'upload' ? (
                  <ResumeDropzone file={file} onFileChange={setFile} error={fileError} onError={setFileError} />
                ) : (
                  <>
                    <FormInput
                      as="select"
                      label="Saved resume"
                      options={resumeOptions}
                      value={resumeId}
                      onChange={(event) => setResumeId(event.target.value)}
                      error={errors.resumeId}
                      disabled={resumes.length === 0}
                    />
                    {resumes.length === 0 && (
                      <p className="analyzer__note">
                        <Link to="/resumes">Create a resume</Link> first, or upload a PDF instead.
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="analyzer__step">
                <h2 className="analyzer__step-title">
                  <span>2</span> Paste a job description <em>Optional</em>
                </h2>
                <FormInput
                  as="textarea"
                  rows={8}
                  placeholder="Paste the job posting here to get a match score and the keywords your resume is missing."
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  error={errors.jobDescription}
                  maxLength={MAX_JD}
                  showCount
                />
              </div>

              <div className="analyzer__submit">
                {status?.aiConfigured && (
                  <span className="analyzer__quota">
                    {status.remainingToday} of {status.dailyLimit} analyses left today
                  </span>
                )}
                <Button type="submit" size="lg" icon={Sparkles} disabled={aiUnavailable || limitReached}>
                  Analyze resume
                </Button>
              </div>

              <p className="analyzer__privacy">
                Your resume text is sent securely to xAI’s Grok model for analysis and isn’t stored by the AI provider.
              </p>
            </form>
          )}
        </section>

        <aside className="card analyzer__history">
          <div className="card__header">
            <h2 className="card__title">Recent analyses</h2>
          </div>
          <div className="card__body">
            {history === null && <p className="analyzer__note">Loading…</p>}
            {history?.length === 0 && (
              <div className="analyzer__history-empty">
                <ScanSearch size={22} aria-hidden="true" />
                <p>Your analyses will appear here.</p>
              </div>
            )}
            {history?.length > 0 && (
              <ul className="history-list">
                {history.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <Link to={`/analyzer/${item.id}`} className="history-list__item">
                      <ScoreBadge score={item.atsScore} label="ATS score" />
                      <span className="history-list__text">
                        <strong>{item.sourceName}</strong>
                        <small>
                          {item.jobTitle ? `vs ${item.jobTitle} · ` : ''}
                          {formatRelativeTime(item.createdAt)}
                        </small>
                      </span>
                      <ChevronRight size={16} aria-hidden="true" className="history-list__chevron" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

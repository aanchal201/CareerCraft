import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, FileText, PencilLine, RefreshCw, Trash2, Upload } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingBlock from '../../components/common/LoadingBlock.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import {
  AtsChecklist,
  ImprovementsList,
  InsightsCard,
  JobMatchCard,
  ScoreBreakdown,
  ScoreOverview,
} from '../../components/analyzer/AnalysisSections.jsx';
import analysisService from '../../api/analysisService';
import { getErrorMessage } from '../../api/axios';
import useToast from '../../hooks/useToast';
import '../../components/common/Button.css';
import './AnalysisResultPage.css';

/** Shows one saved analysis. Uses the result passed from the analyzer if available. */
export default function AnalysisResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const passed = location.state?.analysis;
  const [analysis, setAnalysis] = useState(passed && String(passed.id) === id ? passed : null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setNotFound(false);
    try {
      setAnalysis(await analysisService.get(id));
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) setNotFound(true);
      else setError(getErrorMessage(err, 'Could not load this analysis.'));
    }
  }, [id]);

  useEffect(() => {
    if (!analysis || String(analysis.id) !== id) load();
  }, [id, analysis, load]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await analysisService.remove(analysis.id);
      toast.success('Analysis deleted');
      navigate('/analyzer', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the analysis.'));
      setDeleting(false);
    }
  }

  function analyzeAgain() {
    navigate('/analyzer', {
      state: {
        resumeId: analysis.sourceType === 'SAVED_RESUME' ? analysis.resumeId : undefined,
        jobDescription: analysis.jobDescription || '',
      },
    });
  }

  if (notFound) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="danger"
        title="Analysis not found"
        text="It may have been deleted."
        action={
          <Link to="/analyzer" className="btn btn--primary btn--md">
            Back to analyzer
          </Link>
        }
      />
    );
  }
  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="danger"
        title="We couldn't load this analysis"
        text={error}
        action={<Button onClick={load}>Try again</Button>}
      />
    );
  }
  if (!analysis) return <LoadingBlock label="Loading analysis…" />;

  const created = new Date(analysis.createdAt).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const SourceIcon = analysis.sourceType === 'UPLOAD' ? Upload : FileText;

  return (
    <div className="analysis-result">
      <header className="analysis-result__header">
        <Link to="/analyzer" className="analysis-result__back">
          <ArrowLeft size={16} aria-hidden="true" /> Analyzer
        </Link>
        <div className="analysis-result__title-row">
          <div>
            <h1>{analysis.sourceName}</h1>
            <p className="analysis-result__meta">
              <SourceIcon size={14} aria-hidden="true" />
              {analysis.sourceType === 'UPLOAD' ? 'Uploaded PDF' : 'Saved resume'} · {created}
              {analysis.jobTitle && <> · vs {analysis.jobTitle}</>}
            </p>
          </div>
          <div className="analysis-result__actions">
            {analysis.sourceType === 'SAVED_RESUME' && analysis.resumeId && (
              <Link to={`/resumes/${analysis.resumeId}`} className="btn btn--secondary btn--sm analysis-result__link">
                <PencilLine size={16} aria-hidden="true" />
                <span>Edit resume</span>
              </Link>
            )}
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={analyzeAgain}>
              Analyze again
            </Button>
            <Button size="sm" variant="ghost" iconOnly icon={Trash2} onClick={() => setConfirmDelete(true)} aria-label="Delete analysis" />
          </div>
        </div>
      </header>

      <ScoreOverview analysis={analysis} />

      <JobMatchCard match={analysis.ai.jobMatch} />

      <div className="analysis-result__grid">
        <div className="analysis-result__col">
          <ImprovementsList improvements={analysis.ai.improvements} />
          <InsightsCard ai={analysis.ai} />
        </div>
        <div className="analysis-result__col">
          <ScoreBreakdown items={analysis.ai.scoreBreakdown} />
          <AtsChecklist checks={analysis.atsChecks} />
        </div>
      </div>

      <p className="analysis-result__footer">
        Generated by {analysis.model}. AI feedback can be wrong — use your judgment, and never add skills you don’t have.
      </p>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this analysis?"
        message="It will be removed from your history. Your resume is not affected."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

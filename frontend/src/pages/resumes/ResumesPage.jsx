import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Copy, FileDown, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingBlock from '../../components/common/LoadingBlock.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import CreateResumeModal from '../../components/resume/CreateResumeModal.jsx';
import { getTemplate } from '../../components/resume/templates/templateRegistry.js';
import resumeService from '../../api/resumeService';
import { getErrorMessage } from '../../api/axios';
import useToast from '../../hooks/useToast';
import { formatRelativeTime } from '../../utils/date';
import './ResumesPage.css';

/** "My resumes": list, create, duplicate, delete. */
export default function ResumesPage() {
  const toast = useToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setResumes(await resumeService.list());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your resumes.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDuplicate(resume) {
    setDuplicatingId(resume.id);
    try {
      const copy = await resumeService.duplicate(resume.id);
      setResumes((current) => [copy, ...current]);
      toast.success('Resume duplicated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not duplicate the resume.'));
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await resumeService.remove(deleteTarget.id);
      setResumes((current) => current.filter((resume) => resume.id !== deleteTarget.id));
      toast.success('Resume deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the resume.'));
    } finally {
      setDeleting(false);
    }
  }

  let body;
  if (loading) {
    body = <LoadingBlock label="Loading your resumes…" />;
  } else if (error) {
    body = (
      <EmptyState
        icon={AlertCircle}
        tone="danger"
        title="We couldn't load your resumes"
        text={error}
        action={<Button onClick={load}>Try again</Button>}
      />
    );
  } else if (resumes.length === 0) {
    body = (
      <EmptyState
        icon={FileText}
        title="No resumes yet"
        text="Create your first resume in minutes — we can fill it in from your profile."
        action={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Create a resume
          </Button>
        }
      />
    );
  } else {
    body = (
      <ul className="resume-grid">
        {resumes.map((resume) => (
          <li key={resume.id} className="resume-card">
            <Link to={`/resumes/${resume.id}`} className="resume-card__preview" aria-label={`Open ${resume.title}`}>
              <MiniDocument templateId={resume.templateId} accentColor={resume.accentColor} />
            </Link>
            <div className="resume-card__body">
              <Link to={`/resumes/${resume.id}`} className="resume-card__title">
                {resume.title}
              </Link>
              <p className="resume-card__meta">
                {getTemplate(resume.templateId).name} · Edited {formatRelativeTime(resume.updatedAt)}
              </p>
            </div>
            <div className="resume-card__actions">
              <Link to={`/resumes/${resume.id}`} className="btn btn--secondary btn--sm resume-card__edit">
                <Pencil size={16} aria-hidden="true" />
                <span>Edit</span>
              </Link>
              <Link
                to={`/resumes/${resume.id}/preview?download=1`}
                className="btn btn--ghost btn--sm btn--icon-only resume-card__icon-link"
                aria-label={`Download ${resume.title} as PDF`}
                title="Download PDF"
              >
                <FileDown size={16} aria-hidden="true" />
              </Link>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                icon={Copy}
                loading={duplicatingId === resume.id}
                onClick={() => handleDuplicate(resume)}
                aria-label={`Duplicate ${resume.title}`}
              />
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                icon={Trash2}
                onClick={() => setDeleteTarget(resume)}
                aria-label={`Delete ${resume.title}`}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <PageHeader
        title="Resumes"
        description="Keep a tailored resume for each role you apply to."
        actions={
          resumes.length > 0 && (
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              New resume
            </Button>
          )
        }
      />

      {body}

      <CreateResumeModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this resume?"
        message={deleteTarget ? `“${deleteTarget.title}” will be permanently deleted. This can't be undone.` : ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/**
 * Lightweight stand-in for a thumbnail (the list doesn't load full content).
 * Its shape hints at the template's layout.
 */
function MiniDocument({ templateId, accentColor }) {
  return (
    <span className={`mini-doc mini-doc--${templateId}`} style={{ '--doc-accent': accentColor }} aria-hidden="true">
      <span className="mini-doc__header" />
      <span className="mini-doc__body">
        <span className="mini-doc__side" />
        <span className="mini-doc__lines">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
      </span>
    </span>
  );
}

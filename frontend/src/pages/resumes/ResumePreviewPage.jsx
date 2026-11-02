import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, FileDown, Info, PencilLine } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingBlock from '../../components/common/LoadingBlock.jsx';
import ResumePreview from '../../components/resume/ResumePreview.jsx';
import PrintableResume from '../../components/resume/PrintableResume.jsx';
import { getTemplate } from '../../components/resume/templates/templateRegistry.js';
import resumeService from '../../api/resumeService';
import { getErrorMessage } from '../../api/axios';
import usePdfDownload from '../../hooks/usePdfDownload.jsx';
import { buildPdfFileName } from '../../utils/pdf';
import '../../components/common/Button.css';
import './ResumePreviewPage.css';

/**
 * Distraction-free, full-page preview of a saved resume with a
 * "Download PDF" button. Opening it with ?download=1 (from the resume list)
 * starts the download automatically.
 */
export default function ResumePreviewPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resume, setResume] = useState(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const { downloadPdf, tipsModal } = usePdfDownload();
  const autoDownloadDone = useRef(false);

  const load = useCallback(async () => {
    setError('');
    setNotFound(false);
    try {
      setResume(await resumeService.get(id));
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) setNotFound(true);
      else setError(getErrorMessage(err, 'Could not load this resume.'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const fileName = resume ? buildPdfFileName({ fullName: resume.content.personal.fullName, title: resume.title }) : '';

  // ?download=1 -> open the download flow once the resume has rendered
  useEffect(() => {
    if (!resume || autoDownloadDone.current || searchParams.get('download') !== '1') return;
    autoDownloadDone.current = true;
    setSearchParams({}, { replace: true });
    downloadPdf(fileName);
  }, [resume, searchParams, setSearchParams, downloadPdf, fileName]);

  if (notFound) {
    return (
      <div className="resume-preview-page__state">
        <EmptyState
          icon={AlertCircle}
          tone="danger"
          title="Resume not found"
          text="It may have been deleted, or the link is wrong."
          action={
            <Link to="/resumes" className="btn btn--primary btn--md">
              Back to resumes
            </Link>
          }
        />
      </div>
    );
  }
  if (error) {
    return (
      <div className="resume-preview-page__state">
        <EmptyState
          icon={AlertCircle}
          tone="danger"
          title="We couldn't load this resume"
          text={error}
          action={<Button onClick={load}>Try again</Button>}
        />
      </div>
    );
  }
  if (!resume) return <LoadingBlock label="Preparing your resume…" />;

  return (
    <div className="resume-preview-page">
      <header className="resume-preview-page__bar">
        <Link to="/resumes" className="btn btn--ghost btn--sm resume-preview-page__back">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Resumes</span>
        </Link>
        <div className="resume-preview-page__title">
          <h1>{resume.title}</h1>
          <p>{getTemplate(resume.templateId).name} template</p>
        </div>
        <div className="resume-preview-page__actions">
          <Link to={`/resumes/${resume.id}`} className="btn btn--secondary btn--sm resume-preview-page__edit">
            <PencilLine size={16} aria-hidden="true" />
            <span>Edit</span>
          </Link>
          <Button size="sm" icon={FileDown} onClick={() => downloadPdf(fileName)}>
            Download PDF
          </Button>
        </div>
      </header>

      <main className="resume-preview-page__main">
        <div className="resume-preview-page__paper">
          <ResumePreview templateId={resume.templateId} accentColor={resume.accentColor} content={resume.content} />
        </div>

        <aside className="resume-preview-page__tips">
          <Info size={16} aria-hidden="true" />
          <p>
            The PDF is created by your browser, so it looks exactly like this preview and its text stays selectable —
            which applicant tracking systems need. In the print dialog choose <strong>Save as PDF</strong>.
          </p>
        </aside>
      </main>

      <PrintableResume templateId={resume.templateId} accentColor={resume.accentColor} content={resume.content} />
      {tipsModal}
    </div>
  );
}

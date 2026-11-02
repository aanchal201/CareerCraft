import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Copy, ExternalLink, Globe, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingBlock from '../../components/common/LoadingBlock.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import CreatePortfolioModal from '../../components/portfolio/CreatePortfolioModal.jsx';
import GeneratePortfolioModal from '../../components/portfolio/GeneratePortfolioModal.jsx';
import PublishStatePill from '../../components/portfolio/PublishStatePill.jsx';
import PortfolioThumbnail from '../../components/portfolio/PortfolioThumbnail.jsx';
import { getPortfolioTemplate, SAMPLE_PORTFOLIO } from '../../components/portfolio/templates/portfolioRegistry.js';
import portfolioService from '../../api/portfolioService';
import { getErrorMessage } from '../../api/axios';
import useToast from '../../hooks/useToast';
import { formatRelativeTime } from '../../utils/date';
import { publicPortfolioUrl } from '../../utils/portfolioAi';
import '../resumes/ResumesPage.css';
import './PortfoliosPage.css';

/** "My portfolios": list, create, duplicate, delete. */
export default function PortfoliosPage() {
  const toast = useToast();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // portfolio being deleted
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPortfolios(await portfolioService.list());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your portfolios.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDuplicate(portfolio) {
    setDuplicatingId(portfolio.id);
    try {
      const copy = await portfolioService.duplicate(portfolio.id);
      setPortfolios((current) => [
        {
          ...copy,
          primaryColor: copy.design.primaryColor,
          colorMode: copy.design.colorMode,
          slug: copy.publishing?.slug ?? null,
          published: false,
        },
        ...current,
      ]);
      toast.success('Portfolio duplicated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not duplicate the portfolio.'));
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await portfolioService.remove(deleteTarget.id);
      setPortfolios((current) => current.filter((p) => p.id !== deleteTarget.id));
      toast.success('Portfolio deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the portfolio.'));
    } finally {
      setDeleting(false);
    }
  }

  let body;
  if (loading) {
    body = <LoadingBlock label="Loading your portfolios…" />;
  } else if (error) {
    body = (
      <EmptyState
        icon={AlertCircle}
        tone="danger"
        title="We couldn't load your portfolios"
        text={error}
        action={<Button onClick={load}>Try again</Button>}
      />
    );
  } else if (portfolios.length === 0) {
    body = (
      <EmptyState
        icon={Globe}
        title="No portfolios yet"
        text="Build a personal website to showcase your projects — no coding needed. Start blank or turn a resume into one."
        action={
          <div className="portfolios-page__actions">
            <Button icon={Sparkles} onClick={() => setGenerateOpen(true)}>
              Generate from resume
            </Button>
            <Button variant="secondary" icon={Plus} onClick={() => setCreateOpen(true)}>
              Start from scratch
            </Button>
          </div>
        }
      />
    );
  } else {
    body = (
      <ul className="resume-grid portfolio-grid">
        {portfolios.map((portfolio) => (
          <li key={portfolio.id} className="resume-card">
            <Link to={`/portfolios/${portfolio.id}`} className="resume-card__preview portfolio-card__preview" aria-label={`Open ${portfolio.name}`}>
              {/* Shows the real template + the portfolio's colors, with example content */}
              <PortfolioThumbnail
                templateId={portfolio.templateId}
                design={{ primaryColor: portfolio.primaryColor, colorMode: portfolio.colorMode }}
                content={SAMPLE_PORTFOLIO}
                width={232}
                height={150}
              />
            </Link>
            <div className="resume-card__body">
              <Link to={`/portfolios/${portfolio.id}`} className="resume-card__title">
                {portfolio.name}
              </Link>
              <p className="resume-card__meta">
                {getPortfolioTemplate(portfolio.templateId).name} · Edited {formatRelativeTime(portfolio.updatedAt)}
              </p>
              <div className="portfolio-card__publish">
                <PublishStatePill publishing={{ published: portfolio.published }} />
                {portfolio.published && portfolio.slug && (
                  <a href={publicPortfolioUrl(portfolio.slug)} target="_blank" rel="noopener noreferrer" className="portfolio-card__live">
                    /p/{portfolio.slug}
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
            <div className="resume-card__actions">
              <Link to={`/portfolios/${portfolio.id}`} className="btn btn--secondary btn--sm resume-card__edit">
                <Pencil size={16} aria-hidden="true" />
                <span>Edit</span>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                icon={Copy}
                loading={duplicatingId === portfolio.id}
                onClick={() => handleDuplicate(portfolio)}
                aria-label={`Duplicate ${portfolio.name}`}
              />
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                icon={Trash2}
                onClick={() => setDeleteTarget(portfolio)}
                aria-label={`Delete ${portfolio.name}`}
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
        title="Portfolios"
        description="Design a personal website that shows off your work, then publish it with your own link."
        actions={
          portfolios.length > 0 && (
            <div className="portfolios-page__actions">
              <Button variant="secondary" icon={Sparkles} onClick={() => setGenerateOpen(true)}>
                Generate from resume
              </Button>
              <Button icon={Plus} onClick={() => setCreateOpen(true)}>
                New portfolio
              </Button>
            </div>
          )
        }
      />

      {body}

      <CreatePortfolioModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <GeneratePortfolioModal open={generateOpen} onClose={() => setGenerateOpen(false)} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this portfolio?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently deleted.${deleteTarget.published ? ' Its live website will go offline too.' : ''}`
            : ''
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

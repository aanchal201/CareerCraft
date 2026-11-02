import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Plus } from 'lucide-react';
import Spinner from '../common/Spinner.jsx';
import resumeService from '../../api/resumeService';
import { getTemplate } from './templates/templateRegistry.js';
import { formatRelativeTime } from '../../utils/date';
import './RecentResumesCard.css';

/** Dashboard card: the 3 most recently edited resumes. */
export default function RecentResumesCard() {
  const [resumes, setResumes] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resumeService
      .list()
      .then((list) => !cancelled && setResumes(list))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="card recent-resumes">
      <div className="card__header">
        <div>
          <h2 className="card__title">Your resumes</h2>
          <p className="card__subtitle">Pick up where you left off.</p>
        </div>
        <Link to="/resumes" className="recent-resumes__all">
          View all
        </Link>
      </div>

      <div className="card__body">
        {failed && <p className="recent-resumes__note">Couldn’t load your resumes right now.</p>}

        {!failed && resumes === null && (
          <div className="recent-resumes__loading">
            <Spinner size={18} />
          </div>
        )}

        {resumes?.length === 0 && (
          <Link to="/resumes" className="recent-resumes__empty">
            <Plus size={18} aria-hidden="true" />
            <span>
              <strong>Create your first resume</strong>
              <small>Start from your profile in one click</small>
            </span>
          </Link>
        )}

        {resumes?.length > 0 && (
          <ul className="recent-resumes__list">
            {resumes.slice(0, 3).map((resume) => (
              <li key={resume.id}>
                <Link to={`/resumes/${resume.id}`} className="recent-resumes__item">
                  <span className="recent-resumes__icon" style={{ color: resume.accentColor }}>
                    <FileText size={18} aria-hidden="true" />
                  </span>
                  <span className="recent-resumes__text">
                    <strong>{resume.title}</strong>
                    <small>
                      {getTemplate(resume.templateId).name} · Edited {formatRelativeTime(resume.updatedAt)}
                    </small>
                  </span>
                  <ArrowRight size={16} className="recent-resumes__arrow" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

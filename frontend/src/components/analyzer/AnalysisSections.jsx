import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Lightbulb,
  ListChecks,
  Target,
  ThumbsUp,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import ProgressRing from '../common/ProgressRing.jsx';
import { scoreTone } from '../../utils/score';
import './AnalysisSections.css';

const SENIORITY_LABELS = { ENTRY: 'Entry level', JUNIOR: 'Junior', MID: 'Mid level', SENIOR: 'Senior', LEAD: 'Lead' };
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/** Big ATS score ring (+ optional job-match ring) with the AI's summary. */
export function ScoreOverview({ analysis }) {
  const ats = scoreTone(analysis.atsScore);
  const passed = analysis.atsChecks.filter((check) => check.passed).length;
  const match = analysis.ai.jobMatch;
  const matchTone = match ? scoreTone(match.matchScore) : null;

  return (
    <section className="card score-overview">
      <div className="score-overview__scores">
        <div className="score-overview__score">
          <ProgressRing value={analysis.atsScore} size={132} stroke={11} color={ats.color} label="Estimated ATS score" />
          <div>
            <p className="score-overview__label">Estimated ATS score</p>
            <p className={`score-overview__tone tone--${ats.tone}`}>{ats.label}</p>
          </div>
        </div>

        {match && (
          <div className="score-overview__score">
            <ProgressRing value={match.matchScore} size={132} stroke={11} color={matchTone.color} label="Job match" />
            <div>
              <p className="score-overview__label">Job match</p>
              <p className={`score-overview__tone tone--${matchTone.tone}`}>{matchTone.label}</p>
              {match.jobTitle && <p className="score-overview__job">{match.jobTitle}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="score-overview__summary">
        <p>{analysis.ai.summary}</p>
        <dl className="score-overview__stats">
          <div>
            <dt>AI review</dt>
            <dd>{analysis.aiScore}/100</dd>
          </div>
          <div>
            <dt>ATS checks passed</dt>
            <dd>
              {passed}/{analysis.atsChecks.length}
            </dd>
          </div>
          <div>
            <dt>Words</dt>
            <dd>{analysis.wordCount}</dd>
          </div>
        </dl>
        <p className="score-overview__note">
          The score blends the AI review (70%) with rule-based ATS checks (30%). It’s an estimate — real ATS systems vary.
        </p>
      </div>
    </section>
  );
}

/** One horizontal bar per category. */
export function ScoreBreakdown({ items }) {
  if (!items.length) return null;
  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title section-title">
          <TrendingUp size={18} aria-hidden="true" /> Score breakdown
        </h2>
      </div>
      <div className="card__body">
        <ul className="breakdown">
          {items.map((item) => {
            const { color } = scoreTone(item.score);
            return (
              <li key={item.category}>
                <div className="breakdown__head">
                  <span>{item.category}</span>
                  <strong style={{ color }}>{item.score}</strong>
                </div>
                <div className="breakdown__track">
                  <span style={{ width: `${item.score}%`, background: color }} />
                </div>
                {item.comment && <p className="breakdown__comment">{item.comment}</p>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Rule-based checks: pass / fail with explanation. */
export function AtsChecklist({ checks }) {
  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title section-title">
          <ListChecks size={18} aria-hidden="true" /> ATS checklist
        </h2>
      </div>
      <div className="card__body">
        <ul className="checklist">
          {checks.map((check) => (
            <li key={check.key} className={check.passed ? 'is-pass' : 'is-fail'}>
              {check.passed ? (
                <CheckCircle2 size={18} className="checklist__icon" aria-label="Passed" />
              ) : (
                <XCircle size={18} className="checklist__icon" aria-label="Needs attention" />
              )}
              <div>
                <p className="checklist__label">{check.label}</p>
                <p className="checklist__detail">{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Matched / missing keywords and tailoring tips for the pasted job. */
export function JobMatchCard({ match }) {
  if (!match) return null;
  const required = match.missingKeywords.filter((k) => k.importance === 'REQUIRED');
  const preferred = match.missingKeywords.filter((k) => k.importance !== 'REQUIRED');

  return (
    <section className="card job-match">
      <div className="card__header">
        <div>
          <h2 className="card__title section-title">
            <Target size={18} aria-hidden="true" /> Job match{match.jobTitle ? `: ${match.jobTitle}` : ''}
          </h2>
          {match.verdict && <p className="card__subtitle">{match.verdict}</p>}
        </div>
      </div>
      <div className="card__body job-match__body">
        <div>
          <h3 className="mini-title">Keywords you already have ({match.matchedKeywords.length})</h3>
          {match.matchedKeywords.length ? (
            <ul className="chips">
              {match.matchedKeywords.map((keyword) => (
                <li key={keyword} className="chip chip--good">
                  <Check size={13} aria-hidden="true" /> {keyword}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">None of the job’s key terms were found.</p>
          )}
        </div>

        <div>
          <h3 className="mini-title">Missing keywords ({match.missingKeywords.length})</h3>
          {match.missingKeywords.length === 0 && <p className="muted">Nothing important is missing — nice!</p>}
          {[...required, ...preferred].length > 0 && (
            <ul className="missing-list">
              {[...required, ...preferred].map((item) => (
                <li key={item.keyword}>
                  <span className={`chip ${item.importance === 'REQUIRED' ? 'chip--bad' : 'chip--warn'}`}>{item.keyword}</span>
                  <span className="missing-list__importance">
                    {item.importance === 'REQUIRED' ? 'Required' : 'Preferred'}
                  </span>
                  {item.suggestion && <p className="missing-list__suggestion">{item.suggestion}</p>}
                </li>
              ))}
            </ul>
          )}
          <p className="job-match__honesty">
            Only add keywords for skills you genuinely have — interviewers will ask about them.
          </p>
        </div>

        {match.recommendations.length > 0 && (
          <div className="job-match__recs">
            <h3 className="mini-title">How to tailor your resume for this job</h3>
            <ol>
              {match.recommendations.map((rec) => (
                <li key={rec}>{rec}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}

/** Prioritized suggestions, each with a copyable example line. */
export function ImprovementsList({ improvements }) {
  const sorted = [...improvements].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title section-title">
          <Lightbulb size={18} aria-hidden="true" /> Suggested improvements
        </h2>
      </div>
      <div className="card__body">
        {sorted.length === 0 ? (
          <p className="muted">No major improvements suggested.</p>
        ) : (
          <ol className="improvements">
            {sorted.map((item, index) => (
              <Improvement key={`${index}-${item.issue}`} item={item} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function Improvement({ item }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.example);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked - ignore */
    }
  }

  return (
    <li className="improvement">
      <div className="improvement__head">
        <span className={`priority priority--${item.priority.toLowerCase()}`}>
          {item.priority === 'HIGH' && <AlertTriangle size={12} aria-hidden="true" />}
          {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
        </span>
        {item.section && <span className="improvement__section">{item.section}</span>}
      </div>
      <p className="improvement__issue">{item.issue}</p>
      <p className="improvement__suggestion">{item.suggestion}</p>
      {item.example && (
        <div className="improvement__example">
          <span className="improvement__example-label">Try this</span>
          <p>{item.example}</p>
          <button type="button" onClick={copy} className="improvement__copy" aria-label="Copy example">
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </li>
  );
}

/** Strengths, detected skills and experience estimate. */
export function InsightsCard({ ai }) {
  const { experience } = ai;
  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title section-title">
          <ThumbsUp size={18} aria-hidden="true" /> What’s working
        </h2>
      </div>
      <div className="card__body insights">
        {ai.strengths.length > 0 && (
          <ul className="insights__strengths">
            {ai.strengths.map((strength) => (
              <li key={strength}>
                <CheckCircle2 size={16} aria-hidden="true" /> {strength}
              </li>
            ))}
          </ul>
        )}

        <div className="insights__experience">
          <div>
            <dt>Experience</dt>
            <dd>
              {experience.estimatedYears < 1 ? 'Under 1 year' : `${experience.estimatedYears} years`}
            </dd>
          </div>
          <div>
            <dt>Level</dt>
            <dd>{SENIORITY_LABELS[experience.seniority] || experience.seniority}</dd>
          </div>
        </div>

        {experience.highlights.length > 0 && (
          <>
            <h3 className="mini-title">Career highlights</h3>
            <ul className="insights__highlights">
              {experience.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </>
        )}

        {ai.detectedSkills.length > 0 && (
          <>
            <h3 className="mini-title">Skills detected ({ai.detectedSkills.length})</h3>
            <ul className="chips">
              {ai.detectedSkills.map((skill) => (
                <li key={skill} className="chip">
                  {skill}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

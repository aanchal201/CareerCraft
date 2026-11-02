import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import ProgressRing from '../common/ProgressRing.jsx';
import './ProfileCompletionCard.css';

function getMessage(percentage) {
  if (percentage === 100) return 'Your profile is complete — great work!';
  if (percentage >= 70) return 'Almost there. A few details will make it stand out.';
  if (percentage >= 40) return 'Good progress. Keep adding your details.';
  return 'Let’s build your profile. It powers your resumes and portfolio.';
}

/**
 * Shows the completion % (from the backend) and the checklist of items.
 *  compact: smaller ring, only the missing items (used in the profile sidebar)
 */
export default function ProfileCompletionCard({ completion, compact = false }) {
  const { percentage, items } = completion;
  const missing = items.filter((item) => !item.completed);
  const done = items.length - missing.length;
  const visibleItems = compact ? missing.slice(0, 5) : items;

  return (
    <section className={`card completion-card ${compact ? 'completion-card--compact' : ''}`}>
      <div className="card__header">
        <div>
          <h2 className="card__title">Profile strength</h2>
          <p className="card__subtitle">
            {done} of {items.length} steps done
          </p>
        </div>
      </div>

      <div className="card__body">
        <div className="completion-card__summary">
          <ProgressRing value={percentage} size={compact ? 88 : 116} stroke={compact ? 8 : 10} label="Profile completion" />
          <p className="completion-card__message">{getMessage(percentage)}</p>
        </div>

        {visibleItems.length > 0 && (
          <ul className="completion-card__list">
            {visibleItems.map((item) => (
              <li key={item.key} className={item.completed ? 'is-done' : ''}>
                {item.completed ? (
                  <span className="completion-card__item">
                    <CheckCircle2 size={18} className="completion-card__icon" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                ) : (
                  <Link to={`/profile?tab=${item.section}`} className="completion-card__item">
                    <Circle size={18} className="completion-card__icon" aria-hidden="true" />
                    <span>{item.label}</span>
                    <span className="completion-card__weight">+{item.weight}%</span>
                    <ArrowRight size={15} className="completion-card__arrow" aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

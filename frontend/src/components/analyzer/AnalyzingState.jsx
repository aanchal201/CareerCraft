import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import Spinner from '../common/Spinner.jsx';
import './AnalyzingState.css';

/**
 * Shown while the AI works (usually 15-45 s). The steps advance on a timer -
 * they describe what the backend does, so the wait feels shorter and
 * understandable, but they are not live progress events.
 */
export default function AnalyzingState({ withJob }) {
  const steps = [
    'Reading your resume',
    'Running ATS checks',
    'Reviewing content with Grok AI',
    ...(withJob ? ['Comparing with the job description'] : []),
    'Writing suggestions',
  ];
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // first two steps are quick; then roughly every 8 seconds
  const active = Math.min(steps.length - 1, elapsed < 2 ? 0 : elapsed < 4 ? 1 : 2 + Math.floor((elapsed - 4) / 8));

  return (
    <div className="analyzing" role="status" aria-live="polite">
      <span className="analyzing__icon">
        <Sparkles size={26} aria-hidden="true" />
      </span>
      <h2>Analyzing your resume…</h2>
      <p className="analyzing__hint">This usually takes 15–45 seconds. Please keep this page open.</p>

      <ol className="analyzing__steps">
        {steps.map((step, index) => (
          <li key={step} className={index < active ? 'is-done' : index === active ? 'is-active' : ''}>
            <span className="analyzing__marker">
              {index < active ? <Check size={14} strokeWidth={3} /> : index === active ? <Spinner size={14} /> : null}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="analyzing__elapsed">{elapsed}s</p>
    </div>
  );
}

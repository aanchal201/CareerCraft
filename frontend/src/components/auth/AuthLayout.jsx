import { FileText, Globe, Sparkles } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import './AuthLayout.css';

const FEATURES = [
  { icon: FileText, title: 'Polished resume templates', text: 'Clean, ATS-friendly layouts you can tailor per role.' },
  { icon: Sparkles, title: 'AI feedback on every line', text: 'Sharper bullet points, summaries and keyword matching.' },
  { icon: Globe, title: 'Publish your portfolio', text: 'A personal site at your own link — no coding needed.' },
];

/**
 * Split-screen layout shared by the Login and Register pages.
 * Left: brand panel (hidden on small screens). Right: the form.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__brand" aria-hidden="true">
        <Logo variant="light" />

        <div className="auth__brand-body">
          <p className="auth__eyebrow">Your career, crafted</p>
          <h2 className="auth__headline">Build a resume that gets you the interview.</h2>

          <ul className="auth__features">
            {FEATURES.map(({ icon: Icon, title: featureTitle, text }) => (
              <li key={featureTitle} className="auth__feature">
                <span className="auth__feature-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="auth__feature-title">{featureTitle}</p>
                  <p className="auth__feature-text">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative preview card */}
        <div className="auth__preview">
          <div className="auth__preview-head">
            <span>Resume match</span>
            <span className="auth__preview-score">86%</span>
          </div>
          <div className="auth__preview-bar">
            <span style={{ width: '86%' }} />
          </div>
          <div className="auth__preview-tags">
            <span>React</span>
            <span>Spring Boot</span>
            <span>REST APIs</span>
            <span className="auth__preview-tag--missing">+ Docker</span>
          </div>
        </div>
      </aside>

      <main className="auth__main">
        <div className="auth__mobile-logo">
          <Logo />
        </div>

        <div className="auth__card">
          <header className="auth__header">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </header>
          {children}
        </div>

        {footer && <p className="auth__footer">{footer}</p>}
      </main>
    </div>
  );
}

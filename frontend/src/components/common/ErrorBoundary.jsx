import { Component } from 'react';
import Logo from './Logo.jsx';
import '../../pages/NotFoundPage.css';

const RELOAD_KEY = 'careercraft:chunk-reload-at';
const RELOAD_COOLDOWN_MS = 30000;

/** True for "the JS file for this page no longer exists" - happens after a new deploy. */
function isChunkLoadError(error) {
  const message = String(error?.message || '');
  return (
    error?.name === 'ChunkLoadError' ||
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      message
    )
  );
}

/**
 * Last line of defence: if any page crashes while rendering, show a friendly
 * screen instead of a blank white page.
 *
 * Special case: after we deploy a new version, an open tab may ask for page
 * files that no longer exist. We reload once automatically to get the new
 * version (at most once every 30 seconds, so it can never loop).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (isChunkLoadError(error)) {
      try {
        const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
        if (Date.now() - lastReload > RELOAD_COOLDOWN_MS) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
          return;
        }
      } catch {
        // storage unavailable - fall through to the error screen
      }
    }
    // Shown in the browser console (and in any error-monitoring tool added later)
    console.error('Unexpected UI error', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="not-found" role="alert">
        <Logo />
        <p className="not-found__code">Oops</p>
        <h1>Something went wrong</h1>
        <p className="not-found__text">
          {isChunkLoadError(error)
            ? 'A new version of CareerCraft is available. Reload the page to continue.'
            : 'An unexpected error occurred. Your saved work is safe — reload the page to continue.'}
        </p>
        <button type="button" className="btn btn--primary btn--md not-found__link" onClick={() => window.location.reload()}>
          Reload page
        </button>
        <a href="/dashboard" className="not-found__text" style={{ marginTop: 'var(--space-3)' }}>
          Go to dashboard
        </a>
      </main>
    );
  }
}

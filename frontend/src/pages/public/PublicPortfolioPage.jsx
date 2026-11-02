import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PortfolioDocument from '../../components/portfolio/templates/PortfolioDocument.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Logo from '../../components/common/Logo.jsx';
import portfolioService from '../../api/portfolioService';
import '../NotFoundPage.css';
import './PublicPortfolioPage.css';

/**
 * The live portfolio website at /p/:slug - no login needed.
 * Shows the last *published* snapshot, not the draft being edited.
 */
export default function PublicPortfolioPage() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing | error

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    portfolioService
      .getPublic(slug)
      .then((data) => {
        if (cancelled) return;
        setPortfolio(data);
        setState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err.response?.status;
        setState(status === 404 || status === 400 ? 'missing' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Browser tab title + basic description for link previews.
  useEffect(() => {
    if (state !== 'ready') return undefined;
    const { hero } = portfolio.content;
    const previousTitle = document.title;
    document.title = [hero.name, hero.headline].filter(Boolean).join(' — ') || 'Portfolio';

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (created) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    const previousDescription = meta.content;
    meta.content = (hero.tagline || portfolio.content.about.text || '').slice(0, 160);

    return () => {
      document.title = previousTitle;
      if (created) meta.remove();
      else meta.content = previousDescription;
    };
  }, [state, portfolio]);

  if (state === 'loading') {
    return (
      <main className="public-portfolio public-portfolio--center">
        <Spinner size={28} label="Loading portfolio" />
      </main>
    );
  }

  if (state === 'missing' || state === 'error') {
    return (
      <main className="not-found">
        <Logo />
        <p className="not-found__code">{state === 'missing' ? '404' : 'Oops'}</p>
        <h1>{state === 'missing' ? 'This portfolio isn’t available' : 'We couldn’t load this portfolio'}</h1>
        <p className="not-found__text">
          {state === 'missing'
            ? 'The link may be wrong, or the owner has unpublished it.'
            : 'Please check your connection and refresh the page.'}
        </p>
        <Link to="/" className="not-found__link">
          Go to CareerCraft
        </Link>
      </main>
    );
  }

  return (
    <main className="public-portfolio">
      <PortfolioDocument
        templateId={portfolio.templateId}
        design={portfolio.design}
        content={portfolio.content}
        avatarPath={portfolio.avatarPath}
        interactive
      />
      <a className="public-portfolio__badge" href="/register">
        Made with CareerCraft
      </a>
    </main>
  );
}

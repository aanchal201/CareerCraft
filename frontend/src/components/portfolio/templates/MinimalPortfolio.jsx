import { Avatar, Footer, HeroActions, NavLinks, PortfolioSection, visiblePortfolioSections } from './PortfolioSections.jsx';

/** Minimal: top nav, airy single column, understated section headings. */
export default function MinimalPortfolio({ content, design, avatarPath }) {
  const sections = visiblePortfolioSections(content);
  const { hero } = content;

  return (
    <>
      <header className="pf-nav">
        <div className="pf-container pf-nav__inner">
          <a href="#pf-top" className="pf-nav__brand">
            {hero.name || 'Your Name'}
          </a>
          <NavLinks sections={sections} />
        </div>
      </header>

      <section id="pf-top" className={`pf-hero pf-hero--${design.heroAlign === 'CENTER' ? 'center' : 'left'}`}>
        <div className="pf-container">
          {hero.showAvatar && <Avatar name={hero.name} avatarPath={avatarPath} className="pf-hero__avatar" />}
          {hero.availability && <p className="pf-availability">{hero.availability}</p>}
          <h1 className="pf-hero__name">{hero.name || 'Your Name'}</h1>
          {hero.headline && <p className="pf-hero__headline">{hero.headline}</p>}
          {hero.tagline && <p className="pf-hero__tagline">{hero.tagline}</p>}
          <HeroActions content={content} sections={sections} />
        </div>
      </section>

      <main>
        {sections.map((section) => (
          <PortfolioSection key={section.key} section={section} content={content} design={design} />
        ))}
      </main>

      <Footer name={hero.name} />
    </>
  );
}

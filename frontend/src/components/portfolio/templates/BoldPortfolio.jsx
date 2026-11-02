import { Avatar, Footer, HeroActions, NavLinks, PortfolioSection, visiblePortfolioSections } from './PortfolioSections.jsx';

/** Bold: full-width colored hero, alternating section backgrounds, big headings. */
export default function BoldPortfolio({ content, design, avatarPath }) {
  const sections = visiblePortfolioSections(content);
  const { hero } = content;

  return (
    <>
      <section id="pf-top" className={`pf-hero pf-hero--${design.heroAlign === 'CENTER' ? 'center' : 'left'}`}>
        <header className="pf-nav">
          <div className="pf-container pf-nav__inner">
            <a href="#pf-top" className="pf-nav__brand">
              {hero.name || 'Your Name'}
            </a>
            <NavLinks sections={sections} />
          </div>
        </header>

        <div className="pf-container pf-hero__content">
          <div className="pf-hero__text">
            {hero.availability && <p className="pf-availability">{hero.availability}</p>}
            <h1 className="pf-hero__name">{hero.name || 'Your Name'}</h1>
            {hero.headline && <p className="pf-hero__headline">{hero.headline}</p>}
            {hero.tagline && <p className="pf-hero__tagline">{hero.tagline}</p>}
            <HeroActions content={content} sections={sections} inverted />
          </div>
          {hero.showAvatar && <Avatar name={hero.name} avatarPath={avatarPath} className="pf-hero__avatar" />}
        </div>
      </section>

      <main>
        {sections.map((section, index) => (
          <PortfolioSection
            key={section.key}
            section={section}
            content={content}
            design={design}
            className={index % 2 === 1 ? 'pf-section--alt' : ''}
          />
        ))}
      </main>

      <Footer name={hero.name} />
    </>
  );
}

import {
  Avatar,
  contactLinks,
  Footer,
  HeroActions,
  NavLinks,
  PortfolioSection,
  visiblePortfolioSections,
} from './PortfolioSections.jsx';

/**
 * Sidebar: a sticky profile column (photo, name, nav, contact icons) next to
 * the content. On narrow screens the sidebar becomes a header.
 */
export default function SidebarPortfolio({ content, design, avatarPath }) {
  const sections = visiblePortfolioSections(content);
  const { hero } = content;
  const links = contactLinks(content.contact);

  return (
    <div className="pf-layout">
      <aside className="pf-sidebar" id="pf-top">
        <div className={`pf-sidebar__inner pf-sidebar__inner--${design.heroAlign === 'CENTER' ? 'center' : 'left'}`}>
          {hero.showAvatar && <Avatar name={hero.name} avatarPath={avatarPath} className="pf-hero__avatar" />}
          <h1 className="pf-hero__name">{hero.name || 'Your Name'}</h1>
          {hero.headline && <p className="pf-hero__headline">{hero.headline}</p>}
          {hero.availability && <p className="pf-availability">{hero.availability}</p>}

          <nav className="pf-sidebar__nav" aria-label="Sections">
            <NavLinks sections={sections} />
          </nav>

          {links.length > 0 && (
            <ul className="pf-sidebar__social">
              {links.map(({ key, icon: Icon, label, href }) => (
                <li key={key}>
                  <a href={href} aria-label={label} title={label} target={key === 'email' || key === 'phone' ? undefined : '_blank'} rel="noopener noreferrer">
                    <Icon size={18} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <div className="pf-main">
        {hero.tagline && (
          <section className="pf-hero">
            <div className="pf-container">
              <p className="pf-hero__tagline">{hero.tagline}</p>
              <HeroActions content={content} sections={sections} />
            </div>
          </section>
        )}
        <main>
          {sections.map((section) => (
            <PortfolioSection key={section.key} section={section} content={content} design={design} />
          ))}
        </main>
        <Footer name={hero.name} />
      </div>
    </div>
  );
}

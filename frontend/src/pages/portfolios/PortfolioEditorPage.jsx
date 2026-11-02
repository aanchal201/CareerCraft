import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, CloudUpload, Eye, Globe, Paintbrush, PencilLine, Sparkles } from 'lucide-react';
import LoadingBlock from '../../components/common/LoadingBlock.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Button from '../../components/common/Button.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import FormInput from '../../components/common/FormInput.jsx';
import SectionCard from '../../components/resume/editor/SectionCard.jsx';
import ListEditor from '../../components/resume/editor/ListEditor.jsx';
import FieldGroup from '../../components/portfolio/editor/FieldGroup.jsx';
import DesignPanel from '../../components/portfolio/editor/DesignPanel.jsx';
import PortfolioPreview from '../../components/portfolio/PortfolioPreview.jsx';
import PublishModal from '../../components/portfolio/PublishModal.jsx';
import AiWriteModal from '../../components/portfolio/AiWriteModal.jsx';
import PublishStatePill from '../../components/portfolio/PublishStatePill.jsx';
import {
  ABOUT_FIELDS,
  CONTACT_FIELDS,
  HERO_FIELDS,
  PORTFOLIO_LISTS,
  SECTION_ICONS,
} from '../../components/portfolio/editor/portfolioSectionConfig.js';
import portfolioService from '../../api/portfolioService';
import { getErrorMessage } from '../../api/axios';
import useAutosaveDocument from '../../hooks/useAutosaveDocument';
import useToast from '../../hooks/useToast';
import '../../components/portfolio/portfolioDialogs.css';
import '../resumes/ResumeEditorPage.css'; // shared editor styles (toolbar, section cards, list editor)
import './PortfolioEditorPage.css';

const STATUS_LABELS = { saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved changes', error: 'Not saved' };


/** Loads the portfolio, then hands it to the editor. */
export default function PortfolioEditorPage() {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setNotFound(false);
    setPortfolio(null);
    try {
      setPortfolio(await portfolioService.get(id));
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) setNotFound(true);
      else setError(getErrorMessage(err, 'Could not load this portfolio.'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="danger"
        title="Portfolio not found"
        text="It may have been deleted, or the link is wrong."
        action={
          <Link to="/portfolios" className="btn btn--primary btn--md">
            Back to portfolios
          </Link>
        }
      />
    );
  }
  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="danger"
        title="We couldn't load this portfolio"
        text={error}
        action={<Button onClick={load}>Try again</Button>}
      />
    );
  }
  if (!portfolio) return <LoadingBlock label="Opening your portfolio…" />;

  return <PortfolioEditor key={portfolio.id} portfolio={portfolio} />;
}

function PortfolioEditor({ portfolio }) {
  const navigate = useNavigate();
  const toast = useToast();
  const portfolioId = portfolio.id;

  const [initialDoc] = useState(() => ({
    name: portfolio.name,
    templateId: portfolio.templateId,
    design: portfolio.design,
    content: portfolio.content,
  }));
  const saveFn = useCallback((doc) => portfolioService.update(portfolioId, doc), [portfolioId]);
  // every save response says whether the draft now differs from the live site
  const [publishing, setPublishing] = useState(portfolio.publishing);
  const handleSaved = useCallback((saved) => {
    if (saved?.publishing) setPublishing(saved.publishing);
  }, []);
  const { doc, status, saveError, save, updateField, updateIn, updateContent } = useAutosaveDocument(
    initialDoc,
    saveFn,
    portfolio.updatedAt,
    'Could not save your portfolio.',
    handleSaved
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const [tab, setTab] = useState('content'); // content | design
  const [openSection, setOpenSection] = useState('hero');
  const [device, setDevice] = useState('desktop');
  const [mobileView, setMobileView] = useState('edit');

  const { content } = doc;
  const toggle = (key) => setOpenSection((current) => (current === key ? null : key));

  async function handleBack() {
    if (status !== 'saved' && !(await save())) {
      toast.error('Your latest changes could not be saved. Fix the issue or try again.');
      return;
    }
    navigate('/portfolios');
  }

  async function handleSave() {
    if (await save()) toast.success('Portfolio saved');
  }

  function updateSection(index, changes) {
    updateContent((c) => ({ ...c, sections: c.sections.map((s, i) => (i === index ? { ...s, ...changes } : s)) }));
  }

  function moveSection(index, direction) {
    updateContent((c) => {
      const target = index + direction;
      if (target < 0 || target >= c.sections.length) return c;
      const sections = [...c.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...c, sections };
    });
  }

  function sectionSubtitle(section) {
    if (!section.visible) return 'Hidden from portfolio';
    if (section.key === 'about') return content.about.text ? 'Filled in' : 'Empty';
    if (section.key === 'contact') return content.contact.email || 'Empty';
    const count = (content[section.key] || []).length;
    return count === 0 ? 'Empty' : `${count} ${count === 1 ? 'item' : 'items'}`;
  }

  function renderSectionBody(section) {
    switch (section.key) {
      case 'about':
        return (
          <FieldGroup
            fields={ABOUT_FIELDS}
            value={content.about}
            idPrefix="about"
            onChange={(about) => updateContent((c) => ({ ...c, about }))}
          />
        );
      case 'contact':
        return (
          <FieldGroup
            fields={CONTACT_FIELDS}
            value={content.contact}
            idPrefix="contact"
            onChange={(contact) => updateContent((c) => ({ ...c, contact }))}
          />
        );
      default: {
        const list = PORTFOLIO_LISTS[section.key];
        return (
          <ListEditor
            sectionKey={section.key}
            config={list.config}
            createItem={list.createItem}
            items={content[section.key]}
            onChange={(items) => updateContent((c) => ({ ...c, [section.key]: items }))}
          />
        );
      }
    }
  }

  return (
    <div className={`portfolio-editor portfolio-editor--${mobileView}`}>
      {/* ---------- Toolbar ---------- */}
      <div className="editor-toolbar">
        <div className="editor-toolbar__left">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={handleBack}>
            Portfolios
          </Button>
          <input
            className="editor-toolbar__title"
            value={doc.name}
            onChange={(event) => updateField('name', event.target.value)}
            maxLength={120}
            aria-label="Portfolio name"
            placeholder="Untitled portfolio"
          />
        </div>
        <div className="editor-toolbar__right">
          <span className={`editor-toolbar__status is-${status}`} title={status === 'error' ? saveError : undefined}>
            {status === 'saving' && <Spinner size={14} />}
            {status === 'saved' && <Check size={14} />}
            {status === 'error' && <AlertCircle size={14} />}
            {STATUS_LABELS[status]}
          </span>
          <Button
            size="sm"
            variant="secondary"
            icon={CloudUpload}
            onClick={handleSave}
            disabled={status === 'saved' || status === 'saving'}
          >
            Save
          </Button>
          <PublishStatePill publishing={publishing} dirty={publishing?.published && status !== 'saved'} />
          <Button size="sm" icon={Globe} onClick={() => setPublishOpen(true)}>
            {publishing?.published ? 'Share' : 'Publish'}
          </Button>
        </div>
        {status === 'error' && saveError && (
          <p className="editor-toolbar__error" role="alert">
            {saveError}
          </p>
        )}
      </div>

      <div className="resume-editor__switch portfolio-editor__switch" role="tablist" aria-label="Editor view">
        <button type="button" role="tab" aria-selected={mobileView === 'edit'} className={mobileView === 'edit' ? 'is-active' : ''} onClick={() => setMobileView('edit')}>
          <PencilLine size={16} /> Edit
        </button>
        <button type="button" role="tab" aria-selected={mobileView === 'preview'} className={mobileView === 'preview' ? 'is-active' : ''} onClick={() => setMobileView('preview')}>
          <Eye size={16} /> Preview
        </button>
      </div>

      <div className="portfolio-editor__body">
        {/* ---------- Left: content / design ---------- */}
        <div className="portfolio-editor__panel">
          <div className="portfolio-editor__tabs" role="tablist" aria-label="Editor panel">
            <button type="button" role="tab" aria-selected={tab === 'content'} className={tab === 'content' ? 'is-active' : ''} onClick={() => setTab('content')}>
              <PencilLine size={16} /> Content
            </button>
            <button type="button" role="tab" aria-selected={tab === 'design'} className={tab === 'design' ? 'is-active' : ''} onClick={() => setTab('design')}>
              <Paintbrush size={16} /> Design
            </button>
          </div>

          {tab === 'design' ? (
            <DesignPanel
              templateId={doc.templateId}
              design={doc.design}
              onTemplateChange={(templateId) => updateField('templateId', templateId)}
              onDesignChange={(design) => updateIn('design', () => design)}
            />
          ) : (
            <div className="portfolio-editor__sections">
              <div className="portfolio-editor__ai">
                <div>
                  <strong>Need help with wording?</strong>
                  <span>AI suggests a headline, about text and project descriptions from your details.</span>
                </div>
                <Button size="sm" variant="secondary" icon={Sparkles} onClick={() => setAiOpen(true)}>
                  Write with AI
                </Button>
              </div>

              <SectionCard
                icon={SECTION_ICONS.hero}
                title="Hero"
                subtitle={content.hero.name || 'Your name and headline'}
                open={openSection === 'hero'}
                onToggle={() => toggle('hero')}
              >
                <FieldGroup
                  fields={HERO_FIELDS}
                  value={content.hero}
                  idPrefix="hero"
                  onChange={(hero) => updateContent((c) => ({ ...c, hero }))}
                />
                {content.hero.showAvatar && !portfolio.avatarPath && (
                  <p className="portfolio-editor__note">
                    You don’t have a profile photo yet — <Link to="/profile">add one in your profile</Link> or initials are shown.
                  </p>
                )}
              </SectionCard>

              {content.sections.map((section, index) => (
                <SectionCard
                  key={section.key}
                  icon={SECTION_ICONS[section.key]}
                  title={section.title}
                  subtitle={sectionSubtitle(section)}
                  open={openSection === section.key}
                  onToggle={() => toggle(section.key)}
                  visible={section.visible}
                  onToggleVisible={() => updateSection(index, { visible: !section.visible })}
                  onMoveUp={() => moveSection(index, -1)}
                  onMoveDown={() => moveSection(index, 1)}
                  canMoveUp={index > 0}
                  canMoveDown={index < content.sections.length - 1}
                >
                  <div className="editor-section__heading-field">
                    <FormInput
                      label="Section heading"
                      value={section.title}
                      maxLength={60}
                      onChange={(event) => updateSection(index, { title: event.target.value })}
                    />
                  </div>
                  {renderSectionBody(section)}
                </SectionCard>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Right: live preview ---------- */}
        <div className="portfolio-editor__preview">
          <PortfolioPreview
            templateId={doc.templateId}
            design={doc.design}
            content={content}
            avatarPath={portfolio.avatarPath}
            device={device}
            onDeviceChange={setDevice}
          />
        </div>
      </div>

      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        portfolioId={portfolioId}
        publishing={publishing}
        beforePublish={save}
        onPublishingChange={setPublishing}
      />

      <AiWriteModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        portfolioId={portfolioId}
        content={content}
        beforeRequest={save}
        onApply={(nextContent) => {
          updateContent(() => nextContent);
          setAiOpen(false);
          toast.success('Suggestions applied to your draft');
        }}
      />
    </div>
  );
}

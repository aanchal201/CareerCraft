import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Eye, PencilLine, UserRound } from 'lucide-react';
import LoadingBlock from '../../components/common/LoadingBlock.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Button from '../../components/common/Button.jsx';
import FormInput from '../../components/common/FormInput.jsx';
import ResumePreview from '../../components/resume/ResumePreview.jsx';
import EditorToolbar from '../../components/resume/editor/EditorToolbar.jsx';
import SectionCard from '../../components/resume/editor/SectionCard.jsx';
import PersonalEditor from '../../components/resume/editor/PersonalEditor.jsx';
import ListEditor from '../../components/resume/editor/ListEditor.jsx';
import { SECTION_CONFIG } from '../../components/resume/editor/sectionConfig.js';
import resumeService from '../../api/resumeService';
import { getErrorMessage } from '../../api/axios';
import PrintableResume from '../../components/resume/PrintableResume.jsx';
import useResumeEditor from '../../hooks/useResumeEditor';
import usePdfDownload from '../../hooks/usePdfDownload.jsx';
import { buildPdfFileName } from '../../utils/pdf';
import useToast from '../../hooks/useToast';
import './ResumeEditorPage.css';

/** Loads the resume, then hands it to the editor. */
export default function ResumeEditorPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setNotFound(false);
    setResume(null);
    try {
      setResume(await resumeService.get(id));
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) setNotFound(true);
      else setError(getErrorMessage(err, 'Could not load this resume.'));
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
        title="Resume not found"
        text="It may have been deleted, or the link is wrong."
        action={<Button onClick={() => window.history.back()}>Go back</Button>}
      />
    );
  }
  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="danger"
        title="We couldn't load this resume"
        text={error}
        action={<Button onClick={load}>Try again</Button>}
      />
    );
  }
  if (!resume) return <LoadingBlock label="Opening your resume…" />;

  // key: a different resume id gets a completely fresh editor state
  return <ResumeEditor key={resume.id} resume={resume} />;
}

function ResumeEditor({ resume }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { doc, status, saveError, save, updateField, updateContent } = useResumeEditor(resume);
  const { downloadPdf, tipsModal } = usePdfDownload();
  const [openSection, setOpenSection] = useState('personal');
  const [mobileView, setMobileView] = useState('edit');

  const { content } = doc;

  /** Save pending changes, then leave the editor. */
  async function saveAndNavigate(path) {
    if (status !== 'saved') {
      const ok = await save();
      if (!ok) {
        toast.error('Your latest changes could not be saved. Fix the issue or try again.');
        return;
      }
    }
    navigate(path);
  }

  /** Prints what's on screen right now (the PDF never waits for the server). */
  function handleDownload() {
    if (status !== 'saved') save(); // also persist in the background
    downloadPdf(buildPdfFileName({ fullName: content.personal.fullName, title: doc.title }));
  }

  async function handleManualSave() {
    if (await save()) toast.success('Resume saved');
  }

  const toggle = (key) => setOpenSection((current) => (current === key ? null : key));

  // ---- section-level operations (order, visibility, title) ----
  function updateSection(index, changes) {
    updateContent((c) => ({
      ...c,
      sections: c.sections.map((section, i) => (i === index ? { ...section, ...changes } : section)),
    }));
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
    if (!section.visible) return 'Hidden from resume';
    if (section.key === 'summary') return content.summary ? `${content.summary.length} characters` : 'Empty';
    const count = (content[section.key] || []).length;
    return count === 0 ? 'Empty' : `${count} ${count === 1 ? 'entry' : 'entries'}`;
  }

  return (
    <div className={`resume-editor resume-editor--${mobileView}`}>
      <EditorToolbar
        doc={doc}
        status={status}
        saveError={saveError}
        onBack={() => saveAndNavigate('/resumes')}
        onSave={handleManualSave}
        onDownload={handleDownload}
        onPreview={() => saveAndNavigate(`/resumes/${resume.id}/preview`)}
        onFieldChange={updateField}
      />

      <div className="resume-editor__switch" role="tablist" aria-label="Editor view">
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === 'edit'}
          className={mobileView === 'edit' ? 'is-active' : ''}
          onClick={() => setMobileView('edit')}
        >
          <PencilLine size={16} /> Edit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === 'preview'}
          className={mobileView === 'preview' ? 'is-active' : ''}
          onClick={() => setMobileView('preview')}
        >
          <Eye size={16} /> Preview
        </button>
      </div>

      <div className="resume-editor__body">
        <div className="resume-editor__form">
          <SectionCard
            icon={UserRound}
            title="Personal information"
            subtitle={content.personal.fullName || 'Name and contact details'}
            open={openSection === 'personal'}
            onToggle={() => toggle('personal')}
          >
            <PersonalEditor
              personal={content.personal}
              onChange={(personal) => updateContent((c) => ({ ...c, personal }))}
            />
          </SectionCard>

          {content.sections.map((section, index) => {
            const config = SECTION_CONFIG[section.key];
            return (
              <SectionCard
                key={section.key}
                icon={config.icon}
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
                    hint={section.visible ? undefined : 'This section is hidden. Click the eye icon to show it.'}
                  />
                </div>

                {section.key === 'summary' ? (
                  <FormInput
                    as="textarea"
                    rows={5}
                    label="Summary"
                    placeholder="e.g. Final-year computer engineering student with hands-on experience building full-stack apps in React and Spring Boot…"
                    hint={config.help}
                    value={content.summary ?? ''}
                    maxLength={3000}
                    showCount
                    onChange={(event) => updateContent((c) => ({ ...c, summary: event.target.value }))}
                  />
                ) : (
                  <ListEditor
                    sectionKey={section.key}
                    items={content[section.key]}
                    onChange={(items) => updateContent((c) => ({ ...c, [section.key]: items }))}
                  />
                )}
              </SectionCard>
            );
          })}
        </div>

        <div className="resume-editor__preview">
          <div className="resume-editor__preview-inner">
            <ResumePreview templateId={doc.templateId} accentColor={doc.accentColor} content={content} />
          </div>
        </div>
      </div>

      {/* invisible full-size copy used for "Download PDF" and Ctrl/Cmd+P */}
      <PrintableResume templateId={doc.templateId} accentColor={doc.accentColor} content={content} />
      {tipsModal}
    </div>
  );
}

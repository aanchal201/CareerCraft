import { useCallback, useState } from 'react';
import resumeService from '../api/resumeService';
import useAutosaveDocument from './useAutosaveDocument';

/** The editable part of a resume (what PUT /api/resumes/{id} accepts). */
function pickEditable(resume) {
  return {
    title: resume.title,
    templateId: resume.templateId,
    accentColor: resume.accentColor,
    content: resume.content,
  };
}

/**
 * Holds the resume being edited and autosaves it.
 * The autosave logic itself lives in useAutosaveDocument (shared with the
 * portfolio editor); this hook just plugs in the resume's fields and API.
 */
export default function useResumeEditor(resume) {
  const resumeId = resume.id;
  const [initialDoc] = useState(() => pickEditable(resume));
  const saveFn = useCallback((doc) => resumeService.update(resumeId, doc), [resumeId]);

  return useAutosaveDocument(initialDoc, saveFn, resume.updatedAt, 'Could not save your resume.');
}

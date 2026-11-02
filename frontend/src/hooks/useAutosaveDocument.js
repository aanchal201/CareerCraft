import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage, getFieldErrors } from '../api/axios';

const AUTOSAVE_DELAY_MS = 1200;

/** Prefer the first specific field error, so the message says what to fix. */
function describeSaveError(error, fallback) {
  const fieldMessages = Object.values(getFieldErrors(error));
  return fieldMessages[0] || getErrorMessage(error, fallback);
}

/**
 * Generic "edit a document and autosave it" hook, shared by the resume and
 * portfolio editors.
 *
 * How autosave works:
 *  1. Every edit updates `doc` (React state) - previews re-render instantly.
 *  2. An effect waits until you stop typing for ~1.2s, then calls save().
 *  3. save() sends the whole document via `saveFn(doc)`. Only one save runs
 *     at a time; if you edited during a save, another save follows it.
 *  4. `status` drives the "Saving… / Saved / Unsaved / Not saved" badge.
 *
 * @param initialDoc   the editable fields, as loaded from the server
 * @param saveFn       (doc) => Promise<savedEntity>  (should return { updatedAt })
 * @param initialSavedAt timestamp of the loaded version
 * @param errorFallback message used when the server gives no details
 * @param onSaved      optional (savedEntity) => void, called after every successful save
 */
export default function useAutosaveDocument(
  initialDoc,
  saveFn,
  initialSavedAt,
  errorFallback = 'Could not save your changes.',
  onSaved = undefined
) {
  const [doc, setDoc] = useState(initialDoc);
  const [status, setStatus] = useState('saved'); // 'saved' | 'unsaved' | 'saving' | 'error'
  const [saveError, setSaveError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(initialSavedAt);
  const [retryTick, setRetryTick] = useState(0);

  const docRef = useRef(doc);
  const savedJsonRef = useRef(JSON.stringify(initialDoc));
  const inFlightRef = useRef(null); // the save request currently running, if any
  const saveFnRef = useRef(saveFn);
  const fallbackRef = useRef(errorFallback);
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  useEffect(() => {
    saveFnRef.current = saveFn;
    fallbackRef.current = errorFallback;
    onSavedRef.current = onSaved;
  }, [saveFn, errorFallback, onSaved]);

  /** Saves the latest document. Resolves true when everything is saved. */
  const save = useCallback(async () => {
    // Never run two saves at once: wait for the running one to finish first.
    while (inFlightRef.current) {
      await inFlightRef.current;
    }

    const snapshot = docRef.current;
    const json = JSON.stringify(snapshot);
    if (json === savedJsonRef.current) {
      setStatus('saved');
      return true;
    }

    setStatus('saving');
    const request = saveFnRef.current(snapshot);
    inFlightRef.current = request.catch(() => {}); // others only wait; errors are handled below
    try {
      const saved = await request;
      savedJsonRef.current = json;
      setSaveError('');
      if (saved?.updatedAt) setLastSavedAt(saved.updatedAt);
      onSavedRef.current?.(saved);

      const changedWhileSaving = JSON.stringify(docRef.current) !== json;
      setStatus(changedWhileSaving ? 'unsaved' : 'saved');
      if (changedWhileSaving) setRetryTick((tick) => tick + 1); // save the newer edits too
      return true;
    } catch (error) {
      setStatus('error');
      setSaveError(describeSaveError(error, fallbackRef.current));
      return false;
    } finally {
      inFlightRef.current = null;
    }
  }, []);

  // Debounced autosave whenever the document changes.
  useEffect(() => {
    if (JSON.stringify(doc) === savedJsonRef.current) return undefined;
    setStatus((current) => (current === 'error' ? current : 'unsaved'));
    const timer = window.setTimeout(save, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [doc, save, retryTick]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (status === 'saved') return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  // ---- update helpers used by editor components ----

  /** Replace one top-level field, e.g. updateField('title', 'New name'). */
  const updateField = useCallback((name, value) => {
    setDoc((current) => ({ ...current, [name]: value }));
  }, []);

  /** Update a nested object with a function, e.g. updateIn('content', c => ({...c, summary})). */
  const updateIn = useCallback((key, updater) => {
    setDoc((current) => ({ ...current, [key]: updater(current[key]) }));
  }, []);

  const updateContent = useCallback((updater) => updateIn('content', updater), [updateIn]);

  return { doc, status, saveError, lastSavedAt, save, updateField, updateIn, updateContent };
}

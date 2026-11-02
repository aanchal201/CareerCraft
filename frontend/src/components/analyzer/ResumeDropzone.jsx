import { useRef, useState } from 'react';
import { FileText, CloudUpload, X } from 'lucide-react';
import './ResumeDropzone.css';

const MAX_BYTES = 5 * 1024 * 1024;

/** Drag-and-drop (or click) area for a single resume PDF. */
export default function ResumeDropzone({ file, onFileChange, error, onError }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function accept(candidate) {
    if (!candidate) return;
    const isPdf = candidate.type === 'application/pdf' || candidate.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      onError('Please choose a PDF file.');
      return;
    }
    if (candidate.size > MAX_BYTES) {
      onError('The PDF must be 5 MB or smaller.');
      return;
    }
    onError('');
    onFileChange(candidate);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  }

  if (file) {
    return (
      <div className="dropzone-file">
        <span className="dropzone-file__icon">
          <FileText size={20} aria-hidden="true" />
        </span>
        <span className="dropzone-file__text">
          <strong>{file.name}</strong>
          <small>{(file.size / 1024).toFixed(0)} KB · PDF</small>
        </span>
        <button type="button" className="dropzone-file__remove" onClick={() => onFileChange(null)} aria-label="Remove file">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`dropzone ${dragging ? 'is-dragging' : ''} ${error ? 'has-error' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <CloudUpload size={28} aria-hidden="true" />
        <span className="dropzone__title">
          <strong>Click to upload</strong> or drag and drop
        </span>
        <span className="dropzone__hint">PDF only, up to 5 MB. Scanned images can’t be read.</span>
      </button>
      {error && (
        <p className="dropzone__error" role="alert">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          accept(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </>
  );
}

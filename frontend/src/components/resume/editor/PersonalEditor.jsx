import FieldRenderer from './FieldRenderer.jsx';
import '../../profile/ProfileForms.css';

const PERSONAL_FIELDS = [
  { name: 'fullName', label: 'Full name', placeholder: 'Asha Verma', maxLength: 100 },
  { name: 'jobTitle', label: 'Job title / headline', placeholder: 'Frontend Developer', maxLength: 120 },
  { name: 'email', label: 'Email', placeholder: 'you@example.com', maxLength: 150 },
  { name: 'phone', label: 'Phone', placeholder: '+91 98765 43210', maxLength: 30 },
  { name: 'location', label: 'Location', placeholder: 'Mumbai, India', maxLength: 100, full: true },
  { name: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/in/you' },
  { name: 'github', label: 'GitHub', type: 'url', placeholder: 'https://github.com/you' },
  { name: 'website', label: 'Website / portfolio', type: 'url', placeholder: 'https://you.dev', full: true },
];

/** Header details printed at the top of the resume. */
export default function PersonalEditor({ personal, onChange }) {
  return (
    <div className="form-grid">
      {PERSONAL_FIELDS.map((field) => (
        <FieldRenderer
          key={field.name}
          field={field}
          item={personal}
          idPrefix="personal"
          onChange={(name, value) => onChange({ ...personal, [name]: value })}
        />
      ))}
    </div>
  );
}

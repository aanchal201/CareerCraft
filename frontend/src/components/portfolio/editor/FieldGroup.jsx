import FieldRenderer from '../../resume/editor/FieldRenderer.jsx';
import '../../profile/ProfileForms.css';

/**
 * Renders a list of field definitions for ONE object (e.g. the hero) and
 * reports the whole updated object: onChange({ ...value, [name]: newValue }).
 */
export default function FieldGroup({ fields, value, onChange, idPrefix }) {
  return (
    <div className="form-grid">
      {fields.map((field) => (
        <FieldRenderer
          key={field.name}
          field={field}
          item={value}
          idPrefix={idPrefix}
          onChange={(name, newValue) => onChange({ ...value, [name]: newValue })}
        />
      ))}
    </div>
  );
}

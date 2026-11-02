import FormInput from '../../common/FormInput.jsx';
import Checkbox from '../../common/Checkbox.jsx';

const URL_REGEX = /^https?:\/\/\S+$/;

/**
 * Renders one field from a section config (see sectionConfig.js) and reports
 * changes as onChange(name, value).
 */
export default function FieldRenderer({ field, item, onChange, idPrefix }) {
  const value = item[field.name];
  const id = `${idPrefix}-${field.name}`;
  const className = field.full ? 'form-grid__full' : '';

  if (field.type === 'checkbox') {
    return (
      <div className={className}>
        <Checkbox
          id={id}
          label={field.label}
          checked={Boolean(value)}
          onChange={(event) => onChange(field.name, event.target.checked)}
        />
      </div>
    );
  }

  const disabled = field.disabledBy ? Boolean(item[field.disabledBy]) : false;
  const urlError = field.type === 'url' && value && !URL_REGEX.test(value.trim())
    ? 'Link must start with http:// or https://'
    : '';

  return (
    <FormInput
      id={id}
      className={className}
      label={field.label}
      as={field.type === 'textarea' ? 'textarea' : field.type === 'select' ? 'select' : 'input'}
      type={field.type === 'month' ? 'month' : field.type === 'url' ? 'url' : 'text'}
      rows={field.rows}
      options={field.options}
      placeholder={field.type === 'month' ? 'YYYY-MM' : field.placeholder}
      hint={disabled ? 'Shown as “Present”' : field.hint}
      maxLength={field.maxLength}
      showCount={field.type === 'textarea' && Boolean(field.maxLength)}
      value={disabled ? '' : value ?? ''}
      disabled={disabled}
      error={urlError}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
}

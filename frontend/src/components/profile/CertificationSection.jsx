import { BadgeCheck, Calendar, Hash } from 'lucide-react';
import SectionManager from './SectionManager.jsx';
import FormInput from '../common/FormInput.jsx';
import profileService from '../../api/profileService';
import useProfile from '../../hooks/useProfile';
import { formatMonth, fromMonthInput, toMonthInput } from '../../utils/date';
import { validateCertification } from '../../utils/validators';

function toForm(item) {
  return {
    name: item?.name ?? '',
    issuer: item?.issuer ?? '',
    issueDate: toMonthInput(item?.issueDate),
    expiryDate: toMonthInput(item?.expiryDate),
    credentialId: item?.credentialId ?? '',
    credentialUrl: item?.credentialUrl ?? '',
  };
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    issuer: form.issuer.trim(),
    issueDate: fromMonthInput(form.issueDate),
    expiryDate: fromMonthInput(form.expiryDate),
    credentialId: form.credentialId.trim(),
    credentialUrl: form.credentialUrl.trim(),
  };
}

function describe(item) {
  const dates = item.expiryDate
    ? `Issued ${formatMonth(item.issueDate)} · Expires ${formatMonth(item.expiryDate)}`
    : `Issued ${formatMonth(item.issueDate)}`;
  const meta = [{ icon: Calendar, text: dates }];
  if (item.credentialId) meta.push({ icon: Hash, text: item.credentialId });
  return {
    title: item.name,
    subtitle: item.issuer,
    meta,
    link: item.credentialUrl ? { href: item.credentialUrl, label: 'View credential' } : null,
  };
}

function renderFields({ form, errors, onChange }) {
  return (
    <div className="form-grid">
      <FormInput
        className="form-grid__full"
        label="Certification name"
        name="name"
        placeholder="e.g. AWS Certified Cloud Practitioner"
        value={form.name}
        onChange={onChange}
        error={errors.name}
      />
      <FormInput
        className="form-grid__full"
        label="Issuing organization"
        name="issuer"
        placeholder="e.g. Amazon Web Services"
        value={form.issuer}
        onChange={onChange}
        error={errors.issuer}
      />
      <FormInput
        label="Issue date"
        name="issueDate"
        type="month"
        placeholder="YYYY-MM"
        value={form.issueDate}
        onChange={onChange}
        error={errors.issueDate}
      />
      <FormInput
        label="Expiry date"
        name="expiryDate"
        type="month"
        placeholder="YYYY-MM"
        value={form.expiryDate}
        onChange={onChange}
        error={errors.expiryDate}
        hint="Leave empty if it doesn't expire."
        optional
      />
      <FormInput
        label="Credential ID"
        name="credentialId"
        value={form.credentialId}
        onChange={onChange}
        error={errors.credentialId}
        optional
      />
      <FormInput
        label="Credential URL"
        name="credentialUrl"
        type="url"
        placeholder="https://…"
        value={form.credentialUrl}
        onChange={onChange}
        error={errors.credentialUrl}
        optional
      />
    </div>
  );
}

export default function CertificationSection({ items }) {
  const { save } = useProfile();

  return (
    <SectionManager
      title="Certifications"
      description="Courses and credentials that back up your skills."
      items={items}
      itemName="certification"
      icon={BadgeCheck}
      emptyTitle="No certifications added yet"
      emptyText="Online courses and professional certificates help your profile stand out."
      toForm={toForm}
      toPayload={toPayload}
      validate={validateCertification}
      describe={describe}
      renderFields={renderFields}
      onCreate={(payload) => save(() => profileService.addCertification(payload))}
      onUpdate={(id, payload) => save(() => profileService.updateCertification(id, payload))}
      onDelete={(id) => save(() => profileService.deleteCertification(id))}
    />
  );
}

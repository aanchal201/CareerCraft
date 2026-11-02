import { Briefcase, Calendar, MapPin } from 'lucide-react';
import SectionManager from './SectionManager.jsx';
import FormInput from '../common/FormInput.jsx';
import Checkbox from '../common/Checkbox.jsx';
import profileService from '../../api/profileService';
import useProfile from '../../hooks/useProfile';
import { formatRange, fromMonthInput, toMonthInput } from '../../utils/date';
import { validateExperience } from '../../utils/validators';

const EMPLOYMENT_TYPES = [
  { value: '', label: 'Select type' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Freelance', label: 'Freelance' },
];

function toForm(item) {
  return {
    jobTitle: item?.jobTitle ?? '',
    company: item?.company ?? '',
    employmentType: item?.employmentType ?? '',
    location: item?.location ?? '',
    startDate: toMonthInput(item?.startDate),
    endDate: toMonthInput(item?.endDate),
    currentlyWorking: item?.currentlyWorking ?? false,
    description: item?.description ?? '',
  };
}

function toPayload(form) {
  return {
    jobTitle: form.jobTitle.trim(),
    company: form.company.trim(),
    employmentType: form.employmentType,
    location: form.location.trim(),
    startDate: fromMonthInput(form.startDate),
    endDate: form.currentlyWorking ? null : fromMonthInput(form.endDate),
    currentlyWorking: form.currentlyWorking,
    description: form.description.trim(),
  };
}

function describe(item) {
  const meta = [{ icon: Calendar, text: formatRange(item.startDate, item.endDate, item.currentlyWorking) }];
  if (item.location) meta.push({ icon: MapPin, text: item.location });
  return {
    title: item.jobTitle,
    subtitle: item.employmentType ? `${item.company} · ${item.employmentType}` : item.company,
    meta,
    description: item.description,
  };
}

function renderFields({ form, errors, onChange }) {
  return (
    <div className="form-grid">
      <FormInput
        label="Job title"
        name="jobTitle"
        placeholder="e.g. Software Engineering Intern"
        value={form.jobTitle}
        onChange={onChange}
        error={errors.jobTitle}
      />
      <FormInput
        label="Company"
        name="company"
        placeholder="e.g. Infosys"
        value={form.company}
        onChange={onChange}
        error={errors.company}
      />
      <FormInput
        as="select"
        label="Employment type"
        name="employmentType"
        options={EMPLOYMENT_TYPES}
        value={form.employmentType}
        onChange={onChange}
        error={errors.employmentType}
        optional
      />
      <FormInput
        label="Location"
        name="location"
        placeholder="e.g. Pune · Remote"
        value={form.location}
        onChange={onChange}
        error={errors.location}
        optional
      />
      <FormInput
        label="Start date"
        name="startDate"
        type="month"
        placeholder="YYYY-MM"
        value={form.startDate}
        onChange={onChange}
        error={errors.startDate}
      />
      <FormInput
        label="End date"
        name="endDate"
        type="month"
        placeholder="YYYY-MM"
        value={form.currentlyWorking ? '' : form.endDate}
        onChange={onChange}
        error={errors.endDate}
        disabled={form.currentlyWorking}
        hint={form.currentlyWorking ? 'Shown as “Present”' : undefined}
      />
      <div className="form-grid__full">
        <Checkbox
          name="currentlyWorking"
          label="I currently work here"
          checked={form.currentlyWorking}
          onChange={onChange}
        />
      </div>
      <FormInput
        className="form-grid__full"
        as="textarea"
        rows={6}
        label="What did you do?"
        name="description"
        placeholder={'• Built a feature that…\n• Improved … by 30%\n• Worked with …'}
        hint="Tip: one achievement per line, starting with an action verb."
        value={form.description}
        onChange={onChange}
        error={errors.description}
        maxLength={2000}
        showCount
        optional
      />
    </div>
  );
}

export default function ExperienceSection({ items }) {
  const { save } = useProfile();

  return (
    <SectionManager
      title="Work experience"
      description="Jobs, internships and freelance work. Current roles appear first."
      items={items}
      itemName="experience"
      icon={Briefcase}
      emptyTitle="No experience added yet"
      emptyText="Internships, part-time jobs and freelance projects all count."
      toForm={toForm}
      toPayload={toPayload}
      validate={validateExperience}
      describe={describe}
      renderFields={renderFields}
      onCreate={(payload) => save(() => profileService.addExperience(payload))}
      onUpdate={(id, payload) => save(() => profileService.updateExperience(id, payload))}
      onDelete={(id) => save(() => profileService.deleteExperience(id))}
    />
  );
}

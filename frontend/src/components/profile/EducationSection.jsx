import { Award, Calendar, GraduationCap } from 'lucide-react';
import SectionManager from './SectionManager.jsx';
import FormInput from '../common/FormInput.jsx';
import Checkbox from '../common/Checkbox.jsx';
import profileService from '../../api/profileService';
import useProfile from '../../hooks/useProfile';
import { formatRange, fromMonthInput, toMonthInput } from '../../utils/date';
import { validateEducation } from '../../utils/validators';

function toForm(item) {
  return {
    institution: item?.institution ?? '',
    degree: item?.degree ?? '',
    fieldOfStudy: item?.fieldOfStudy ?? '',
    startDate: toMonthInput(item?.startDate),
    endDate: toMonthInput(item?.endDate),
    currentlyStudying: item?.currentlyStudying ?? false,
    grade: item?.grade ?? '',
    description: item?.description ?? '',
  };
}

function toPayload(form) {
  return {
    institution: form.institution.trim(),
    degree: form.degree.trim(),
    fieldOfStudy: form.fieldOfStudy.trim(),
    startDate: fromMonthInput(form.startDate),
    endDate: form.currentlyStudying ? null : fromMonthInput(form.endDate),
    currentlyStudying: form.currentlyStudying,
    grade: form.grade.trim(),
    description: form.description.trim(),
  };
}

function describe(item) {
  const meta = [{ icon: Calendar, text: formatRange(item.startDate, item.endDate, item.currentlyStudying) }];
  if (item.grade) meta.push({ icon: Award, text: item.grade });
  return {
    title: item.fieldOfStudy ? `${item.degree}, ${item.fieldOfStudy}` : item.degree,
    subtitle: item.institution,
    meta,
    description: item.description,
  };
}

function renderFields({ form, errors, onChange }) {
  return (
    <div className="form-grid">
      <FormInput
        className="form-grid__full"
        label="School / University"
        name="institution"
        placeholder="e.g. University of Mumbai"
        value={form.institution}
        onChange={onChange}
        error={errors.institution}
      />
      <FormInput
        label="Degree"
        name="degree"
        placeholder="e.g. B.Tech"
        value={form.degree}
        onChange={onChange}
        error={errors.degree}
      />
      <FormInput
        label="Field of study"
        name="fieldOfStudy"
        placeholder="e.g. Computer Science"
        value={form.fieldOfStudy}
        onChange={onChange}
        error={errors.fieldOfStudy}
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
        value={form.currentlyStudying ? '' : form.endDate}
        onChange={onChange}
        error={errors.endDate}
        disabled={form.currentlyStudying}
        hint={form.currentlyStudying ? 'Shown as “Present”' : undefined}
      />
      <div className="form-grid__full">
        <Checkbox
          name="currentlyStudying"
          label="I currently study here"
          checked={form.currentlyStudying}
          onChange={onChange}
        />
      </div>
      <FormInput
        label="Grade / CGPA"
        name="grade"
        placeholder="e.g. 8.6 CGPA or 82%"
        value={form.grade}
        onChange={onChange}
        error={errors.grade}
        optional
      />
      <FormInput
        className="form-grid__full"
        as="textarea"
        label="Highlights"
        name="description"
        placeholder="Relevant coursework, projects, awards or activities"
        value={form.description}
        onChange={onChange}
        error={errors.description}
        maxLength={1000}
        showCount
        optional
      />
    </div>
  );
}

export default function EducationSection({ items }) {
  const { save } = useProfile();

  return (
    <SectionManager
      title="Education"
      description="Degrees, diplomas and schooling, newest first."
      items={items}
      itemName="education entry"
      icon={GraduationCap}
      emptyTitle="No education added yet"
      emptyText="Add your degree or school so employers know your academic background."
      toForm={toForm}
      toPayload={toPayload}
      validate={validateEducation}
      describe={describe}
      renderFields={renderFields}
      onCreate={(payload) => save(() => profileService.addEducation(payload))}
      onUpdate={(id, payload) => save(() => profileService.updateEducation(id, payload))}
      onDelete={(id) => save(() => profileService.deleteEducation(id))}
    />
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Plus, Wrench, X } from 'lucide-react';
import Button from '../common/Button.jsx';
import FormInput from '../common/FormInput.jsx';
import EmptyState from '../common/EmptyState.jsx';
import profileService from '../../api/profileService';
import { getErrorMessage } from '../../api/axios';
import useProfile from '../../hooks/useProfile';
import useToast from '../../hooks/useToast';
import { validateSkillName } from '../../utils/validators';
import './SkillsEditor.css';
import './ProfileForms.css';

export const SKILL_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

const LEVEL_RANK = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };

/**
 * Tag-style skills editor. Changes are kept in a local draft and saved
 * together with one request (PUT /api/profile/skills replaces the list).
 */
export default function SkillsEditor({ skills }) {
  const { save } = useProfile();
  const toast = useToast();

  const savedKey = JSON.stringify(skills.map(({ name, level }) => ({ name, level })));
  const saved = useMemo(() => JSON.parse(savedKey), [savedKey]);

  const [draft, setDraft] = useState(saved);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('INTERMEDIATE');
  const [inputError, setInputError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  const isDirty = JSON.stringify(draft) !== savedKey;

  function handleAdd(event) {
    event?.preventDefault();
    const error = validateSkillName(name, draft);
    if (error) {
      setInputError(error);
      return;
    }
    setDraft((current) => [...current, { name: name.trim(), level }]);
    setName('');
    setInputError('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') handleAdd(event);
  }

  function changeLevel(index, newLevel) {
    setDraft((current) => current.map((skill, i) => (i === index ? { ...skill, level: newLevel } : skill)));
  }

  function removeSkill(index) {
    setDraft((current) => current.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await save(() => profileService.replaceSkills(draft));
      toast.success('Skills saved');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your skills.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h2 className="card__title">Skills</h2>
          <p className="card__subtitle">Add the tools, languages and abilities you want employers to see.</p>
        </div>
      </div>

      <div className="card__body">
        <div className="skills-editor__add">
          <FormInput
            label="Skill"
            name="skillName"
            placeholder="e.g. React, Java, Public speaking"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (inputError) setInputError('');
            }}
            onKeyDown={handleKeyDown}
            error={inputError}
            maxLength={60}
          />
          <FormInput
            as="select"
            label="Level"
            name="skillLevel"
            options={SKILL_LEVELS}
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          />
          <Button icon={Plus} onClick={handleAdd} className="skills-editor__add-button">
            Add
          </Button>
        </div>

        {draft.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No skills yet"
            text="Add at least 3 skills. Type a skill above and press Enter."
          />
        ) : (
          <ul className="skills-editor__list">
            {draft.map((skill, index) => (
              <li key={skill.name.toLowerCase()} className="skill-chip">
                <span className="skill-chip__name">{skill.name}</span>
                <span className="skill-chip__dots" aria-hidden="true">
                  {[1, 2, 3, 4].map((dot) => (
                    <span key={dot} className={dot <= LEVEL_RANK[skill.level] ? 'is-on' : ''} />
                  ))}
                </span>
                <select
                  className="skill-chip__level"
                  value={skill.level}
                  onChange={(event) => changeLevel(index, event.target.value)}
                  aria-label={`Level for ${skill.name}`}
                >
                  {SKILL_LEVELS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="skill-chip__remove"
                  onClick={() => removeSkill(index)}
                  aria-label={`Remove ${skill.name}`}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="form-actions">
          <span className="form-actions__status">
            {draft.length} skill{draft.length === 1 ? '' : 's'} · {isDirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
          <Button variant="secondary" onClick={() => setDraft(saved)} disabled={!isDirty || saving}>
            Discard
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!isDirty}>
            Save skills
          </Button>
        </div>
      </div>
    </section>
  );
}

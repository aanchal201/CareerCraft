import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Award, Briefcase, GraduationCap, UserRound, Wrench } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingBlock from '../../components/common/LoadingBlock.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Button from '../../components/common/Button.jsx';
import AvatarUploader from '../../components/profile/AvatarUploader.jsx';
import PersonalInfoForm from '../../components/profile/PersonalInfoForm.jsx';
import EducationSection from '../../components/profile/EducationSection.jsx';
import ExperienceSection from '../../components/profile/ExperienceSection.jsx';
import SkillsEditor from '../../components/profile/SkillsEditor.jsx';
import CertificationSection from '../../components/profile/CertificationSection.jsx';
import ProfileCompletionCard from '../../components/profile/ProfileCompletionCard.jsx';
import useProfile from '../../hooks/useProfile';
import './ProfilePage.css';

const TABS = [
  { id: 'personal', label: 'Personal info', icon: UserRound },
  { id: 'education', label: 'Education', icon: GraduationCap, countKey: 'education' },
  { id: 'experience', label: 'Experience', icon: Briefcase, countKey: 'experience' },
  { id: 'skills', label: 'Skills', icon: Wrench, countKey: 'skills' },
  { id: 'certifications', label: 'Certifications', icon: Award, countKey: 'certifications' },
];

/**
 * Profile editor. The active tab lives in the URL (?tab=education), so the
 * dashboard's "next steps" links can open a specific tab directly.
 */
export default function ProfilePage() {
  const { profile, loading, error, reload } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((tab) => tab.id === requestedTab) ? requestedTab : 'personal';

  function selectTab(id) {
    setSearchParams(id === 'personal' ? {} : { tab: id }, { replace: true });
  }

  if (loading && !profile) return <LoadingBlock label="Loading your profile…" />;

  if (error && !profile) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="danger"
        title="We couldn't load your profile"
        text={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  return (
    <div className="profile-page">
      <PageHeader
        title="My profile"
        description="This information powers your resumes and portfolio. Keep it up to date."
      />

      <div className="profile-page__layout">
        <div className="profile-page__main">
          <div className="profile-tabs" role="tablist" aria-label="Profile sections">
            {TABS.map(({ id, label, icon: Icon, countKey }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={activeTab === id}
                aria-controls={`panel-${id}`}
                className={`profile-tabs__tab ${activeTab === id ? 'is-active' : ''}`}
                onClick={() => selectTab(id)}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
                {countKey && <span className="profile-tabs__count">{profile[countKey].length}</span>}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'personal' && (
              <section className="card">
                <div className="card__body">
                  <AvatarUploader name={profile.personal.fullName} avatarPath={profile.personal.avatarPath} />
                  <hr className="profile-page__divider" />
                  <PersonalInfoForm personal={profile.personal} />
                </div>
              </section>
            )}
            {activeTab === 'education' && <EducationSection items={profile.education} />}
            {activeTab === 'experience' && <ExperienceSection items={profile.experience} />}
            {activeTab === 'skills' && <SkillsEditor skills={profile.skills} />}
            {activeTab === 'certifications' && <CertificationSection items={profile.certifications} />}
          </div>
        </div>

        <aside className="profile-page__aside">
          <ProfileCompletionCard completion={profile.completion} compact />
        </aside>
      </div>
    </div>
  );
}

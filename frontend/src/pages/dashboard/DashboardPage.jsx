import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Briefcase,
  Code,
  Globe,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Wrench,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingBlock from '../../components/common/LoadingBlock.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Button from '../../components/common/Button.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import ProfileCompletionCard from '../../components/profile/ProfileCompletionCard.jsx';
import RecentResumesCard from '../../components/resume/RecentResumesCard.jsx';
import useProfile from '../../hooks/useProfile';
import { getGreeting } from '../../utils/date';
import '../../components/common/Button.css';
import './DashboardPage.css';

const STATS = [
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'certifications', label: 'Certifications', icon: Award },
];

export default function DashboardPage() {
  const { profile, loading, error, reload } = useProfile();

  if (loading && !profile) return <LoadingBlock label="Loading your dashboard…" />;

  if (error && !profile) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="danger"
        title="We couldn't load your dashboard"
        text={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  const { personal } = profile;
  const firstName = personal.fullName.split(' ')[0];

  return (
    <div className="dashboard">
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description="Here’s an overview of your career profile."
        actions={
          // A link styled like a button (a <button> inside an <a> is invalid HTML)
          <Link to="/profile" className="btn btn--secondary btn--md dashboard__edit-link">
            <Pencil size={18} aria-hidden="true" />
            <span>Edit profile</span>
          </Link>
        }
      />

      <ul className="dashboard__stats">
        {STATS.map(({ key, label, icon: Icon }) => (
          <li key={key}>
            <Link to={`/profile?tab=${key}`} className="stat-card">
              <span className="stat-card__icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="stat-card__value">{profile[key].length}</span>
              <span className="stat-card__label">{label}</span>
              <ArrowRight size={16} className="stat-card__arrow" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="dashboard__grid">
        <div className="dashboard__column">
          <ProfileCompletionCard completion={profile.completion} />
          <RecentResumesCard />
        </div>

        <section className="card profile-snapshot">
          <div className="card__header">
            <h2 className="card__title">Profile snapshot</h2>
            <Link to="/profile" className="profile-snapshot__edit">
              Edit
            </Link>
          </div>
          <div className="card__body">
            <div className="profile-snapshot__identity">
              <Avatar name={personal.fullName} avatarPath={personal.avatarPath} size={64} />
              <div>
                <p className="profile-snapshot__name">{personal.fullName}</p>
                <p className="profile-snapshot__headline">
                  {personal.headline || <Link to="/profile">Add a professional headline</Link>}
                </p>
              </div>
            </div>

            {personal.about && <p className="profile-snapshot__about">{personal.about}</p>}

            <ul className="profile-snapshot__details">
              <li>
                <Mail size={16} aria-hidden="true" /> {personal.email}
              </li>
              {personal.phone && (
                <li>
                  <Phone size={16} aria-hidden="true" /> {personal.phone}
                </li>
              )}
              {personal.location && (
                <li>
                  <MapPin size={16} aria-hidden="true" /> {personal.location}
                </li>
              )}
            </ul>

            {(personal.linkedinUrl || personal.githubUrl || personal.websiteUrl) && (
              <div className="profile-snapshot__links">
                {personal.linkedinUrl && <ExternalChip href={personal.linkedinUrl} icon={Link2} label="LinkedIn" />}
                {personal.githubUrl && <ExternalChip href={personal.githubUrl} icon={Code} label="GitHub" />}
                {personal.websiteUrl && <ExternalChip href={personal.websiteUrl} icon={Globe} label="Website" />}
              </div>
            )}

            {profile.skills.length > 0 && (
              <div className="profile-snapshot__skills">
                <p className="profile-snapshot__label">Top skills</p>
                <ul>
                  {profile.skills.slice(0, 8).map((skill) => (
                    <li key={skill.id}>{skill.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ExternalChip({ href, icon: Icon, label }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="profile-snapshot__link">
      <Icon size={15} aria-hidden="true" /> {label}
    </a>
  );
}

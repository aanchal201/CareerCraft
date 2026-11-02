import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import profileService from '../api/profileService';
import { getErrorMessage } from '../api/axios';
import useAuth from '../hooks/useAuth';

export const ProfileContext = createContext(null);

/**
 * Loads the current user's profile once and shares it with every page
 * inside the dashboard layout (dashboard, profile, sidebar).
 *
 * Every profile API call returns the full updated profile, so `save()`
 * simply replaces our copy - completion %, lists and avatar all stay in sync.
 */
export function ProfileProvider({ children }) {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applyProfile = useCallback(
    (data) => {
      setProfile(data);
      // keep the top bar (name + avatar) in sync with the profile
      updateUser({ fullName: data.personal.fullName, avatarPath: data.personal.avatarPath });
    },
    [updateUser]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      applyProfile(await profileService.getProfile());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your profile.'));
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * Runs a profile API call and stores the returned profile.
   * Errors are re-thrown so forms can show field errors.
   *   await save(() => profileService.addEducation(payload));
   */
  const save = useCallback(
    async (request) => {
      const data = await request();
      applyProfile(data);
      return data;
    },
    [applyProfile]
  );

  const value = useMemo(() => ({ profile, loading, error, reload, save }), [profile, loading, error, reload, save]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

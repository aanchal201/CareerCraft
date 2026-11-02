import { useContext } from 'react';
import { ProfileContext } from '../context/ProfileContext.jsx';

/** const { profile, loading, error, reload, save } = useProfile(); */
export default function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used inside <ProfileProvider>');
  }
  return context;
}

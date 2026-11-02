import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import Avatar from '../common/Avatar.jsx';
import Button from '../common/Button.jsx';
import Spinner from '../common/Spinner.jsx';
import profileService from '../../api/profileService';
import { getErrorMessage } from '../../api/axios';
import useProfile from '../../hooks/useProfile';
import useToast from '../../hooks/useToast';
import './AvatarUploader.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

/** Upload / replace / remove the profile picture. */
export default function AvatarUploader({ name, avatarPath }) {
  const { save } = useProfile();
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow choosing the same file again later
    if (!file) return;

    // quick checks in the browser; the backend checks again
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be 2 MB or smaller.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await save(() => profileService.uploadPicture(file));
      toast.success('Profile photo updated');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload the image.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError('');
    try {
      await save(() => profileService.deletePicture());
      toast.success('Profile photo removed');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not remove the image.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avatar-uploader">
      <div className="avatar-uploader__preview">
        <Avatar name={name} avatarPath={avatarPath} size={88} />
        {busy && (
          <span className="avatar-uploader__busy">
            <Spinner size={22} label="Uploading" />
          </span>
        )}
      </div>

      <div className="avatar-uploader__body">
        <p className="avatar-uploader__title">Profile photo</p>
        <p className="avatar-uploader__hint">JPG, PNG or WEBP, up to 2 MB. A clear, friendly headshot works best.</p>
        <div className="avatar-uploader__actions">
          <Button size="sm" variant="secondary" icon={Camera} onClick={() => inputRef.current?.click()} disabled={busy}>
            {avatarPath ? 'Change photo' : 'Upload photo'}
          </Button>
          {avatarPath && (
            <Button size="sm" variant="ghost" icon={Trash2} onClick={handleRemove} disabled={busy}>
              Remove
            </Button>
          )}
        </div>
        {error && (
          <p className="avatar-uploader__error" role="alert">
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

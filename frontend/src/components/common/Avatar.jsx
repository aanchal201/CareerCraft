import { useEffect, useState } from 'react';
import { buildApiUrl } from '../../api/axios';
import './Avatar.css';

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/**
 * Round user picture. Falls back to initials when there is no picture
 * or the image fails to load.
 *  avatarPath: API-relative path from the backend ("/users/1/avatar?v=...")
 */
export default function Avatar({ name, avatarPath, size = 36, className = '' }) {
  const [failed, setFailed] = useState(false);
  const src = buildApiUrl(avatarPath);

  // a new picture gets a new URL -> try loading again
  useEffect(() => setFailed(false), [src]);

  const style = { width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.38)) };

  return (
    <span className={`avatar ${className}`} style={style}>
      {src && !failed ? (
        <img src={src} alt={name ? `${name}'s profile picture` : 'Profile picture'} onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
}

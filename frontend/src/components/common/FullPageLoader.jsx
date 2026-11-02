import Spinner from './Spinner.jsx';
import './FullPageLoader.css';

/** Centered loader used while the app checks the saved session. */
export default function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="full-page-loader">
      <Spinner size={28} label={label} />
      <p>{label}</p>
    </div>
  );
}

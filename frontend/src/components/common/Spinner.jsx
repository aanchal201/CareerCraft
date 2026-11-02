import './Spinner.css';

/** Small circular loading indicator that inherits the current text color. */
export default function Spinner({ size = 20, label = 'Loading' }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} role="status" aria-label={label} />
  );
}

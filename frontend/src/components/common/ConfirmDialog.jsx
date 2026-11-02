import Modal from './Modal.jsx';
import Button from './Button.jsx';

/** "Are you sure?" dialog used before destructive actions. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => {} : onCancel}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
    </Modal>
  );
}

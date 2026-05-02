import type { ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  isDanger?: boolean
  children?: ReactNode
  onConfirm: () => void
  onClose: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  isDanger = false,
  children,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  if (!open) {
    return null
  }

  return (
    <div className="modal-overlay" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <span className={`confirm-dialog-icon ${isDanger ? 'danger' : ''}`}>
          <AlertTriangle size={21} />
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={isDanger ? 'danger-btn' : 'primary-btn'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

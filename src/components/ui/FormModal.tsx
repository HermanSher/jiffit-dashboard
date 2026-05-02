import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface FormModalProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export const FormModal = ({ open, title, description, children, onClose }: FormModalProps) => {
  if (!open) {
    return null
  }

  return (
    <div className="modal-overlay" role="presentation">
      <section className="form-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="form-modal-header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

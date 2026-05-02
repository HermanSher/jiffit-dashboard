import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
}

export const EmptyState = ({
  title = 'No records found',
  description = 'Try changing filters or create a new record.',
}: EmptyStateProps) => (
  <div className="empty-state">
    <span>
      <Inbox size={22} />
    </span>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
)

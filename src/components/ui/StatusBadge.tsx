import clsx from 'clsx'

interface StatusBadgeProps {
  value: string | number | boolean | null | undefined
}

const resolveTone = (value: string): string => {
  const normalized = value.toUpperCase()

  if (['ACTIVE', 'LIVE', 'AVAILABLE', 'PAID', 'COMPLETED', 'CONFIRMED', 'TRUE', 'VERIFIED'].includes(normalized)) {
    return 'success'
  }

  if (['HOLD', 'PENDING', 'PENDING_HUB_VERIFICATION', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'AUTHORIZED', 'RESUBMISSION_REQUIRED'].includes(normalized)) {
    return 'warning'
  }

  if (['CANCELLED', 'FAILED', 'INACTIVE', 'OFFLINE', 'STALE', 'FALSE', 'REJECTED'].includes(normalized)) {
    return 'danger'
  }

  return 'neutral'
}

export const StatusBadge = ({ value }: StatusBadgeProps) => {
  const rawLabel = typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : String(value ?? 'Unknown')
  const label = rawLabel.toUpperCase() === 'DRAFT' ? 'Draft / Incomplete' : rawLabel

  return <span className={clsx('status-badge', resolveTone(label))}>{label.replace(/_/g, ' ')}</span>
}

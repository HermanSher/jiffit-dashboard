import clsx from 'clsx'

interface StatusBadgeProps {
  value: string | number | boolean | null | undefined
}

const resolveTone = (value: string): string => {
  const normalized = value.toUpperCase()

  if (['ACTIVE', 'LIVE', 'AVAILABLE', 'PAID', 'COMPLETED', 'CONFIRMED', 'TRUE'].includes(normalized)) {
    return 'success'
  }

  if (['HOLD', 'PENDING', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'AUTHORIZED'].includes(normalized)) {
    return 'warning'
  }

  if (['CANCELLED', 'FAILED', 'INACTIVE', 'OFFLINE', 'STALE', 'FALSE', 'REJECTED'].includes(normalized)) {
    return 'danger'
  }

  return 'neutral'
}

export const StatusBadge = ({ value }: StatusBadgeProps) => {
  const label =
    typeof value === 'boolean' ? (value ? 'Active' : 'Inactive') : String(value ?? 'Unknown')

  return <span className={clsx('status-badge', resolveTone(label))}>{label.replace(/_/g, ' ')}</span>
}

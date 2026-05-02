import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  note?: string
  icon: LucideIcon
  tone?: 'brand' | 'green' | 'orange' | 'blue'
}

export const StatCard = ({ label, value, note, icon: Icon, tone = 'brand' }: StatCardProps) => (
  <article className={`stat-card ${tone}`}>
    <div>
      <p className="stat-label">{label}</p>
      <strong className="stat-value">{value}</strong>
      {note ? <span className="stat-note">{note}</span> : null}
    </div>
    <span className="stat-icon">
      <Icon size={20} />
    </span>
  </article>
)

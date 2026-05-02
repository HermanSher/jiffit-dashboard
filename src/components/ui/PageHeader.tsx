import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  icon?: LucideIcon
  actions?: ReactNode
}

export const PageHeader = ({ eyebrow, title, description, icon: Icon, actions }: PageHeaderProps) => (
  <header className="page-header">
    <div className="page-header-copy">
      {eyebrow ? (
        <p className="page-eyebrow">
          {Icon ? <Icon size={15} /> : null}
          {eyebrow}
        </p>
      ) : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
    {actions ? <div className="page-header-actions">{actions}</div> : null}
  </header>
)

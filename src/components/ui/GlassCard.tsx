import type { ReactNode } from 'react'
import clsx from 'clsx'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

export const GlassCard = ({ children, className }: GlassCardProps) => (
  <section className={clsx('glass-card', className)}>{children}</section>
)

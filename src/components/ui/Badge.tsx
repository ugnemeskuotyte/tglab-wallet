import { clsx } from 'clsx'
import styles from './Badge.module.css'

type BadgeVariant = 'win' | 'lost' | 'canceled' | 'pending' | 'bet' | 'cancel' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={clsx(styles.base, styles[variant], className)}>
      {children}
    </span>
  )
}

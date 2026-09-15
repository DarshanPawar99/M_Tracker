import { Link } from 'react-router-dom'
import { Drop } from '@phosphor-icons/react'

interface EmptyStateProps {
  title: string
  body?: string
  cta?: { to: string; label: string }
}

export default function EmptyState({ title, body, cta }: EmptyStateProps) {
  return (
    <div className="card mt-6 items-center text-center" style={{ padding: 'var(--space-8)' }}>
      <div
        className="mb-3 grid h-12 w-12 place-items-center rounded-full"
        style={{ background: 'var(--color-accent-900)' }}
      >
        <Drop size={22} color="var(--color-accent)" />
      </div>
      <div className="text-[15px]" style={{ fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
        {title}
      </div>
      {body && <p className="mt-1 max-w-xs text-[13px] text-muted">{body}</p>}
      {cta && (
        <Link to={cta.to} className="btn btn-primary mt-4" style={{ minHeight: 40 }}>
          {cta.label}
        </Link>
      )}
    </div>
  )
}

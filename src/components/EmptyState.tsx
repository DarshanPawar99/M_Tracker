import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  body?: string
  cta?: { to: string; label: string }
}

export default function EmptyState({ title, body, cta }: EmptyStateProps) {
  return (
    <div className="card mt-6 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-2xl">
        🌸
      </div>
      <div className="font-semibold text-gray-800">{title}</div>
      {body && <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">{body}</p>}
      {cta && (
        <Link to={cta.to} className="btn-primary mt-4 inline-flex">
          {cta.label}
        </Link>
      )}
    </div>
  )
}

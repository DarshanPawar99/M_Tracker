import { useStore } from '../store'

/** Pill row to switch the active person. */
export default function ProfileSwitcher() {
  const { profiles, activeProfileId, setActiveProfileId } = useStore()
  if (profiles.length <= 1) return null

  return (
    <div className="flex gap-2">
      {profiles.map((p) => {
        const active = p.id === activeProfileId
        return (
          <button
            key={p.id}
            onClick={() => setActiveProfileId(p.id)}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              active
                ? 'text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-black/5'
            }`}
            style={active ? { backgroundColor: p.color } : undefined}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: active ? '#ffffff' : p.color }}
            />
            {p.name}
          </button>
        )
      })}
    </div>
  )
}

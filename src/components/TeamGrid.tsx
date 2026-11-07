import type { TeamMember } from '@/lib/types'

export default function TeamGrid({
  team,
  admin,
  getImageUrl,
}: {
  team: TeamMember[]
  admin: boolean
  getImageUrl: (p: string | null) => string
}) {
  return (
    <section id="team">
      <div className="wrap">
        <div className="head">
          <h2>The team</h2>
          <p>The people behind the pass and behind the plans.</p>
        </div>
        {team.length === 0 ? (
          <div className="empty">Team profiles coming soon.</div>
        ) : (
          <div className="team">
            {team.map((m) => (
              <div key={m.id} className="member">
                <div className="avatar">
                  {m.photo ? <img src={getImageUrl(m.photo)} alt={m.name ?? ''} /> : (m.name ?? '?').charAt(0)}
                </div>
                <h3>{m.name}</h3>
                <em>{m.role}</em>
                <p>{m.bio}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
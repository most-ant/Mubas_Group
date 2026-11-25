import type { Collaborator } from '@/lib/types'

export default function CollaboratorsGrid({
  collaborators,
  admin,
  getImageUrl,
}: {
  collaborators: Collaborator[]
  admin: boolean
  getImageUrl: (p: string | null) => string
}) {
  return (
    <section id="collaborators">
      <div className="wrap">
        <div className="head">
          <h2>Collaborators</h2>
          <p>The brands, venues, and partners we work with to deliver culinary and hospitality excellence.</p>
        </div>

        {collaborators.length === 0 ? (
          <div className="empty">Collaborators coming soon.</div>
        ) : (
          <div className="collaborators-grid">
            {collaborators.map((c) => (
              <div key={c.id} className="collaborator-card">
                {c.image && (
                  <div className="collaborator-img-wrap">
                    <img
                      src={getImageUrl(c.image)}
                      alt={c.name ?? c.caption ?? 'Collaborator'}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="collaborator-body">
                  {c.name && <h3>{c.name}</h3>}
                  {c.caption && <p>{c.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

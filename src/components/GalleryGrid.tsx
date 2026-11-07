import Link from 'next/link'
import type { GalleryItem } from '@/lib/types'
import UserGalleryUploadForm from '@/components/UserGalleryUploadForm'

export default function GalleryGrid({
  gallery,
  signedIn,
  getImageUrl,
}: {
  gallery: GalleryItem[]
  admin: boolean
  signedIn: boolean
  getImageUrl: (p: string | null) => string
}) {
  // Only show approved images publicly
  const approved = gallery.filter((g) => g.status === 'approved')
  // On home page, display up to 6 images
  const homeImages = approved.slice(0, 6)

  return (
    <section id="gallery">
      <div className="wrap">
        <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2>Gallery</h2>
            <p>Spaces we have built, plates we have sent, moments we have hosted.</p>
          </div>
          {approved.length > 0 && (
            <Link href="/gallery" className="btn sm out" style={{ marginBottom: 8 }}>
              More ({approved.length}) →
            </Link>
          )}
        </div>

        {approved.length === 0 ? (
          <div className="empty">Photos coming soon.</div>
        ) : (
          <>
            <div className="gal">
              {homeImages.map((g) => (
                <figure key={g.id}>
                  <div className="gal-img-wrap">
                    {g.asset ? (
                      <img
                        src={getImageUrl(g.asset)}
                        alt={g.caption ?? 'Mubas Group Gallery'}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                        No Image
                      </div>
                    )}
                    {g.is_official && <span className="chip g">Official</span>}
                  </div>
                  {(g.caption || g.credit) && (
                    <figcaption>
                      {g.caption && <strong style={{ display: 'block', color: 'var(--ink)' }}>{g.caption}</strong>}
                      {g.credit && <span style={{ display: 'block', fontSize: 12, marginTop: 4 }}>— {g.credit}</span>}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>

            {approved.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: 36 }}>
                <Link href="/gallery" className="btn" style={{ padding: '12px 36px', fontSize: 16 }}>
                  More
                </Link>
              </div>
            )}
          </>
        )}

        {signedIn && <UserGalleryUploadForm />}
      </div>
    </section>
  )
}

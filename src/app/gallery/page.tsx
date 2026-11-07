import { createClient } from '@/utils/supabase/server'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import UserGalleryUploadForm from '@/components/UserGalleryUploadForm'
import { isAdmin } from '@/lib/auth'
import { getImageUrl } from '@/utils/supabase/images'
import Link from 'next/link'

export const instant = false

export default async function FullGalleryPage() {
  const supabase = await createClient()

  const [{ data: gallery }, { data: userData }] = await Promise.all([
    supabase.from('gallery').select('*').order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  const user = userData?.user
  const admin = user ? await isAdmin(supabase, user.id) : false
  const resolveImageUrl = (p: string | null) => getImageUrl(supabase, p)

  const approved = (gallery ?? []).filter((g) => g.status === 'approved')

  return (
    <>
      <Nav admin={admin} signedIn={!!user} />
      <div style={{ paddingTop: 100, minHeight: '80vh', paddingBottom: 60 }}>
        <div className="wrap">
          <div style={{ marginBottom: 24 }}>
            <Link href="/#gallery" style={{ color: 'var(--amber)', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              ← Back to Home
            </Link>
          </div>

          <div className="head">
            <h2>Full Gallery</h2>
            <p>
              Explore our complete collection of moments, spaces, culinary dishes, and achievements.
              ({approved.length} photo{approved.length === 1 ? '' : 's'})
            </p>
          </div>

          {approved.length === 0 ? (
            <div className="empty">No approved photos in gallery yet.</div>
          ) : (
            <div className="gal">
              {approved.map((g) => (
                <figure key={g.id}>
                  <div className="gal-img-wrap">
                    {g.asset ? (
                      <img
                        src={resolveImageUrl(g.asset)}
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
          )}

          {user && (
            <div style={{ marginTop: 48 }}>
              <UserGalleryUploadForm />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

import { createClient } from '@/utils/supabase/server'
import { deleteGalleryPhoto } from '@/app/actions'
import { getImageUrl } from '@/utils/supabase/images'
import GalleryUploadForm from '@/components/admin/GalleryUploadForm'
import DeleteButton from '@/components/admin/DeleteButton'
import ApproveRejectButtons from '@/components/admin/ApproveRejectButtons'

export default async function AdminGallery() {
  const s = await createClient()
  const { data: gallery } = await s.from('gallery').select('*').order('created_at', { ascending: false })
  const resolveImageUrl = (p: string | null) => getImageUrl(s, p)

  const pending = (gallery ?? []).filter((g) => g.status === 'pending')
  const approved = (gallery ?? []).filter((g) => g.status === 'approved')

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 20 }}>Gallery</h1>

      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Upload a photo (admin — auto-approved)</h2>
        <GalleryUploadForm />
      </div>

      {/* ---- PENDING APPROVAL ---- */}
      <h2 style={{ fontSize: 26, marginBottom: 16, color: 'var(--amber)' }}>
        Pending approval ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="empty" style={{ marginBottom: 32 }}>No photos awaiting approval.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16, marginBottom: 32 }}>
          {pending.map((g) => (
            <div key={g.id} style={{ background: 'var(--card)', border: '2px solid var(--amber)', borderRadius: 14, overflow: 'hidden' }}>
              {g.asset ? (
                <img
                  src={resolveImageUrl(g.asset)}
                  alt={g.caption ?? 'Pending gallery item'}
                  style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: 160, background: 'var(--line)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                  No asset
                </div>
              )}
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ background: 'var(--amber)', color: '#000', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>PENDING</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>User upload</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{g.caption || 'Untitled photo'}</div>
                {g.credit && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>— {g.credit}</div>}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <ApproveRejectButtons id={g.id} asset={g.asset} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- APPROVED ---- */}
      <h2 style={{ fontSize: 26, marginBottom: 16 }}>Approved photos ({approved.length})</h2>
      {approved.length === 0 && (
        <div className="empty">No approved photos in gallery yet. Upload one using the form above.</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
        {approved.map((g) => (
          <div key={g.id} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            {g.asset ? (
              <img
                src={resolveImageUrl(g.asset)}
                alt={g.caption ?? 'Gallery item'}
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: 160, background: 'var(--line)', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                No asset
              </div>
            )}
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{g.caption || 'Untitled photo'}</div>
              {g.credit && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>— {g.credit}</div>}
              <div style={{ marginTop: 12 }}>
                <DeleteButton
                  onDelete={async () => {
                    'use server'
                    return await deleteGalleryPhoto(g.id, g.asset)
                  }}
                  confirmMessage="Delete this photo from the gallery?"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

import { createClient } from '@/utils/supabase/server'
import { deleteApplication } from '@/app/actions'
import DeleteButton from '@/components/admin/DeleteButton'
import MarkReceivedButton from '@/components/admin/MarkReceivedButton'

export default async function AdminApplications() {
  const s = await createClient()
  const { data: apps } = await s.from('applications').select('*').order('created_at', { ascending: false })

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 20 }}>Applications</h1>
      {(apps ?? []).length === 0 && <div className="empty">No applications submitted yet.</div>}
      {(apps ?? []).map((a) => (
        <div key={a.id} className="job" style={{ borderLeft: a.status === 'received' ? '4px solid var(--green)' : '4px solid var(--amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 24 }}>{a.name}</h3>
              {a.status === 'received' ? (
                <span style={{ background: 'rgba(15,61,39,.12)', color: 'var(--green)', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                  ✓ RECEIVED
                </span>
              ) : (
                <span style={{ background: 'rgba(232,150,46,.15)', color: 'var(--amber)', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                  ⏳ PENDING
                </span>
              )}
            </div>
            {a.created_at && (
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {new Date(a.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
          <div className="meta">
            For: {a.job_title} · <a href={`mailto:${a.email}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{a.email}</a>
            {a.phone && (
              <> · <a href={`tel:${a.phone}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{a.phone}</a></>
            )}
          </div>
          <p style={{ margin: '14px 0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{a.message}</p>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <MarkReceivedButton id={a.id} currentStatus={a.status ?? 'pending'} />
            <DeleteButton
              onDelete={async () => {
                'use server'
                return await deleteApplication(a.id)
              }}
              label="Delete application"
              confirmMessage={`Delete application from "${a.name}"?`}
            />
          </div>
        </div>
      ))}
    </>
  )
}

import { createClient } from '@/utils/supabase/server'
import { deleteCollaborator } from '@/app/actions'
import { getImageUrl } from '@/utils/supabase/images'
import CollaboratorForm from '@/components/admin/CollaboratorForm'
import CollaboratorEditForm from '@/components/admin/CollaboratorEditForm'
import DeleteButton from '@/components/admin/DeleteButton'
import type { Collaborator } from '@/lib/types'

export default async function AdminCollaborators() {
  const s = await createClient()
  const { data: collaborators, error } = await s
    .from('collaborators')
    .select('*')
    .order('created_at', { ascending: false })

  const resolveImageUrl = (p: string | null) => getImageUrl(s, p)

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 12 }}>Collaborators</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        Manage collaborator logos, partner images, and captions displayed at the bottom of the website.
      </p>

      {error && (
        <div
          style={{
            color: '#c0392b',
            background: 'rgba(192,57,43,.1)',
            padding: '14px 18px',
            borderRadius: 10,
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          <b>Database Notice:</b> The <code>collaborators</code> table is not ready in Supabase yet.
          Please run the script in <code>supabase/migration-collaborators.sql</code> in your Supabase SQL editor.
        </div>
      )}

      <h2 style={{ fontSize: 26, marginBottom: 16 }}>Existing collaborators</h2>
      {(collaborators ?? []).length === 0 && (
        <div className="empty">No collaborators added yet. Use the form below to add one.</div>
      )}

      {(collaborators ?? []).map((c: Collaborator) => (
        <div
          key={c.id}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            {c.image ? (
              <div
                style={{
                  width: 140,
                  height: 90,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid var(--line)',
                  flexShrink: 0,
                  background: '#000',
                }}
              >
                <img
                  src={resolveImageUrl(c.image)}
                  alt={c.name ?? c.caption ?? ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 140,
                  height: 90,
                  borderRadius: 12,
                  background: 'var(--bg)',
                  border: '1px dashed var(--line)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--muted)',
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                No Image
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <b style={{ fontSize: 20 }}>{c.name || 'Untitled Collaborator'}</b>
              {c.caption && (
                <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>
                  {c.caption}
                </div>
              )}
            </div>
          </div>

          <CollaboratorEditForm collaborator={c} getImageUrl={resolveImageUrl} />

          <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <DeleteButton
              onDelete={async () => {
                'use server'
                return await deleteCollaborator(c.id, c.image)
              }}
              label="Delete collaborator"
              confirmMessage={`Delete "${c.name || c.caption || 'this collaborator'}"?`}
            />
          </div>
        </div>
      ))}

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 24,
          marginTop: 32,
        }}
      >
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Add a collaborator</h2>
        <CollaboratorForm />
      </div>
    </>
  )
}

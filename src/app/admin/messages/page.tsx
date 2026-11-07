import { createClient } from '@/utils/supabase/server'
import { deleteMessage } from '@/app/actions'
import DeleteButton from '@/components/admin/DeleteButton'
import ReplyMessageForm from '@/components/admin/ReplyMessageForm'

export default async function AdminMessages() {
  const s = await createClient()
  const { data: messages } = await s.from('messages').select('*').order('created_at', { ascending: false })

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 20 }}>Messages</h1>
      {(messages ?? []).length === 0 && <div className="empty">No messages from users yet.</div>}
      {(messages ?? []).map((m) => (
        <div key={m.id} className="job">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ fontSize: 20 }}>{m.user_email}</h3>
            </div>
            {m.created_at && (
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {new Date(m.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>

          <p style={{ margin: '14px 0', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 15 }}>{m.content}</p>

          {m.admin_reply && (
            <div
              style={{
                background: 'rgba(15,61,39,.06)',
                border: '1px solid rgba(15,61,39,.15)',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>Your reply:</div>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.admin_reply}</div>
              {m.replied_at && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  Replied {new Date(m.replied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}

          <ReplyMessageForm id={m.id} existingReply={m.admin_reply} />

          <div style={{ marginTop: 14 }}>
            <DeleteButton
              onDelete={async () => {
                'use server'
                return await deleteMessage(m.id)
              }}
              label="Delete message"
              confirmMessage={`Delete message from "${m.user_email}"?`}
            />
          </div>
        </div>
      ))}
    </>
  )
}

import { createClient } from '@/utils/supabase/server'
import { deleteTeamMember } from '@/app/actions'
import { getImageUrl } from '@/utils/supabase/images'
import TeamMemberForm from '@/components/admin/TeamMemberForm'
import TeamMemberEditForm from '@/components/admin/TeamMemberEditForm'
import DeleteButton from '@/components/admin/DeleteButton'

export default async function AdminTeam() {
  const s = await createClient()
  const { data: team } = await s.from('team').select('*').order('id')
  const resolveImageUrl = (p: string | null) => getImageUrl(s, p)

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 20 }}>Team</h1>

      <h2 style={{ fontSize: 26, marginBottom: 16 }}>Existing team members</h2>
      {(team ?? []).length === 0 && (
        <div className="empty">No team members yet. Use the form below to add one.</div>
      )}

      {(team ?? []).map((m) => (
        <div key={m.id} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <div className="avatar" style={{ margin: 0 }}>
              {m.photo ? (
                <img src={resolveImageUrl(m.photo)} alt={m.name ?? ''} />
              ) : (
                (m.name ?? '?').charAt(0)
              )}
            </div>
            <div>
              <b style={{ fontSize: 20 }}>{m.name ?? 'Unnamed'}</b>
              <div style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 700 }}>{m.role}</div>
            </div>
          </div>

          <TeamMemberEditForm member={m} />

          <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <DeleteButton
              onDelete={async () => {
                'use server'
                return await deleteTeamMember(m.id, m.photo)
              }}
              label="Delete member"
              confirmMessage={`Delete "${m.name}" from the team?`}
            />
          </div>
        </div>
      ))}

      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginTop: 32 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Add a team member</h2>
        <TeamMemberForm />
      </div>
    </>
  )
}

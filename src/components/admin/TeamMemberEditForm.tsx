'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTeamMember } from '@/app/actions'
import type { TeamMember } from '@/lib/types'

export default function TeamMemberEditForm({ member }: { member: TeamMember }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const fd = new FormData(e.currentTarget)
    try {
      const res = await updateTeamMember(member.id, fd)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        setSuccess('✓ Saved!')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
      <input type="hidden" name="existing_photo" value={member.photo ?? ''} />
      <label>Name<input name="name" defaultValue={member.name ?? ''} required /></label>
      <label>Role<input name="role" defaultValue={member.role ?? ''} required /></label>
      <label>Bio<textarea name="bio" rows={3} defaultValue={member.bio ?? ''} /></label>
      <label>Change Photo<input name="photo" type="file" accept="image/*" /></label>

      {error && <div style={{ color: '#c0392b', fontSize: 13, margin: '8px 0' }}>{error}</div>}
      {success && <div style={{ color: 'var(--green)', fontSize: 13, margin: '8px 0' }}>{success}</div>}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn sm" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createTeamMember } from '@/app/actions'

export default function TeamMemberForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const fd = new FormData(e.currentTarget)
    try {
      const res = await createTeamMember(fd)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        setSuccess('✓ Team member added successfully!')
        formRef.current?.reset()
        setPreview(null)
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while adding team member.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <label>Full Name<input name="name" required placeholder="e.g. Marie Claire" /></label>
      <label>Role / Position<input name="role" required placeholder="e.g. Executive Pastry Chef" /></label>
      <label>Bio<textarea name="bio" rows={3} placeholder="Background, accomplishments, and culinary focus..." /></label>
      
      <label>
        Member Portrait Photo
        <input name="photo" type="file" accept="image/*" onChange={handleFileChange} />
      </label>

      {preview && (
        <div style={{ margin: '12px 0' }}>
          <img
            src={preview}
            alt="Preview"
            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--amber)' }}
          />
        </div>
      )}

      {error && (
        <div style={{ color: '#c0392b', background: 'rgba(192,57,43,.1)', padding: '12px 16px', borderRadius: 10, margin: '14px 0', fontSize: 14 }}>
          <b>Notice:</b> {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'var(--green)', background: 'rgba(15,61,39,.1)', padding: '12px 16px', borderRadius: 10, margin: '14px 0', fontSize: 14 }}>
          {success}
        </div>
      )}

      <button className="btn sm" type="submit" disabled={loading} style={{ marginTop: 12 }}>
        {loading ? 'Adding member…' : 'Add team member'}
      </button>
    </form>
  )
}

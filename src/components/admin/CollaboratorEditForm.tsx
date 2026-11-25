'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCollaborator } from '@/app/actions'
import type { Collaborator } from '@/lib/types'

export default function CollaboratorEditForm({
  collaborator,
  currentImageUrl,
}: {
  collaborator: Collaborator
  currentImageUrl?: string
}) {
  const router = useRouter()
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
      const res = await updateCollaborator(collaborator.id, fd)
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
      <input type="hidden" name="existing_image" value={collaborator.image ?? ''} />

      <label>
        Collaborator / Organization Name
        <input name="name" defaultValue={collaborator.name ?? ''} placeholder="e.g. Akagera Hospitality Partners" />
      </label>

      <label>
        Caption
        <textarea
          name="caption"
          rows={3}
          defaultValue={collaborator.caption ?? ''}
          placeholder="Caption or description for this collaborator..."
        />
      </label>

      <label>
        Change Image
        <input name="image" type="file" accept="image/*" onChange={handleFileChange} />
      </label>

      {preview ? (
        <div style={{ margin: '10px 0' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>New Image Preview:</div>
          <img
            src={preview}
            alt="Preview"
            style={{ width: 140, height: 90, borderRadius: 10, objectFit: 'cover', border: '2px solid var(--amber)' }}
          />
        </div>
      ) : currentImageUrl ? (
        <div style={{ margin: '10px 0' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Current Image:</div>
          <img
            src={currentImageUrl}
            alt={collaborator.name ?? 'Current'}
            style={{ width: 140, height: 90, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--line)' }}
          />
        </div>
      ) : null}

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

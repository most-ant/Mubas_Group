'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createCollaborator } from '@/app/actions'

export default function CollaboratorForm() {
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
      const res = await createCollaborator(fd)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        setSuccess('✓ Collaborator added successfully!')
        formRef.current?.reset()
        setPreview(null)
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while adding collaborator.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <label>
        Upload Image
        <input name="image" type="file" accept="image/*" required onChange={handleFileChange} />
      </label>

      {preview && (
        <div style={{ margin: '14px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Image Preview:</div>
          <img
            src={preview}
            alt="Preview"
            style={{ width: 180, height: 120, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--amber)' }}
          />
        </div>
      )}

      <label>
        Caption / Note
        <textarea
          name="caption"
          rows={3}
          required
          placeholder="e.g. In partnership with Kigali Culinary Institute for staff training and menu development..."
        />
      </label>

      <label>
        Collaborator / Organization Name (Optional)
        <input name="name" placeholder="e.g. Kigali Culinary Institute" />
      </label>

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
        {loading ? 'Adding collaborator…' : 'Add collaborator'}
      </button>
    </form>
  )
}

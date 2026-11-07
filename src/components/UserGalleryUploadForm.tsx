'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { userUploadGalleryPhoto } from '@/app/actions'

export default function UserGalleryUploadForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

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
    if (!acceptedTerms) {
      setError('You must accept the terms and regulations before sharing your image.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    const fd = new FormData(e.currentTarget)
    fd.append('terms_accepted', 'true')
    try {
      const res = await userUploadGalleryPhoto(fd)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        setSuccess('✓ Photo uploaded successfully! It will appear publicly after admin approval.')
        formRef.current?.reset()
        setPreview(null)
        setAcceptedTerms(false)
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while uploading.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginTop: 32 }}>
      <h3 style={{ fontSize: 22, marginBottom: 6 }}>Share your photo</h3>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
        Upload a photo to the gallery. It will be reviewed by an admin before being published.
      </p>
      <form ref={formRef} onSubmit={handleSubmit}>
        <label>
          Choose Photo (JPEG, PNG, WebP)
          <input name="photo" type="file" accept="image/*" required onChange={handleFileChange} />
        </label>

        {preview && (
          <div style={{ margin: '12px 0' }}>
            <img
              src={preview}
              alt="Upload preview"
              style={{ maxHeight: 180, borderRadius: 10, border: '1px solid var(--line)', objectFit: 'cover' }}
            />
          </div>
        )}

        <label>Caption<input name="caption" placeholder="Describe the photo..." /></label>
        <label>Credit / Photographer<input name="credit" placeholder="e.g. Your name" /></label>

        {/* Terms and Regulations Agreement */}
        <div
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '14px 16px',
            margin: '16px 0',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: 0 }}>
            <input
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--ink)' }}>
              <b>Terms & Regulations:</b> I agree to share this image with <b>Mubas Group</b> and understand that once approved, the image can be used and published by Mubas Group as part of their company portfolio and promotional assets.
            </span>
          </label>
        </div>

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

        <button className="btn sm" type="submit" disabled={loading || !acceptedTerms} style={{ marginTop: 12, opacity: acceptedTerms ? 1 : 0.6 }}>
          {loading ? 'Uploading…' : 'Upload photo'}
        </button>
      </form>
    </div>
  )
}

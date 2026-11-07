'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadGalleryPhoto } from '@/app/actions'

export default function GalleryUploadForm() {
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
      const res = await uploadGalleryPhoto(fd)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        setSuccess('✓ Photo uploaded and added to gallery successfully!')
        formRef.current?.reset()
        setPreview(null)
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while uploading.')
    } finally {
      setLoading(false)
    }
  }

  return (
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

      <label>Caption<input name="caption" placeholder="Description of the space, dish, or event..." /></label>
      <label>Credit / Photographer<input name="credit" placeholder="e.g. Jean Pierre / Mubas Studio" /></label>

      {error && (
        <div style={{ color: '#c0392b', background: 'rgba(192,57,43,.1)', padding: '12px 16px', borderRadius: 10, margin: '14px 0', fontSize: 14 }}>
          <b>Upload Notice:</b> {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'var(--green)', background: 'rgba(15,61,39,.1)', padding: '12px 16px', borderRadius: 10, margin: '14px 0', fontSize: 14 }}>
          {success}
        </div>
      )}

      <button className="btn sm" type="submit" disabled={loading} style={{ marginTop: 12 }}>
        {loading ? 'Uploading photo…' : 'Upload photo'}
      </button>
    </form>
  )
}

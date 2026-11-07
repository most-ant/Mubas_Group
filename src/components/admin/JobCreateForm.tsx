'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createJob } from '@/app/actions'

export default function JobCreateForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
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
      const res = await createJob(fd)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        setSuccess('✓ Job created successfully!')
        formRef.current?.reset()
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while posting the job.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <label>Title<input name="title" required placeholder="e.g. Sous Chef / Site Engineer" /></label>
      <label>Type<input name="type" placeholder="Full-time / Part-time / Contract" /></label>
      <label>Location<input name="location" placeholder="Kigali, Rwanda" /></label>
      <label>Deadline<input name="deadline" type="date" /></label>
      <label>Description<textarea name="description" rows={5} required placeholder="Job responsibilities, requirements, and qualifications..." /></label>

      {error && (
        <div style={{ color: '#c0392b', background: 'rgba(192,57,43,.1)', padding: '12px 16px', borderRadius: 10, margin: '14px 0', fontSize: 14 }}>
          <b>Error:</b> {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'var(--green)', background: 'rgba(15,61,39,.1)', padding: '12px 16px', borderRadius: 10, margin: '14px 0', fontSize: 14 }}>
          {success}
        </div>
      )}

      <button className="btn sm" type="submit" disabled={loading} style={{ marginTop: 12 }}>
        {loading ? 'Creating job…' : 'Create job'}
      </button>
    </form>
  )
}

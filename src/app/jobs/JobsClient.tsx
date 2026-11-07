'use client'
import { useState } from 'react'
import Link from 'next/link'
import { submitApplication } from '@/app/actions'
import type { Job } from '@/lib/types'

export default function JobsClient({ jobs }: { jobs: Job[]; admin: boolean }) {
  const [active, setActive] = useState<Job | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function openApplyModal(j: Job) {
    setActive(j)
    setStatus('idle')
    setErrorMessage('')
  }

  function closeModal() {
    setActive(null)
    setStatus('idle')
    setErrorMessage('')
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!active) return
    setStatus('sending')
    setErrorMessage('')

    const fd = new FormData(e.currentTarget)
    fd.append('job_id', active.id)
    fd.append('job_title', active.title)

    try {
      const r = await submitApplication(fd)
      if (r && 'error' in r && r.error) {
        setStatus('error')
        setErrorMessage(r.error)
      } else {
        setStatus('sent')
      }
    } catch (err: unknown) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="wrap" style={{ paddingBottom: 60 }}>
      <div className="head">
        <h2>Jobs at Mubas Group</h2>
        <p>{jobs.length} open position{jobs.length === 1 ? '' : 's'}</p>
      </div>

      <div className="row" style={{ marginBottom: 32, alignItems: 'center' }}>
        <span>Interested in future opportunities or managing listings?</span>
        <Link href="/signup" className="btn sm">Sign up</Link>
        <Link href="/login" className="btn sm out">Sign in</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="empty">No positions open at the moment. Please check back later.</div>
      ) : (
        jobs.map((j) => (
          <article key={j.id} className="job">
            <h3>{j.title}</h3>
            <div className="meta">
              {[j.type, j.location, j.deadline && `Apply by ${j.deadline}`].filter(Boolean).join(' · ')}
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{j.description}</p>
            <button className="btn sm" type="button" onClick={() => openApplyModal(j)}>Apply now</button>
          </article>
        ))
      )}

      {active && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,12,8,.7)', zIndex: 100, padding: 20, overflow: 'auto' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div style={{ background: 'var(--card)', padding: 28, borderRadius: 18, maxWidth: 520, margin: '80px auto' }}>
            {status === 'sent' ? (
              <>
                <h3>Application sent ✓</h3>
                <p>Thank you for applying. We will be in touch if your profile is shortlisted.</p>
                <button className="btn sm" type="button" onClick={closeModal}>Close</button>
              </>
            ) : (
              <form onSubmit={onSubmit}>
                <h3>Apply: {active.title}</h3>
                <label>Full name<input name="name" required placeholder="Jane Doe" /></label>
                <label>Email<input type="email" name="email" required placeholder="jane@example.com" /></label>
                <label>Phone<input name="phone" placeholder="+250 788 000 000" /></label>
                <label>Tell us about yourself and your experience<textarea name="message" rows={4} required placeholder="Why are you a great fit for this position?" /></label>
                {status === 'error' && (
                  <p style={{ color: '#c0392b', fontSize: 14 }}>{errorMessage || 'Something went wrong. Please check your details and try again.'}</p>
                )}
                <div className="row" style={{ marginTop: 16 }}>
                  <button className="btn sm" type="submit" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Send application'}
                  </button>
                  <button type="button" className="btn sm out" onClick={closeModal}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

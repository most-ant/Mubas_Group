'use client'
import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions'

export default function SignupPage() {
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(formData: FormData) {
    setLoading(true)
    setMessage('')
    setIsError(false)

    try {
      const result = await signup(formData)
      if (result && 'error' in result && result.error) {
        setIsError(true)
        setMessage(result.error)
      } else {
        setIsError(false)
        setMessage('Account created! Please check your email to confirm your address, then sign in.')
      }
    } catch {
      // If redirected, Next.js handles it
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 24 }}>
      <form action={onSubmit} style={{ background: 'var(--card)', padding: 40, borderRadius: 20, width: '100%', maxWidth: 400, border: '1px solid var(--line)' }}>
        <h2 style={{ marginBottom: 24 }}>Create an account</h2>
        <label style={{ display: 'block', marginBottom: 16 }}>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>
          Password
          <input name="password" type="password" minLength={8} required autoComplete="new-password" />
        </label>
        {message && (
          <p
            role="status"
            style={{
              color: isError ? '#c0392b' : 'var(--green)',
              fontSize: 14,
              margin: '8px 0 16px',
              padding: '10px 14px',
              background: isError ? 'rgba(192,57,43,.08)' : 'rgba(15,61,39,.08)',
              borderRadius: 8,
            }}
          >
            {message}
          </p>
        )}
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <p style={{ marginTop: 18, fontSize: 14 }}>
          Already registered? <Link href="/login" style={{ color: 'var(--green)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </div>
  )
}

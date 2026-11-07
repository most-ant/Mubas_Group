'use client'
import { useState, Suspense } from 'react'
import { login } from '@/app/actions'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const [err, setErr] = useState(
    errorParam === 'confirmation'
      ? 'Email confirmation link was invalid or has expired. Please sign in or request a new link.'
      : ''
  )
  const [loading, setLoading] = useState(false)

  async function onSubmit(fd: FormData) {
    setLoading(true)
    setErr('')
    try {
      const r = await login(fd)
      if (r?.error) {
        setErr(r.error)
      }
    } catch {
      // In Next.js, redirect() throws an internal NEXT_REDIRECT error which should be handled by Next
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={onSubmit} style={{ background: 'var(--card)', padding: 40, borderRadius: 20, width: '100%', maxWidth: 400, border: '1px solid var(--line)' }}>
      <h2 style={{ marginBottom: 24 }}>Sign in</h2>
      <label style={{ display: 'block', marginBottom: 16 }}>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label style={{ display: 'block', marginBottom: 16 }}>
        Password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {err && <p style={{ color: '#c0392b', fontSize: 14, margin: '8px 0 16px' }}>{err}</p>}
      <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <p style={{ marginTop: 18, fontSize: 14 }}>
        New here? <Link href="/signup" style={{ color: 'var(--green)', fontWeight: 600 }}>Create a regular account</Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 24 }}>
      <Suspense fallback={<div style={{ color: 'var(--muted)' }}>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

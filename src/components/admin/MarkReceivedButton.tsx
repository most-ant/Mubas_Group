'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markApplicationReceived } from '@/app/actions'

export default function MarkReceivedButton({ id, currentStatus }: { id: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (currentStatus === 'received') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15,61,39,.1)',
          color: 'var(--green, #0f3d27)',
          fontSize: 13,
          fontWeight: 700,
          padding: '6px 14px',
          borderRadius: 999,
        }}
      >
        ✓ Received
      </span>
    )
  }

  async function handleClick() {
    setLoading(true)
    setError('')
    try {
      const res = await markApplicationReceived(id)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn sm"
        onClick={handleClick}
        disabled={loading}
        style={{ background: 'var(--green, #0f3d27)', color: '#fff', fontSize: 13 }}
      >
        {loading ? 'Marking…' : '📋 Mark as Received'}
      </button>
      {error && <div style={{ color: '#c0392b', fontSize: 12, marginTop: 4 }}>{error}</div>}
    </>
  )
}

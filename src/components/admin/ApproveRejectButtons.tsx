'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveGalleryPhoto, rejectGalleryPhoto } from '@/app/actions'

export default function ApproveRejectButtons({ id, asset }: { id: string; asset: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState('')

  async function handleApprove() {
    setLoading('approve')
    setError('')
    try {
      const res = await approveGalleryPhoto(id)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve.')
    } finally {
      setLoading(null)
    }
  }

  async function handleReject() {
    if (!confirm('Reject and delete this photo submission?')) return
    setLoading('reject')
    setError('')
    try {
      const res = await rejectGalleryPhoto(id, asset)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <button
        className="btn sm"
        type="button"
        onClick={handleApprove}
        disabled={loading !== null}
        style={{ background: 'var(--green)', color: '#fff', fontSize: 13 }}
      >
        {loading === 'approve' ? 'Approving…' : '✓ Approve'}
      </button>
      <button
        className="btn sm out"
        type="button"
        onClick={handleReject}
        disabled={loading !== null}
        style={{ color: '#c0392b', borderColor: '#c0392b', fontSize: 13 }}
      >
        {loading === 'reject' ? 'Rejecting…' : '✕ Reject'}
      </button>
      {error && (
        <div style={{ color: '#c0392b', fontSize: 12, marginTop: 4, width: '100%' }}>{error}</div>
      )}
    </>
  )
}

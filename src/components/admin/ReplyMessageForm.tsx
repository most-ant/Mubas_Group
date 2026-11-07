'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { replyToMessage } from '@/app/actions'

export default function ReplyMessageForm({ id, existingReply }: { id: string; existingReply: string | null }) {
  const router = useRouter()
  const [reply, setReply] = useState(existingReply ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const res = await replyToMessage(id, reply)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reply.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={2}
        placeholder="Type your reply…"
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid var(--line)',
          borderRadius: 10,
          fontSize: 14,
          fontFamily: 'inherit',
          background: 'var(--bg)',
          color: 'var(--ink)',
          resize: 'vertical',
          marginTop: 0,
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <button
          type="submit"
          className="btn sm"
          disabled={loading || !reply.trim()}
          style={{ fontSize: 13 }}
        >
          {loading ? 'Sending…' : existingReply ? 'Update reply' : 'Send reply'}
        </button>
        {error && <span style={{ color: '#c0392b', fontSize: 12 }}>{error}</span>}
        {success && <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 700 }}>✓ Replied</span>}
      </div>
    </form>
  )
}

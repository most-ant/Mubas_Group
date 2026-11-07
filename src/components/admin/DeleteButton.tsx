'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteButton({
  onDelete,
  label = 'Delete',
  confirmMessage = 'Are you sure you want to delete this item?',
}: {
  onDelete: () => Promise<{ error?: string } | { success?: boolean } | void>
  label?: string
  confirmMessage?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return
    setLoading(true)
    setError('')
    try {
      const res = await onDelete()
      if (res && typeof res === 'object' && 'error' in res && res.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <button className="btn sm del" type="button" disabled={loading} onClick={handleClick}>
        {loading ? 'Deleting…' : label}
      </button>
      {error && <span style={{ color: '#c0392b', fontSize: 13 }}>{error}</span>}
    </div>
  )
}

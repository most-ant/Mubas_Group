'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { sendMessage } from '@/app/actions'
import type { Message } from '@/lib/types'

export default function MessageWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    loadMessages()
  }, [open])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  async function loadMessages() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSending(true)
    setError('')
    setSuccess('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await sendMessage(fd)
      if (res && 'error' in res && res.error) {
        setError(res.error)
      } else {
        setSuccess('Message sent!')
        formRef.current?.reset()
        await loadMessages()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating chat button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Open messaging"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--green, #0f3d27)',
          color: '#fff',
          border: 'none',
          fontSize: 26,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,.3)',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform .2s',
          transform: open ? 'rotate(45deg)' : 'none',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 92,
            right: 24,
            width: 370,
            maxHeight: 500,
            background: 'var(--card, #fff)',
            border: '1px solid var(--line, #ddd)',
            borderRadius: 18,
            boxShadow: '0 12px 50px rgba(0,0,0,.25)',
            zIndex: 91,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'var(--green, #0f3d27)',
              color: '#fff',
              padding: '16px 20px',
              fontWeight: 700,
              fontSize: 16,
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            💬 Message Mubas Group
          </div>

          {/* Messages */}
          <div
            ref={chatRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              minHeight: 200,
              maxHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20, fontSize: 14 }}>Loading…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 20, fontSize: 14 }}>
                No messages yet. Start a conversation!
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id}>
                  {/* User message */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                    <div
                      style={{
                        background: 'var(--green, #0f3d27)',
                        color: '#fff',
                        padding: '10px 14px',
                        borderRadius: '14px 14px 4px 14px',
                        maxWidth: '85%',
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                    {new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Admin reply */}
                  {m.admin_reply && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 4 }}>
                        <div
                          style={{
                            background: 'rgba(232,150,46,.12)',
                            color: 'var(--ink, #000)',
                            padding: '10px 14px',
                            borderRadius: '14px 14px 14px 4px',
                            maxWidth: '85%',
                            fontSize: 14,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            border: '1px solid rgba(232,150,46,.25)',
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>Mubas Group</div>
                          {m.admin_reply}
                        </div>
                      </div>
                      {m.replied_at && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                          {new Date(m.replied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--line, #ddd)',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
            }}
          >
            <textarea
              name="content"
              required
              rows={2}
              placeholder="Type a message…"
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid var(--line, #ddd)',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 14,
                fontFamily: 'inherit',
                background: 'var(--bg, #f4f7f3)',
                color: 'var(--ink, #000)',
                margin: 0,
              }}
            />
            <button
              type="submit"
              disabled={sending}
              style={{
                background: 'var(--green, #0f3d27)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 700,
                cursor: sending ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {sending ? '…' : 'Send'}
            </button>
          </form>

          {error && (
            <div style={{ padding: '8px 16px', color: '#c0392b', fontSize: 13, background: 'rgba(192,57,43,.08)' }}>{error}</div>
          )}
          {success && (
            <div style={{ padding: '8px 16px', color: 'var(--green)', fontSize: 13, background: 'rgba(15,61,39,.08)' }}>{success}</div>
          )}
        </div>
      )}
    </>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { sendMessage } from '@/app/actions'
import type { Message } from '@/lib/types'

export default function HomeMessageSection({ signedIn }: { signedIn: boolean }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!signedIn) return
    loadMessages()
  }, [signedIn])

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
        setSuccess('✓ Message sent successfully! Mubas Group team will review and reply.')
        formRef.current?.reset()
        await loadMessages()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="messages" style={{ padding: '60px 0', background: 'var(--bg)' }}>
      <div className="wrap">
        <div style={{ maxWidth: 840, margin: '0 auto', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 24, padding: '36px 32px', boxShadow: '0 10px 30px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>💬</span>
            <h2 style={{ fontSize: 32, margin: 0 }}>Message Mubas Group</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 16, marginTop: 4, marginBottom: 24 }}>
            Direct communication channel with our leadership and management team.
          </p>

          {!signedIn ? (
            <div style={{ background: 'rgba(15,61,39,.06)', border: '1px solid rgba(15,61,39,.18)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 16, marginBottom: 16, color: 'var(--ink)' }}>
                Please sign in to your account to send direct messages to the company and track replies.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" className="btn sm">Sign in to message</Link>
                <Link href="/signup" className="btn sm out">Create an account</Link>
              </div>
            </div>
          ) : (
            <div>
              {/* Previous messages thread */}
              {messages.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 12 }}>
                    Your Conversation History
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 320, overflowY: 'auto', padding: '12px 4px' }}>
                    {messages.map((m) => (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* User message */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div
                            style={{
                              background: 'var(--green)',
                              color: '#fff',
                              borderRadius: '16px 16px 4px 16px',
                              padding: '12px 18px',
                              maxWidth: '85%',
                              fontSize: 15,
                              lineHeight: 1.5,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {m.content}
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 4, textAlign: 'right' }}>
                              {new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Admin reply */}
                        {m.admin_reply ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <div
                              style={{
                                background: 'rgba(232,150,46,.12)',
                                border: '1px solid rgba(232,150,46,.3)',
                                borderRadius: '16px 16px 16px 4px',
                                padding: '12px 18px',
                                maxWidth: '85%',
                                fontSize: 15,
                                lineHeight: 1.5,
                                color: 'var(--ink)',
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>
                                🛡️ Mubas Group Admin Response
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{m.admin_reply}</div>
                              {m.replied_at && (
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                                  {new Date(m.replied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'left', paddingLeft: 8 }}>
                            ⏳ Awaiting response from Mubas Group…
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading && messages.length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>Loading messages…</div>
              )}

              {/* Message form */}
              <form ref={formRef} onSubmit={handleSubmit}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  Type your message
                  <textarea
                    name="content"
                    required
                    rows={3}
                    placeholder="Write your questions, inquiries, or feedback here…"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--line)',
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 15,
                      fontFamily: 'inherit',
                      marginTop: 6,
                      resize: 'vertical',
                    }}
                  />
                </label>

                {error && (
                  <div style={{ color: '#c0392b', background: 'rgba(192,57,43,.1)', padding: '10px 14px', borderRadius: 8, margin: '12px 0', fontSize: 14 }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div style={{ color: 'var(--green)', background: 'rgba(15,61,39,.1)', padding: '10px 14px', borderRadius: 8, margin: '12px 0', fontSize: 14 }}>
                    {success}
                  </div>
                )}

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn sm" type="submit" disabled={sending}>
                    {sending ? 'Sending message…' : 'Send message →'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

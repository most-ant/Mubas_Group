import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function AdminHome() {
  const s = await createClient()
  const [jobs, team, gal, apps, msgs] = await Promise.all([
    s.from('jobs').select('*', { count: 'exact', head: true }),
    s.from('team').select('*', { count: 'exact', head: true }),
    s.from('gallery').select('*', { count: 'exact', head: true }),
    s.from('applications').select('*', { count: 'exact', head: true }),
    s.from('messages').select('*', { count: 'exact', head: true }),
  ])
  const cards = [
    { label: 'Jobs', value: jobs.count ?? 0, href: '/admin/jobs' },
    { label: 'Team', value: team.count ?? 0, href: '/admin/team' },
    { label: 'Photos', value: gal.count ?? 0, href: '/admin/gallery' },
    { label: 'Applications', value: apps.count ?? 0, href: '/admin/applications' },
    { label: 'Messages', value: msgs.count ?? 0, href: '/admin/messages' },
  ]
  return (
    <>
      <h1 style={{ fontSize: 42, marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, textDecoration: 'none', color: 'var(--ink)' }}>
            <div style={{ fontSize: 44, fontFamily: 'Cormorant Garamond, serif' }}>{c.value}</div>
            <div style={{ color: 'var(--muted)' }}>{c.label}</div>
          </Link>
        ))}
      </div>
    </>
  )
}

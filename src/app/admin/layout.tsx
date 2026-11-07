import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions'

export const instant = false

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) redirect('/login')
  if (!(await isAdmin(s, user.id))) redirect('/')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ background: 'var(--green)', color: '#fff', padding: '16px 28px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', position: 'static' }}>
        <b style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, marginRight: 8 }}>Mubas Admin</b>
        <Link href="/admin" style={{ color: '#f3efe6', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
        <Link href="/admin/jobs" style={{ color: '#f3efe6', textDecoration: 'none', fontWeight: 500 }}>Jobs</Link>
        <Link href="/admin/team" style={{ color: '#f3efe6', textDecoration: 'none', fontWeight: 500 }}>Team</Link>
        <Link href="/admin/gallery" style={{ color: '#f3efe6', textDecoration: 'none', fontWeight: 500 }}>Gallery</Link>
        <Link href="/admin/applications" style={{ color: '#f3efe6', textDecoration: 'none', fontWeight: 500 }}>Applications</Link>
        <Link href="/admin/messages" style={{ color: '#f3efe6', textDecoration: 'none', fontWeight: 500 }}>Messages</Link>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--amber)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>View site →</Link>
          <form action={logout} style={{ margin: 0 }}>
            <button className="btn sm ghost" type="submit" style={{ padding: '6px 14px', fontSize: 13 }}>Log out</button>
          </form>
        </div>
      </nav>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
    </div>
  )
}

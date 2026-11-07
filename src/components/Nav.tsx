'use client'
import { useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions'
import NotificationBell from '@/components/NotificationBell'

export default function Nav({ admin, signedIn = admin }: { admin: boolean; signedIn?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header>
      <nav className="solid">
        <Link href="/" className="plate" style={{ textDecoration: 'none' }}>
          <img src="/logo.png" alt="Mubas Group" style={{ height: 38, width: 'auto', display: 'block' }} />
        </Link>

        <ul>
          <li><Link href="/#services">Services</Link></li>
          <li><Link href="/#work">Work</Link></li>
          <li><Link href="/#chef">Our Chef</Link></li>
          <li><Link href="/#team">Team</Link></li>
          <li><Link href="/#gallery">Gallery</Link></li>
          <li><Link href="/jobs">Jobs</Link></li>
        </ul>

        <div className="row" style={{ alignItems: 'center' }}>
          {signedIn && <NotificationBell />}

          <div className="nav-actions-desktop" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {admin ? (
              <>
                <Link href="/admin" className="btn sm ghost">Admin</Link>
                <form action={logout} style={{ margin: 0 }}>
                  <button className="btn sm ghost" type="submit">Log out</button>
                </form>
              </>
            ) : signedIn ? (
              <form action={logout} style={{ margin: 0 }}>
                <button className="btn sm ghost" type="submit">Log out</button>
              </form>
            ) : (
              <>
                <Link href="/login" className="btn sm ghost">Sign in</Link>
                <Link href="/jobs" className="btn sm">Join us</Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,.3)',
              borderRadius: 8,
              color: '#fff',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'none',
              fontSize: 18,
            }}
            className="mobile-toggle"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            background: 'rgba(15,61,39,.98)',
            backdropFilter: 'blur(10px)',
            padding: 24,
            zIndex: 19,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            borderBottom: '1px solid rgba(255,255,255,.15)',
          }}
          className="mobile-menu"
        >
          <Link href="/#services" onClick={() => setMenuOpen(false)} style={{ color: '#f3efe6', textDecoration: 'none', fontSize: 18 }}>Services</Link>
          <Link href="/#work" onClick={() => setMenuOpen(false)} style={{ color: '#f3efe6', textDecoration: 'none', fontSize: 18 }}>Work</Link>
          <Link href="/#chef" onClick={() => setMenuOpen(false)} style={{ color: '#f3efe6', textDecoration: 'none', fontSize: 18 }}>Our Chef</Link>
          <Link href="/#team" onClick={() => setMenuOpen(false)} style={{ color: '#f3efe6', textDecoration: 'none', fontSize: 18 }}>Team</Link>
          <Link href="/#gallery" onClick={() => setMenuOpen(false)} style={{ color: '#f3efe6', textDecoration: 'none', fontSize: 18 }}>Gallery</Link>
          <Link href="/jobs" onClick={() => setMenuOpen(false)} style={{ color: '#f3efe6', textDecoration: 'none', fontSize: 18 }}>Jobs</Link>
          {signedIn && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: '#f3efe6', fontSize: 16 }}>Notifications</span>
              <NotificationBell />
            </div>
          )}
          <hr style={{ borderColor: 'rgba(255,255,255,.2)', margin: '8px 0' }} />
          {admin ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="btn sm ghost">Admin Dashboard</Link>
              <form action={logout} style={{ margin: 0 }}>
                <button className="btn sm ghost" type="submit">Log out</button>
              </form>
            </div>
          ) : signedIn ? (
            <form action={logout} style={{ margin: 0 }}>
              <button className="btn sm ghost" type="submit">Log out</button>
            </form>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="btn sm ghost">Sign in</Link>
              <Link href="/jobs" onClick={() => setMenuOpen(false)} className="btn sm">Join us</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

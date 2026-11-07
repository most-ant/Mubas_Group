import Link from 'next/link'
import CurrentYear from '@/components/CurrentYear'

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="plate">
          <img src="/logo.png" alt="Mubas Group" />
        </div>
        <div>© <CurrentYear /> Mubas Group. All rights reserved.</div>
        <div className="row">
          <Link href="/jobs">Jobs</Link>
          <Link href="/login">Admin</Link>
        </div>
      </div>
    </footer>
  )
}
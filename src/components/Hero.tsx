import Link from 'next/link'

export default function Hero() {
  return (
    <header className="hero">
      <div className="wrap">
        <h1>Mubas<br />Group</h1>
        <div className="tag">Hospitality, built and run with heart.</div>
        <p>Chef-led hospitality services and construction of hospitality assets — from concept to opening day.</p>
        <div className="cta">
          <Link href="/#services" className="btn">Our services</Link>
          <Link href="/jobs" className="btn ghost">Work with us</Link>
        </div>
      </div>
    </header>
  )
}

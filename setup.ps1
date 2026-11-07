# =========================================================
#  Mubas Group — Next.js + Supabase full project setup
#  Run from the project root AFTER:
#    npx create-next-app@latest mubas-group --typescript --eslint --src-dir --app --no-tailwind
#    cd mubas-group
#    npm install @supabase/supabase-js @supabase/ssr
# =========================================================

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot "package.json")) -or
    -not (Test-Path -LiteralPath (Join-Path $PSScriptRoot "src\app") -PathType Container)) {
  throw "Run setup.ps1 from a project containing package.json and src\app."
}
Set-Location -LiteralPath $PSScriptRoot

Write-Host "🧹 Cleaning defaults..." -ForegroundColor Cyan
Remove-Item -Force -ErrorAction SilentlyContinue src\app\page.tsx
Remove-Item -Force -ErrorAction SilentlyContinue src\app\layout.tsx
Remove-Item -Force -ErrorAction SilentlyContinue src\app\globals.css
Remove-Item -Force -ErrorAction SilentlyContinue src\app\favicon.ico

Write-Host "📁 Creating folders..." -ForegroundColor Cyan
$dirs = @(
  "src\utils\supabase","src\lib","src\components",
  "src\app\jobs","src\app\login","src\app\signup","src\app\auth\callback",
  "src\app\admin\jobs","src\app\admin\team",
  "src\app\admin\gallery","src\app\admin\applications"
)
$dirs | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ | Out-Null }

function WriteFile($path, $content) {
  $parent = Split-Path -Parent $path
  if ($parent -and -not (Test-Path -LiteralPath $parent -PathType Container)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
  }
  $content | Out-File -LiteralPath $path -Encoding utf8 -NoNewline
  Write-Host "  ✓ $path" -ForegroundColor DarkGray
}

# =========================================================
#  ROOT FILES
# =========================================================

Write-Host "⚙️  Writing root files..." -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath ".env.local")) {
  WriteFile ".env.local" @'
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
'@
} else {
  Write-Host "  Keeping existing .env.local" -ForegroundColor DarkGray
}

WriteFile "src\proxy.ts" @'
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
'@

# =========================================================
#  SUPABASE CLIENTS
# =========================================================

Write-Host "🔌 Writing Supabase clients..." -ForegroundColor Cyan

WriteFile "src\utils\supabase\client.ts" @'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
'@

WriteFile "src\utils\supabase\server.ts" @'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
'@

WriteFile "src\utils\supabase\middleware.ts" @'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return response
}
'@

# =========================================================
#  TYPES
# =========================================================

WriteFile "src\lib\types.ts" @'
export type TeamMember = { id: string; name: string | null; role: string | null; bio: string | null; photo: string | null }
export type Job = { id: string; title: string; type: string | null; location: string | null; deadline: string | null; description: string | null; created_at: string }
export type GalleryItem = { id: string; asset: string | null; caption: string | null; credit: string | null; is_official: boolean; created_at: string }
export type Application = { id: string; name: string; email: string; phone: string | null; job_id: string; job_title: string; message: string; created_at: string }
'@

WriteFile "src\lib\auth.ts" @'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function isAdmin(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Could not verify account role: ${error.message}`)
  return data?.role === 'admin'
}
'@

# =========================================================
#  GLOBALS CSS (design tokens from original HTML)
# =========================================================

Write-Host "🎨 Writing globals.css..." -ForegroundColor Cyan

WriteFile "src\app\globals.css" @'
:root{--bg:#f4f7f3;--ink:#10261b;--muted:#51645a;--green:#0f3d27;--blue:#1b3fa0;--amber:#e8962e;--card:#ffffff;--line:#d7e0d9}
@media (prefers-color-scheme:dark){:root{--bg:#0c1511;--ink:#e9f0ea;--muted:#9bb0a3;--card:#13211a;--line:#24362b}}
html{scroll-padding-top:80px;scroll-behavior:smooth}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:Manrope,system-ui,sans-serif;line-height:1.65}
h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;line-height:1.05;margin:0;font-weight:600}
a{color:inherit}
:focus-visible{outline:3px solid var(--amber);outline-offset:3px}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}
nav{position:fixed;top:0;left:0;right:0;z-index:20;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:14px}
nav.solid{background:rgba(15,61,39,.94);backdrop-filter:blur(8px)}
.plate{background:#fff;border-radius:12px;padding:5px 12px;display:flex;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.plate img{height:42px;width:auto;display:block}
nav ul{display:flex;gap:28px;list-style:none;margin:0;padding:0}
nav ul a{text-decoration:none;color:#f3efe6;font-size:15px;font-weight:500}
nav ul a:hover{color:var(--amber)}
.btn{display:inline-block;padding:13px 26px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;background:var(--amber);color:#2a1700;border:2px solid var(--amber);cursor:pointer;font-family:inherit}
.btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.55)}
.btn.sm{padding:9px 18px;font-size:14px}
.btn.out{background:transparent;color:var(--ink);border-color:var(--line)}
.btn.del{background:transparent;color:#c0392b;border-color:currentColor}
.btn:hover{filter:brightness(1.08)}
.hero{position:relative;min-height:100vh;background:#070d0a;color:#fff;overflow:hidden;display:flex;align-items:center}
.hero canvas{position:absolute;inset:0;width:100%;height:100%}
.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,13,10,.85) 0%,rgba(7,13,10,.35) 45%,rgba(7,13,10,.1) 100%);pointer-events:none}
.hero .wrap{position:relative;z-index:2;padding-top:110px;padding-bottom:140px;width:100%}
.hero h1{font-size:clamp(52px,10vw,128px)}
.hero .tag{font-family:'Cormorant Garamond',serif;font-size:clamp(20px,3vw,32px);color:#f5c37a;margin:14px 0 18px}
.hero p{max-width:540px;font-size:18px;color:#e4ebe6;margin:0 0 28px}
.hero .cta{display:flex;gap:14px;flex-wrap:wrap}
section{padding:96px 0}
.head{max-width:640px;margin-bottom:48px}
.head h2{font-size:clamp(36px,5vw,58px)}
.head p{color:var(--muted);margin:14px 0 0;font-size:17px}
.services{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.svc{border-radius:20px;padding:40px 36px;color:#fff}
.svc.a{background:var(--green)}
.svc.b{background:var(--blue)}
.svc h3{font-size:38px;margin-bottom:12px}
.svc p{margin:0 0 22px;color:rgba(255,255,255,.85)}
.svc ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.svc li{padding-left:22px;position:relative}
.svc li:before{content:"";position:absolute;left:0;top:.7em;width:10px;height:2px;background:var(--amber)}
.work{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.tile{border-radius:16px;min-height:300px;padding:22px;display:flex;flex-direction:column;justify-content:flex-end;color:#fff;position:relative;overflow:hidden}
.tile:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(0,0,0,.72))}
.tile *{position:relative}
.tile h3{font-size:26px}
.tile span{font-size:14px;color:rgba(255,255,255,.8)}
.t1{background:radial-gradient(circle at 70% 25%,#2f6b4c,#0f3d27 70%)}
.t2{background:radial-gradient(circle at 30% 20%,#e8962e,#7a3a0a 75%)}
.t3{background:radial-gradient(circle at 70% 30%,#3d63c9,#14296d 75%)}
.t4{background:radial-gradient(circle at 30% 30%,#8a7a5c,#2e281c 75%)}
.chef{display:grid;grid-template-columns:380px 1fr;gap:56px;align-items:center}
.chef img{width:100%;border-radius:20px;display:block;aspect-ratio:4/5;object-fit:cover;object-position:top;box-shadow:0 18px 50px rgba(0,0,0,.25)}
.chef h2{font-size:clamp(34px,4.5vw,52px);margin-bottom:16px}
.chef p{color:var(--muted);max-width:56ch;font-size:17px}
.facts{display:flex;gap:28px;flex-wrap:wrap;margin-top:26px;padding-top:22px;border-top:1px solid var(--line)}
.facts b{display:block;font-family:'Cormorant Garamond',serif;font-size:26px;color:var(--green)}
.facts small{color:var(--muted)}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.step{border-top:3px solid var(--amber);padding-top:16px}
.step h3{font-size:26px;margin-bottom:6px}
.step p{margin:0;color:var(--muted);font-size:15px}
.contact{background:var(--green);color:#fff;border-radius:24px;padding:56px 44px;display:flex;justify-content:space-between;gap:32px;flex-wrap:wrap;align-items:center}
.contact h2{font-size:clamp(34px,4.5vw,54px);max-width:14ch}
.contact p{margin:6px 0;color:rgba(255,255,255,.85)}
footer{padding:36px 0 48px;color:var(--muted);font-size:14px}
footer .wrap{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
footer .plate{box-shadow:0 0 0 1px var(--line)}
.team{display:grid;grid-template-columns:repeat(5,1fr);gap:18px}
.member{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px 18px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.avatar{width:104px;height:104px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,var(--green),var(--blue));display:grid;place-items:center;color:#fff;font:600 34px 'Cormorant Garamond',serif;margin-bottom:8px}
.avatar img{width:100%;height:100%;object-fit:cover}
.member h3{font-size:24px}
.member em{font-style:normal;color:var(--amber);font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.06em}
.member p{margin:4px 0 8px;color:var(--muted);font-size:14px}
.gal{columns:3 240px;column-gap:16px}
.gal figure{margin:0 0 16px;break-inside:avoid;position:relative;border-radius:14px;overflow:hidden;background:var(--card)}
.gal img{width:100%;display:block}
.gal figcaption{padding:10px 14px;font-size:14px;color:var(--muted)}
.chip{position:absolute;top:10px;left:10px;background:var(--green);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px}
.chip.g{background:var(--amber);color:#2a1700}
.empty{color:var(--muted);padding:28px;border:1px dashed var(--line);border-radius:14px;text-align:center}
.job{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px;margin-bottom:16px}
.job h3{font-size:30px}
.job .meta{color:var(--amber);font-weight:700;font-size:14px;margin:4px 0 10px}
.job p{margin:0 0 16px;color:var(--muted);white-space:pre-wrap}
.row{display:flex;gap:10px;flex-wrap:wrap}
.admin-input{display:block;width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:inherit}
label{display:block;font-weight:700;font-size:14px;margin:12px 0}
input,textarea,select{display:block;width:100%;margin-top:5px;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:inherit;font-weight:400}
@media (max-width:900px){.services,.chef{grid-template-columns:1fr}.work,.steps{grid-template-columns:1fr 1fr}.chef img{max-width:360px}nav ul{display:none}section{padding:72px 0}.team{grid-template-columns:repeat(2,1fr)}}
@media (max-width:520px){.work,.steps{grid-template-columns:1fr}.svc{padding:30px 24px}.contact{padding:36px 26px}.team{grid-template-columns:1fr}}
'@

# =========================================================
#  APP LAYOUT + HOMEPAGE
# =========================================================

Write-Host "🏠 Writing layout + page..." -ForegroundColor Cyan

WriteFile "src\app\layout.tsx" @'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mubas Group | Hospitality and Construction',
  description: 'Chef-led hospitality services and construction of hospitality assets.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
'@

WriteFile "src\app\page.tsx" @'
import { createClient } from '@/utils/supabase/server'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Work from '@/components/Work'
import Chef from '@/components/Chef'
import TeamGrid from '@/components/TeamGrid'
import GalleryGrid from '@/components/GalleryGrid'
import Steps from '@/components/Steps'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import { isAdmin } from '@/lib/auth'

export const instant = false

export default async function HomePage() {
  const supabase = await createClient()
  const [{ data: team }, { data: gallery }] = await Promise.all([
    supabase.from('team').select('*').order('id'),
    supabase.from('gallery').select('*').order('created_at', { ascending: false }),
  ])
  const { data: { user } } = await supabase.auth.getUser()
  const admin = user ? await isAdmin(supabase, user.id) : false
  const getImageUrl = (p: string | null) =>
    p ? supabase.storage.from('gallery').getPublicUrl(p).data.publicUrl : ''

  return (
    <>
      <Nav admin={admin} signedIn={!!user} />
      <Hero />
      <main>
        <Services />
        <Work />
        <Chef />
        <TeamGrid team={team ?? []} admin={admin} getImageUrl={getImageUrl} />
        <GalleryGrid gallery={gallery ?? []} admin={admin} getImageUrl={getImageUrl} />
        <Steps />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
'@

# =========================================================
#  SERVER ACTIONS
# =========================================================

Write-Host "🛠  Writing actions..." -ForegroundColor Cyan

WriteFile "src\app\actions.ts" @'
'use server'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(fd: FormData) {
  const s = await createClient()
  const { data, error } = await s.auth.signInWithPassword({
    email: fd.get('email') as string,
    password: fd.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect(await isAdmin(s, data.user.id) ? '/admin' : '/')
}

export async function signup(fd: FormData) {
  const email = fd.get('email')
  const password = fd.get('password')
  if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
    return { error: 'Enter a valid email and a password with at least 8 characters.' }
  }

  const origin = (await headers()).get('origin')
  const s = await createClient()
  const { data, error } = await s.auth.signUp({
    email,
    password,
    ...(origin ? { options: { emailRedirectTo: `${origin}/auth/callback` } } : {}),
  })
  if (error) return { error: error.message }
  if (data.session) redirect('/')
  return { success: true }
}

export async function logout() {
  const s = await createClient()
  await s.auth.signOut()
  redirect('/')
}

export async function createJob(fd: FormData) {
  const s = await createClient()
  await requireAdmin(s)
  const { error } = await s.from('jobs').insert({
    title: fd.get('title') as string,
    type: fd.get('type') as string,
    location: fd.get('location') as string,
    deadline: (fd.get('deadline') as string) || null,
    description: fd.get('description') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/jobs'); revalidatePath('/admin/jobs')
  return { success: true }
}

export async function deleteJob(id: string) {
  const s = await createClient()
  await requireAdmin(s)
  const { error } = await s.from('jobs').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/jobs'); revalidatePath('/admin/jobs')
  return { success: true }
}

export async function submitApplication(fd: FormData) {
  const s = await createClient()
  const { error } = await s.from('applications').insert({
    name: fd.get('name') as string,
    email: fd.get('email') as string,
    phone: fd.get('phone') as string,
    job_id: fd.get('job_id') as string,
    job_title: fd.get('job_title') as string,
    message: fd.get('message') as string,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteApplication(id: string) {
  const s = await createClient()
  await requireAdmin(s)
  const { error } = await s.from('applications').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/applications')
  return { success: true }
}

export async function updateTeamMember(id: string, fd: FormData) {
  const s = await createClient()
  await requireAdmin(s)
  let photo = fd.get('existing_photo') as string | null
  const file = fd.get('photo') as File
  if (file && file.size > 0) {
    const path = `team/${id}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await s.storage.from('gallery').upload(path, file, { upsert: true })
    if (error) return { error: error.message }
    photo = path
  }
  const { error } = await s.from('team').upsert({
    id,
    name: fd.get('name') as string,
    role: fd.get('role') as string,
    bio: fd.get('bio') as string,
    photo,
  })
  if (error) return { error: error.message }
  revalidatePath('/'); revalidatePath('/admin/team')
  return { success: true }
}

export async function uploadGalleryPhoto(fd: FormData) {
  const s = await createClient()
  await requireAdmin(s)
  const file = fd.get('photo') as File
  if (!file || file.size === 0) return { error: 'No file' }
  const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
  const { error: ue } = await s.storage.from('gallery').upload(path, file)
  if (ue) return { error: ue.message }
  const { error } = await s.from('gallery').insert({
    asset: path,
    caption: fd.get('caption') as string,
    credit: fd.get('credit') as string,
    is_official: true,
  })
  if (error) return { error: error.message }
  revalidatePath('/'); revalidatePath('/admin/gallery')
  return { success: true }
}

export async function deleteGalleryPhoto(id: string, asset: string) {
  const s = await createClient()
  await requireAdmin(s)
  const { error: storageError } = await s.storage.from('gallery').remove([asset])
  if (storageError) return { error: storageError.message }
  const { error } = await s.from('gallery').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/'); revalidatePath('/admin/gallery')
  return { success: true }
}

async function requireAdmin(s: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await s.auth.getUser()
  if (error) throw new Error(`Could not verify signed-in user: ${error.message}`)
  if (!user || !(await isAdmin(s, user.id))) {
    throw new Error('Administrator access is required for this action.')
  }
}
'@

# =========================================================
#  JOBS ROUTE
# =========================================================

Write-Host "💼 Writing jobs route..." -ForegroundColor Cyan

WriteFile "src\app\jobs\page.tsx" @'
import { createClient } from '@/utils/supabase/server'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import JobsClient from './JobsClient'
import { isAdmin } from '@/lib/auth'

export const instant = false

export default async function JobsPage() {
  const s = await createClient()
  const { data: jobs } = await s.from('jobs').select('*').order('created_at', { ascending: false })
  const { data: { user } } = await s.auth.getUser()
  const admin = user ? await isAdmin(s, user.id) : false
  return (
    <>
      <Nav admin={admin} signedIn={!!user} />
      <div style={{ paddingTop: 100 }}><JobsClient jobs={jobs ?? []} admin={admin} /></div>
      <Footer />
    </>
  )
}
'@

WriteFile "src\app\jobs\JobsClient.tsx" @'
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { submitApplication } from '@/app/actions'
import type { Job } from '@/lib/types'

export default function JobsClient({ jobs }: { jobs: Job[]; admin: boolean }) {
  const [active, setActive] = useState<Job | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!active) return
    setStatus('sending')
    const fd = new FormData(e.currentTarget)
    fd.append('job_id', active.id)
    fd.append('job_title', active.title)
    const r = await submitApplication(fd)
    setStatus('error' in r ? 'error' : 'sent')
  }

  return (
    <div className="wrap" style={{ paddingBottom: 60 }}>
      <div className="head"><h2>Careers at Mubas Group</h2><p>{jobs.length} open position{jobs.length === 1 ? '' : 's'}</p></div>
      <div className="row" style={{ marginBottom: 32 }}>
        <span>Want to create an account?</span>
        <Link href="/signup" className="btn sm">Sign up</Link>
      </div>
      {jobs.map((j) => (
        <article key={j.id} className="job">
          <h3>{j.title}</h3>
          <div className="meta">{[j.type, j.location, j.deadline && `Apply by ${j.deadline}`].filter(Boolean).join(' · ')}</div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{j.description}</p>
          <button className="btn sm" onClick={() => setActive(j)}>Apply now</button>
        </article>
      ))}
      {active && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,12,8,.7)', zIndex: 100, padding: 20, overflow: 'auto' }}
             onClick={(e) => { if (e.target === e.currentTarget) setActive(null) }}>
          <div style={{ background: 'var(--card)', padding: 28, borderRadius: 18, maxWidth: 520, margin: '80px auto' }}>
            {status === 'sent' ? (
              <>
                <h3>Application sent ✓</h3>
                <p>We&apos;ll be in touch if shortlisted.</p>
                <button className="btn sm" onClick={() => { setActive(null); setStatus('idle') }}>Close</button>
              </>
            ) : (
              <form onSubmit={onSubmit}>
                <h3>Apply: {active.title}</h3>
                <label>Full name<input name="name" required /></label>
                <label>Email<input type="email" name="email" required /></label>
                <label>Phone<input name="phone" /></label>
                <label>Tell us about yourself<textarea name="message" rows={4} required /></label>
                {status === 'error' && <p style={{ color: '#c0392b' }}>Something went wrong.</p>}
                <div className="row">
                  <button className="btn sm" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send'}</button>
                  <button type="button" className="btn sm out" onClick={() => setActive(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
'@

# =========================================================
#  LOGIN ROUTE
# =========================================================

Write-Host "🔐 Writing login route..." -ForegroundColor Cyan

WriteFile "src\app\login\page.tsx" @'
'use client'
import { useState } from 'react'
import { login } from '@/app/actions'
import Link from 'next/link'

export default function LoginPage() {
  const [err, setErr] = useState('')
  async function onSubmit(fd: FormData) {
    const r = await login(fd)
    if (r?.error) setErr(r.error)
  }
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 24 }}>
      <form action={onSubmit} style={{ background: 'var(--card)', padding: 40, borderRadius: 20, width: '100%', maxWidth: 400, border: '1px solid var(--line)' }}>
        <h2 style={{ marginBottom: 24 }}>Sign in</h2>
        <label style={{ display: 'block', marginBottom: 16 }}>Email<input name="email" type="email" required /></label>
        <label style={{ display: 'block', marginBottom: 16 }}>Password<input name="password" type="password" required /></label>
        {err && <p style={{ color: '#c0392b' }}>{err}</p>}
        <button className="btn" type="submit" style={{ width: '100%' }}>Sign in</button>
        <p>New here? <Link href="/signup">Create a regular account</Link></p>
      </form>
    </div>
  )
}
'@

WriteFile "src\app\signup\page.tsx" @'
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions'

export default function SignupPage() {
  const [message, setMessage] = useState('')

  async function onSubmit(formData: FormData) {
    const result = await signup(formData)
    setMessage('error' in result
      ? result.error ?? 'Account could not be created.'
      : 'Account created. Check your email to confirm your address, then sign in.')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 24 }}>
      <form action={onSubmit} style={{ background: 'var(--card)', padding: 40, borderRadius: 20, width: '100%', maxWidth: 400, border: '1px solid var(--line)' }}>
        <h2 style={{ marginBottom: 24 }}>Create a regular account</h2>
        <label style={{ display: 'block', marginBottom: 16 }}>Email<input name="email" type="email" required /></label>
        <label style={{ display: 'block', marginBottom: 16 }}>Password<input name="password" type="password" minLength={8} required /></label>
        {message && <p role="status">{message}</p>}
        <button className="btn" type="submit" style={{ width: '100%' }}>Create account</button>
        <p>Already registered? <Link href="/login">Sign in</Link></p>
      </form>
    </div>
  )
}
'@

WriteFile "src\app\auth\callback\route.ts" @'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=confirmation', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=confirmation', request.url))
  }

  return NextResponse.redirect(new URL('/', request.url))
}
'@

# =========================================================
#  ADMIN ROUTES
# =========================================================

Write-Host "🛡  Writing admin routes..." -ForegroundColor Cyan

WriteFile "src\app\admin\layout.tsx" @'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const instant = false

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()
  if (!user) redirect('/login')
  if (!(await isAdmin(s, user.id))) redirect('/')
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ background: 'var(--green)', color: '#fff', padding: '20px 32px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', position: 'static' }}>
        <b style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22 }}>Mubas Admin</b>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/jobs">Jobs</Link>
        <Link href="/admin/team">Team</Link>
        <Link href="/admin/gallery">Gallery</Link>
        <Link href="/admin/applications">Applications</Link>
        <Link href="/" style={{ marginLeft: 'auto' }}>View site →</Link>
      </nav>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>{children}</main>
    </div>
  )
}
'@

WriteFile "src\app\admin\page.tsx" @'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function AdminHome() {
  const s = await createClient()
  const [jobs, team, gal, apps] = await Promise.all([
    s.from('jobs').select('*', { count: 'exact', head: true }),
    s.from('team').select('*', { count: 'exact', head: true }),
    s.from('gallery').select('*', { count: 'exact', head: true }),
    s.from('applications').select('*', { count: 'exact', head: true }),
  ])
  const cards = [
    { label: 'Jobs', value: jobs.count ?? 0, href: '/admin/jobs' },
    { label: 'Team', value: team.count ?? 0, href: '/admin/team' },
    { label: 'Photos', value: gal.count ?? 0, href: '/admin/gallery' },
    { label: 'Applications', value: apps.count ?? 0, href: '/admin/applications' },
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
'@

WriteFile "src\app\admin\jobs\page.tsx" @'
import { createClient } from '@/utils/supabase/server'
import { createJob, deleteJob } from '@/app/actions'

export default async function AdminJobs() {
  const s = await createClient()
  const { data: jobs } = await s.from('jobs').select('*').order('created_at', { ascending: false })

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 20 }}>Jobs</h1>
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
                <h2 style={{ fontSize: 26, marginBottom: 12 }}>Post a new job</h2>
        <form action={async (fd: FormData) => { 'use server'; const result = await createJob(fd); if ('error' in result) throw new Error(result.error) }}>
          <label>Title<input name="title" required /></label>
          <label>Type<input name="type" placeholder="Full-time" /></label>
          <label>Location<input name="location" placeholder="Kigali, Rwanda" /></label>
          <label>Deadline<input name="deadline" type="date" /></label>
          <label>Description<textarea name="description" rows={5} required /></label>
          <button className="btn sm" type="submit">Create job</button>
        </form>
      </div>

      <h2 style={{ fontSize: 26, marginBottom: 12 }}>Existing jobs</h2>
      {(jobs ?? []).length === 0 && <div className="empty">No jobs yet.</div>}
      {(jobs ?? []).map((j) => (
        <div key={j.id} className="job">
          <h3>{j.title}</h3>
          <div className="meta">{[j.type, j.location, j.deadline].filter(Boolean).join(' · ')}</div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{j.description}</p>
          <form action={async () => { 'use server'; await deleteJob(j.id) }}>
            <button className="btn sm del" type="submit">Delete</button>
          </form>
        </div>
      ))}
    </>
  )
}
'@

WriteFile "src\app\admin\team\page.tsx" @'
import { createClient } from '@/utils/supabase/server'
import { updateTeamMember } from '@/app/actions'

export default async function AdminTeam() {
  const s = await createClient()
  const { data: team } = await s.from('team').select('*').order('id')
  const getImageUrl = (p: string | null) =>
    p ? s.storage.from('gallery').getPublicUrl(p).data.publicUrl : ''

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 20 }}>Team</h1>
      {(team ?? []).length === 0 && <div className="empty">No team members yet.</div>}
      {(team ?? []).map((m) => (
        <div key={m.id} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 12 }}>
            <div className="avatar" style={{ margin: 0 }}>
              {m.photo ? <img src={getImageUrl(m.photo)} alt={m.name ?? ''} /> : (m.name ?? '?').charAt(0)}
            </div>
            <div>
              <b>{m.name ?? 'Unnamed'}</b>
              <div style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 700 }}>{m.role}</div>
            </div>
          </div>
          <form action={async (fd: FormData) => { 'use server'; await updateTeamMember(m.id, fd) }}>
            <input type="hidden" name="existing_photo" value={m.photo ?? ''} />
            <label>Name<input name="name" defaultValue={m.name ?? ''} /></label>
            <label>Role<input name="role" defaultValue={m.role ?? ''} /></label>
            <label>Bio<textarea name="bio" rows={3} defaultValue={m.bio ?? ''} /></label>
            <label>Photo<input name="photo" type="file" accept="image/*" /></label>
            <button className="btn sm" type="submit">Save</button>
          </form>
        </div>
      ))}
    </>
  )
}
'@

WriteFile "src\app\admin\gallery\page.tsx" @'
import { createClient } from '@/utils/supabase/server'
import { uploadGalleryPhoto, deleteGalleryPhoto } from '@/app/actions'

export default async function AdminGallery() {
  const s = await createClient()
  const { data: gallery } = await s.from('gallery').select('*').order('created_at', { ascending: false })
  const getImageUrl = (p: string | null) =>
    p ? s.storage.from('gallery').getPublicUrl(p).data.publicUrl : ''

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 20 }}>Gallery</h1>
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, marginBottom: 12 }}>Upload a photo</h2>
        <form action={async (fd: FormData) => { 'use server'; const result = await uploadGalleryPhoto(fd); if ('error' in result) throw new Error(result.error) }}>
          <label>Photo<input name="photo" type="file" accept="image/*" required /></label>
          <label>Caption<input name="caption" /></label>
          <label>Credit<input name="credit" /></label>
          <button className="btn sm" type="submit">Upload</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {(gallery ?? []).map((g) => (
          <div key={g.id} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            {g.asset && <img src={getImageUrl(g.asset)} alt={g.caption ?? ''} style={{ width: '100%', display: 'block' }} />}
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 14 }}>{g.caption}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{g.credit}</div>
              <form action={async () => { 'use server'; if (g.asset) await deleteGalleryPhoto(g.id, g.asset) }} style={{ marginTop: 8 }}>
                <button className="btn sm del" type="submit">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
'@

WriteFile "src\app\admin\applications\page.tsx" @'
import { createClient } from '@/utils/supabase/server'
import { deleteApplication } from '@/app/actions'

export default async function AdminApplications() {
  const s = await createClient()
  const { data: apps } = await s.from('applications').select('*').order('created_at', { ascending: false })

  return (
    <>
      <h1 style={{ fontSize: 38, marginBottom: 20 }}>Applications</h1>
      {(apps ?? []).length === 0 && <div className="empty">No applications yet.</div>}
      {(apps ?? []).map((a) => (
        <div key={a.id} className="job">
          <h3 style={{ fontSize: 24 }}>{a.name}</h3>
          <div className="meta">For: {a.job_title} · {a.email}{a.phone ? ` · ${a.phone}` : ''}</div>
          <p>{a.message}</p>
          <form action={async () => { 'use server'; await deleteApplication(a.id) }}>
            <button className="btn sm del" type="submit">Delete</button>
          </form>
        </div>
      ))}
    </>
  )
}
'@

# =========================================================
#  SHARED COMPONENTS
# =========================================================

Write-Host "🧩 Writing components..." -ForegroundColor Cyan

WriteFile "src\components\CurrentYear.tsx" @'
'use client'
import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}

function getYear() {
  return new Date().getFullYear()
}

function getServerYear() {
  return null
}

export default function CurrentYear() {
  const year = useSyncExternalStore(subscribe, getYear, getServerYear)
  return <>{year}</>
}
'@

WriteFile "src\components\Nav.tsx" @'
import Link from 'next/link'
import { logout } from '@/app/actions'

export default function Nav({ admin, signedIn = admin }: { admin: boolean; signedIn?: boolean }) {
  return (
    <nav className="solid">
      <Link href="/" className="plate">
        <img src="/logo.png" alt="Mubas Group" />
      </Link>
      <ul>
        <li><Link href="/#services">Services</Link></li>
        <li><Link href="/#work">Work</Link></li>
        <li><Link href="/#chef">Our Chef</Link></li>
        <li><Link href="/#team">Team</Link></li>
        <li><Link href="/#gallery">Gallery</Link></li>
        <li><Link href="/jobs">Careers</Link></li>
      </ul>
      <div className="row">
        {admin ? (
          <>
            <Link href="/admin" className="btn sm ghost">Admin</Link>
            <form action={logout}><button className="btn sm ghost" type="submit">Log out</button></form>
          </>
        ) : signedIn ? (
          <form action={logout}><button className="btn sm ghost" type="submit">Log out</button></form>
        ) : (
          <Link href="/jobs" className="btn sm">Join us</Link>
        )}
      </div>
    </nav>
  )
}
'@

WriteFile "src\components\Hero.tsx" @'
export default function Hero() {
  return (
    <header className="hero">
      <div className="wrap">
        <h1>Mubas<br />Group</h1>
        <div className="tag">Hospitality, built and run with heart.</div>
        <p>Chef-led hospitality services and construction of hospitality assets — from concept to opening day.</p>
        <div className="cta">
          <a href="#services" className="btn">Our services</a>
          <a href="/jobs" className="btn ghost">Work with us</a>
        </div>
      </div>
    </header>
  )
}
'@

WriteFile "src\components\Services.tsx" @'
export default function Services() {
  return (
    <section id="services">
      <div className="wrap">
        <div className="head">
          <h2>Two disciplines, one standard.</h2>
          <p>We build and we run. Every kitchen, every dining room, every venue is designed and operated by people who have stood on the line.</p>
        </div>
        <div className="services">
          <div className="svc a">
            <h3>Hospitality</h3>
            <p>Full-service food and beverage operations for hotels, lodges, and events.</p>
            <ul>
              <li>Chef-led kitchens</li>
              <li>Restaurant design & launch</li>
              <li>Event catering</li>
              <li>Staff training</li>
            </ul>
          </div>
          <div className="svc b">
            <h3>Construction</h3>
            <p>Purpose-built hospitality assets, delivered on time and on budget.</p>
            <ul>
              <li>Commercial kitchens</li>
              <li>Restaurants & cafés</li>
              <li>Lodges & guesthouses</li>
              <li>Fit-out & renovation</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
'@

WriteFile "src\components\Work.tsx" @'
const tiles = [
  { cls: 't1', title: 'The Green Table', sub: 'Restaurant · Kigali' },
  { cls: 't2', title: 'Akagera Lodge', sub: 'Hospitality · Eastern Province' },
  { cls: 't3', title: 'Blue Room Bistro', sub: 'Café · Kigali' },
  { cls: 't4', title: 'Hilltop Kitchen', sub: 'Commercial kitchen · Musanze' },
]

export default function Work() {
  return (
    <section id="work">
      <div className="wrap">
        <div className="head">
          <h2>Selected work</h2>
          <p>A few of the spaces and operations we have brought to life.</p>
        </div>
        <div className="work">
          {tiles.map((t) => (
            <div key={t.title} className={`tile ${t.cls}`}>
              <h3>{t.title}</h3>
              <span>{t.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
'@

WriteFile "src\components\Chef.tsx" @'
export default function Chef() {
  return (
    <section id="chef">
      <div className="wrap chef">
        <img src="/chef.jpg" alt="Head chef" />
        <div>
          <h2>Built by a chef, not a boardroom.</h2>
          <p>Mubas Group was founded by a working chef who got tired of watching good ideas die in bad kitchens. We design hospitality spaces from the line outward — the flow, the light, the pass, the storage — and then we run them with the same discipline we build them with.</p>
          <div className="facts">
            <div><b>15+</b><small>Years in kitchens</small></div>
            <div><b>40+</b><small>Projects delivered</small></div>
            <div><b>3</b><small>Countries</small></div>
          </div>
        </div>
      </div>
    </section>
  )
}
'@

WriteFile "src\components\TeamGrid.tsx" @'
import type { TeamMember } from '@/lib/types'

export default function TeamGrid({
  team,
  admin,
  getImageUrl,
}: {
  team: TeamMember[]
  admin: boolean
  getImageUrl: (p: string | null) => string
}) {
  return (
    <section id="team">
      <div className="wrap">
        <div className="head">
          <h2>The team</h2>
          <p>The people behind the pass and behind the plans.</p>
        </div>
        {team.length === 0 ? (
          <div className="empty">Team profiles coming soon.</div>
        ) : (
          <div className="team">
            {team.map((m) => (
              <div key={m.id} className="member">
                <div className="avatar">
                  {m.photo ? <img src={getImageUrl(m.photo)} alt={m.name ?? ''} /> : (m.name ?? '?').charAt(0)}
                </div>
                <h3>{m.name}</h3>
                <em>{m.role}</em>
                <p>{m.bio}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
'@

WriteFile "src\components\GalleryGrid.tsx" @'
import type { GalleryItem } from '@/lib/types'

export default function GalleryGrid({
  gallery,
  admin,
  getImageUrl,
}: {
  gallery: GalleryItem[]
  admin: boolean
  getImageUrl: (p: string | null) => string
}) {
  return (
    <section id="gallery">
      <div className="wrap">
        <div className="head">
          <h2>Gallery</h2>
          <p>Spaces we have built, plates we have sent, moments we have hosted.</p>
        </div>
        {gallery.length === 0 ? (
          <div className="empty">Photos coming soon.</div>
        ) : (
          <div className="gal">
            {gallery.map((g) => (
              <figure key={g.id}>
                {g.asset && <img src={getImageUrl(g.asset)} alt={g.caption ?? ''} loading="lazy" />}
                {g.is_official && <span className="chip g">Official</span>}
                <figcaption>
                  {g.caption}
                  {g.credit && <span style={{ display: 'block', fontSize: 12 }}>— {g.credit}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
'@

WriteFile "src\components\Steps.tsx" @'
const steps = [
  { n: '01', title: 'Listen', p: 'We start with your concept, site, budget, and constraints.' },
  { n: '02', title: 'Design', p: 'Kitchen flow, layout, and operations are planned together.' },
  { n: '03', title: 'Build', p: 'We deliver the space, install the equipment, and test every line.' },
  { n: '04', title: 'Run', p: 'Optionally, we stay on to operate and train your team.' },
]

export default function Steps() {
  return (
    <section id="process">
      <div className="wrap">
        <div className="head">
          <h2>How we work</h2>
          <p>A simple, honest process from first conversation to opening night.</p>
        </div>
        <div className="steps">
          {steps.map((s) => (
            <div key={s.n} className="step">
              <h3>{s.title}</h3>
              <p>{s.n} — {s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
'@

WriteFile "src\components\Contact.tsx" @'
export default function Contact() {
  return (
    <section id="contact">
      <div className="wrap">
        <div className="contact">
          <div>
            <h2>Let&apos;s build something worth eating in.</h2>
          </div>
          <div>
            <p><b>Email</b> — hello@mubasgroup.com</p>
            <p><b>Phone</b> — +250 000 000 000</p>
            <p><b>Studio</b> — Kigali, Rwanda</p>
            <a href="mailto:hello@mubasgroup.com" className="btn" style={{ marginTop: 12 }}>Get in touch</a>
          </div>
        </div>
      </div>
    </section>
  )
}
'@

WriteFile "src\components\Footer.tsx" @'
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
          <Link href="/jobs">Careers</Link>
          <Link href="/login">Admin</Link>
        </div>
      </div>
    </footer>
  )
}
'@

# =========================================================
#  SUPABASE SQL SCHEMA
# =========================================================

Write-Host "🗄  Writing schema.sql..." -ForegroundColor Cyan

WriteFile "supabase\schema.sql" @'
-- =========================================================
--  Mubas Group — Supabase schema
--  Run this in the Supabase SQL editor, then create a
--  public storage bucket named "gallery".
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- USER ROLES ----------
-- New accounts have no row here and are regular users by default.
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null check (role in ('admin'))
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;

drop policy if exists "user_roles read own" on public.user_roles;
create policy "user_roles read own" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- ---------- TEAM ----------
create table if not exists public.team (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  role        text,
  bio         text,
  photo       text
);
alter table public.team enable row level security;

drop policy if exists "team read all" on public.team;
create policy "team read all" on public.team
  for select using (true);

drop policy if exists "team write authed" on public.team;
drop policy if exists "team write admin" on public.team;
create policy "team write admin" on public.team
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- JOBS ----------
create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        text,
  location    text,
  deadline    date,
  description text,
  created_at  timestamptz not null default now()
);
alter table public.jobs enable row level security;

drop policy if exists "jobs read all" on public.jobs;
create policy "jobs read all" on public.jobs
  for select using (true);

drop policy if exists "jobs write authed" on public.jobs;
drop policy if exists "jobs write admin" on public.jobs;
create policy "jobs write admin" on public.jobs
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- GALLERY ----------
create table if not exists public.gallery (
  id          uuid primary key default gen_random_uuid(),
  asset       text,
  caption     text,
  credit      text,
  is_official boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.gallery enable row level security;

drop policy if exists "gallery read all" on public.gallery;
create policy "gallery read all" on public.gallery
  for select using (true);

drop policy if exists "gallery write authed" on public.gallery;
drop policy if exists "gallery write admin" on public.gallery;
create policy "gallery write admin" on public.gallery
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- APPLICATIONS ----------
create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  job_id      uuid references public.jobs(id) on delete cascade,
  job_title   text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);
alter table public.applications enable row level security;

drop policy if exists "applications insert anyone" on public.applications;
create policy "applications insert anyone" on public.applications
  for insert with check (true);

drop policy if exists "applications read authed" on public.applications;
drop policy if exists "applications read admin" on public.applications;
create policy "applications read admin" on public.applications
  for select using (public.is_admin());

drop policy if exists "applications delete authed" on public.applications;
drop policy if exists "applications delete admin" on public.applications;
create policy "applications delete admin" on public.applications
  for delete using (public.is_admin());

-- ---------- STORAGE ----------
-- Create a public bucket named "gallery" in the Supabase dashboard,
-- then run these policies:
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "gallery bucket public read" on storage.objects;
create policy "gallery bucket public read" on storage.objects
  for select using (bucket_id = 'gallery');

drop policy if exists "gallery bucket authed write" on storage.objects;
drop policy if exists "gallery bucket admin write" on storage.objects;
create policy "gallery bucket admin write" on storage.objects
  for insert with check (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "gallery bucket authed delete" on storage.objects;
drop policy if exists "gallery bucket admin update" on storage.objects;
create policy "gallery bucket admin update" on storage.objects
  for update using (bucket_id = 'gallery' and public.is_admin())
  with check (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "gallery bucket admin delete" on storage.objects;
create policy "gallery bucket admin delete" on storage.objects
  for delete using (bucket_id = 'gallery' and public.is_admin());

-- After creating the admin account, promote it from the SQL Editor:
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do update set role = excluded.role;
'@

# =========================================================
#  DONE
# =========================================================

Write-Host ""
Write-Host "✅  Setup complete." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Fill in .env.local with your Supabase URL + anon key."
Write-Host "  2. Run supabase/schema.sql in the Supabase SQL editor."
Write-Host "  3. Create an admin user in Supabase Authentication, then run the promotion SQL at the end of schema.sql."
Write-Host "  4. Add http://localhost:3000/auth/callback to Supabase Auth URL Configuration → Redirect URLs."
Write-Host "  5. Drop logo.png and chef.jpg into public/."
Write-Host "  6. npm run dev, then create regular accounts at /signup."
Write-Host ""
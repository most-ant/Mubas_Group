import { createClient } from '@/utils/supabase/server'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import JobsClient from './JobsClient'
import { isAdmin } from '@/lib/auth'

export const instant = false

export default async function JobsPage() {
  const s = await createClient()

  // Fetch jobs and user authentication concurrently in parallel
  const [{ data: jobs }, { data: userData }] = await Promise.all([
    s.from('jobs').select('*').order('created_at', { ascending: false }),
    s.auth.getUser(),
  ])

  const user = userData?.user
  const admin = user ? await isAdmin(s, user.id) : false

  return (
    <>
      <Nav admin={admin} signedIn={!!user} />
      <div style={{ paddingTop: 100 }}>
        <JobsClient jobs={jobs ?? []} admin={admin} />
      </div>
      <Footer />
    </>
  )
}

import { createClient } from '@/utils/supabase/server'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Chef from '@/components/Chef'
import TeamGrid from '@/components/TeamGrid'
import GalleryGrid from '@/components/GalleryGrid'
import Steps from '@/components/Steps'
import CollaboratorsGrid from '@/components/CollaboratorsGrid'
import Contact from '@/components/Contact'
import HomeMessageSection from '@/components/HomeMessageSection'
import Footer from '@/components/Footer'
import { isAdmin } from '@/lib/auth'
import { getImageUrl } from '@/utils/supabase/images'

export const instant = false

export default async function HomePage() {
  const supabase = await createClient()

  // Concurrently fetch team, gallery, collaborators, and user authentication in parallel
  const [{ data: team }, { data: gallery }, { data: collaborators }, { data: userData }] = await Promise.all([
    supabase.from('team').select('*').order('id'),
    supabase.from('gallery').select('*').order('created_at', { ascending: false }),
    supabase.from('collaborators').select('*').order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  const user = userData?.user
  const admin = user ? await isAdmin(supabase, user.id) : false
  const resolveImageUrl = (p: string | null) => getImageUrl(supabase, p)

  return (
    <>
      <Nav admin={admin} signedIn={!!user} />
      <Hero />
      <main>
        <Services />
        <Chef />
        <TeamGrid team={team ?? []} admin={admin} getImageUrl={resolveImageUrl} />
        <GalleryGrid gallery={gallery ?? []} admin={admin} signedIn={!!user} getImageUrl={resolveImageUrl} />
        <Steps />
        <CollaboratorsGrid collaborators={collaborators ?? []} admin={admin} getImageUrl={resolveImageUrl} />
        <Contact />
        <HomeMessageSection signedIn={!!user} />
      </main>
      <Footer />
    </>
  )
}

'use server'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(fd: FormData) {
  const email = (fd.get('email') as string)?.trim()
  const password = fd.get('password') as string
  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const s = await createClient()
  const { data, error } = await s.auth.signInWithPassword({
    email,
    password,
  })
  if (error) return { error: error.message }

  const admin = await isAdmin(s, data.user.id)
  redirect(admin ? '/admin' : '/')
}

export async function signup(fd: FormData) {
  const email = (fd.get('email') as string)?.trim()
  const password = fd.get('password') as string
  if (!email || typeof password !== 'string' || password.length < 8) {
    return { error: 'Enter a valid email and a password with at least 8 characters.' }
  }

  const h = await headers()
  const origin = h.get('origin') || (h.get('host') ? `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}` : '')

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
  try {
    const s = await createClient()
    await requireAdmin(s)

    const title = (fd.get('title') as string)?.trim()
    const description = (fd.get('description') as string)?.trim()
    const type = (fd.get('type') as string)?.trim() || null
    const location = (fd.get('location') as string)?.trim() || null
    const deadline = (fd.get('deadline') as string)?.trim() || null

    if (!title || !description) {
      return { error: 'Job title and description are required.' }
    }

    const { error } = await s.from('jobs').insert({
      title,
      type,
      location,
      deadline,
      description,
    })
    if (error) return { error: `Database error: ${error.message}` }

    revalidatePath('/jobs')
    revalidatePath('/admin/jobs')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to create job.' }
  }
}

export async function deleteJob(id: string) {
  try {
    const s = await createClient()
    await requireAdmin(s)
    const { error } = await s.from('jobs').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/jobs')
    revalidatePath('/admin/jobs')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to delete job.' }
  }
}

export async function submitApplication(fd: FormData) {
  const name = (fd.get('name') as string)?.trim()
  const email = (fd.get('email') as string)?.trim()
  const phone = (fd.get('phone') as string)?.trim() || null
  const job_id = (fd.get('job_id') as string)?.trim() || null
  const job_title = (fd.get('job_title') as string)?.trim() || 'General Application'
  const message = (fd.get('message') as string)?.trim()

  if (!name || !email || !message) {
    return { error: 'Full name, email, and message are required.' }
  }

  const s = await createClient()
  const { data: { user } } = await s.auth.getUser()

  const { error } = await s.from('applications').insert({
    name,
    email,
    phone,
    job_id,
    job_title,
    message,
    status: 'pending',
    user_id: user?.id ?? null,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteApplication(id: string) {
  try {
    const s = await createClient()
    await requireAdmin(s)
    const { error } = await s.from('applications').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/applications')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to delete application.' }
  }
}

export async function createTeamMember(fd: FormData) {
  try {
    const s = await createClient()
    await requireAdmin(s)

    const name = (fd.get('name') as string)?.trim()
    const role = (fd.get('role') as string)?.trim()
    const bio = (fd.get('bio') as string)?.trim() || null

    if (!name || !role) {
      return { error: 'Name and role are required.' }
    }

    let photo: string | null = null
    const file = fd.get('photo') as File | null
    if (file && file.size > 0) {
      const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(rawExt) ? rawExt : 'jpg'
      const path = `team/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await s.storage.from('gallery').upload(path, file, { upsert: true })
      if (error) {
        if (error.message.toLowerCase().includes('bucket not found') || error.message.includes('The resource was not found')) {
          return {
            error: 'Storage bucket "gallery" does not exist in Supabase. Please create the public "gallery" bucket in Supabase SQL editor or Dashboard.',
          }
        }
        return { error: `Photo upload failed: ${error.message}` }
      }
      photo = path
    }

    const { error } = await s.from('team').insert({
      name,
      role,
      bio,
      photo,
    })
    if (error) return { error: `Database error: ${error.message}` }

    revalidatePath('/')
    revalidatePath('/admin/team')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to create team member.' }
  }
}

export async function updateTeamMember(id: string, fd: FormData) {
  try {
    const s = await createClient()
    await requireAdmin(s)

    const name = (fd.get('name') as string)?.trim() || null
    const role = (fd.get('role') as string)?.trim() || null
    const bio = (fd.get('bio') as string)?.trim() || null
    let photo = ((fd.get('existing_photo') as string)?.trim()) || null

    const file = fd.get('photo') as File | null
    if (file && file.size > 0) {
      const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(rawExt) ? rawExt : 'jpg'
      const path = `team/${id}-${Date.now()}.${ext}`
      const { error } = await s.storage.from('gallery').upload(path, file, { upsert: true })
      if (error) {
        return { error: `Photo upload failed: ${error.message}` }
      }
      photo = path
    }

    const { error } = await s.from('team').upsert({
      id,
      name,
      role,
      bio,
      photo,
    })
    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/admin/team')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to update team member.' }
  }
}

export async function deleteTeamMember(id: string, photo?: string | null) {
  try {
    const s = await createClient()
    await requireAdmin(s)

    if (photo) {
      try {
        await s.storage.from('gallery').remove([photo])
      } catch {
        // Non-fatal if photo does not exist in storage
      }
    }

    const { error } = await s.from('team').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/admin/team')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to delete team member.' }
  }
}

export async function uploadGalleryPhoto(fd: FormData) {
  try {
    const s = await createClient()
    await requireAdmin(s)

    const file = fd.get('photo') as File | null
    if (!file || file.size === 0) return { error: 'Please select a photo file to upload.' }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(rawExt) ? rawExt : 'jpg'
    const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: ue } = await s.storage.from('gallery').upload(path, file)
    if (ue) {
      if (ue.message.toLowerCase().includes('bucket not found') || ue.message.includes('The resource was not found')) {
        return {
          error: 'Storage bucket "gallery" does not exist in Supabase. Please create the public "gallery" bucket in your Supabase Dashboard or execute the schema in the SQL Editor.',
        }
      }
      return { error: `Storage upload failed: ${ue.message}` }
    }

    const caption = (fd.get('caption') as string)?.trim() || null
    const credit = (fd.get('credit') as string)?.trim() || null

    const { data: { user } } = await s.auth.getUser()

    const { error } = await s.from('gallery').insert({
      asset: path,
      caption,
      credit,
      is_official: true,
      status: 'approved',
      uploaded_by: user?.id ?? null,
    })
    if (error) {
      return { error: `Database insert failed: ${error.message}` }
    }

    revalidatePath('/')
    revalidatePath('/admin/gallery')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to upload photo.' }
  }
}

export async function userUploadGalleryPhoto(fd: FormData) {
  try {
    const s = await createClient()

    const { data: { user }, error: authErr } = await s.auth.getUser()
    if (authErr || !user) {
      return { error: 'You must be signed in to upload photos. Please sign in first.' }
    }

    const termsAccepted = fd.get('terms_accepted') === 'true'
    if (!termsAccepted) {
      return { error: 'You must accept the terms and regulations to share images with Mubas Group.' }
    }

    const file = fd.get('photo') as File | null
    if (!file || file.size === 0) return { error: 'Please select a photo file to upload.' }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(rawExt) ? rawExt : 'jpg'
    const path = `gallery/user-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: ue } = await s.storage.from('gallery').upload(path, file)
    if (ue) {
      if (ue.message.toLowerCase().includes('bucket not found') || ue.message.includes('The resource was not found')) {
        return {
          error: 'Storage bucket "gallery" does not exist. Please contact the administrator.',
        }
      }
      return { error: `Upload failed: ${ue.message}` }
    }

    const caption = (fd.get('caption') as string)?.trim() || null
    const credit = (fd.get('credit') as string)?.trim() || null

    const { error } = await s.from('gallery').insert({
      asset: path,
      caption,
      credit,
      is_official: false,
      status: 'pending',
      uploaded_by: user.id,
    })
    if (error) {
      return { error: `Database insert failed: ${error.message}` }
    }

    revalidatePath('/')
    revalidatePath('/admin/gallery')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to upload photo.' }
  }
}

export async function approveGalleryPhoto(id: string) {
  try {
    const s = await createClient()
    await requireAdmin(s)

    // Get gallery item to find the uploader
    const { data: item } = await s.from('gallery').select('*').eq('id', id).single()

    const { error } = await s.from('gallery').update({ status: 'approved', is_official: true }).eq('id', id)
    if (error) return { error: error.message }

    // Create notification for the uploader
    if (item?.uploaded_by) {
      await s.from('notifications').insert({
        user_id: item.uploaded_by,
        type: 'photo_approved',
        message: `Your photo "${item.caption || 'Untitled'}" has been approved and is now visible in the gallery!`,
      })
    }

    revalidatePath('/')
    revalidatePath('/admin/gallery')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to approve photo.' }
  }
}

export async function rejectGalleryPhoto(id: string, asset?: string | null) {
  try {
    const s = await createClient()
    await requireAdmin(s)

    if (asset) {
      try {
        await s.storage.from('gallery').remove([asset])
      } catch {
        // Proceed even if asset removal encountered an error
      }
    }

    const { error } = await s.from('gallery').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/admin/gallery')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to reject photo.' }
  }
}

export async function deleteGalleryPhoto(id: string, asset?: string | null) {
  try {
    const s = await createClient()
    await requireAdmin(s)

    if (asset) {
      try {
        await s.storage.from('gallery').remove([asset])
      } catch {
        // Proceed even if asset removal encountered an error
      }
    }

    const { error } = await s.from('gallery').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/admin/gallery')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to delete photo.' }
  }
}

// ---- APPLICATION STATUS ----

export async function markApplicationReceived(id: string) {
  try {
    const s = await createClient()
    await requireAdmin(s)

    // Get application details so we can find the user to notify
    const { data: app } = await s.from('applications').select('*').eq('id', id).single()
    if (!app) return { error: 'Application not found.' }

    const { error } = await s.from('applications').update({ status: 'received' }).eq('id', id)
    if (error) return { error: error.message }

    // Create notification for the applicant if they have a linked user_id
    if (app.user_id) {
      await s.from('notifications').insert({
        user_id: app.user_id,
        type: 'application_received',
        message: `Your job application for "${app.job_title}" has been marked as received by Mubas Group.`,
      })
    }

    revalidatePath('/admin/applications')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to mark as received.' }
  }
}

// ---- MESSAGING ----

export async function sendMessage(fd: FormData) {
  try {
    const s = await createClient()
    const { data: { user }, error: authErr } = await s.auth.getUser()
    if (authErr || !user) {
      return { error: 'You must be signed in to send a message.' }
    }

    const content = (fd.get('content') as string)?.trim()
    if (!content) return { error: 'Message cannot be empty.' }

    const { error } = await s.from('messages').insert({
      user_id: user.id,
      user_email: user.email ?? 'Unknown',
      content,
    })
    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/admin/messages')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to send message.' }
  }
}

export async function replyToMessage(id: string, reply: string) {
  try {
    const s = await createClient()
    await requireAdmin(s)

    if (!reply.trim()) return { error: 'Reply cannot be empty.' }

    // Get message to find user for notification
    const { data: msg } = await s.from('messages').select('*').eq('id', id).single()
    if (!msg) return { error: 'Message not found.' }

    const { error } = await s.from('messages').update({
      admin_reply: reply.trim(),
      replied_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return { error: error.message }

    // Create notification for the user
    if (msg.user_id) {
      await s.from('notifications').insert({
        user_id: msg.user_id,
        type: 'message_reply',
        message: 'Mubas Group replied to your message.',
      })
    }

    revalidatePath('/admin/messages')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to reply.' }
  }
}

export async function deleteMessage(id: string) {
  try {
    const s = await createClient()
    await requireAdmin(s)
    const { error } = await s.from('messages').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/messages')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to delete message.' }
  }
}

// ---- NOTIFICATIONS ----

export async function markNotificationRead(id: string) {
  try {
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    const { error } = await s.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to mark as read.' }
  }
}

export async function markAllNotificationsRead() {
  try {
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()
    if (!user) return { error: 'Not signed in.' }

    const { error } = await s.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to mark all as read.' }
  }
}

async function requireAdmin(s: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await s.auth.getUser()
  if (error) throw new Error(`Could not verify signed-in user: ${error.message}`)
  if (!user) {
    throw new Error('You must be signed in to perform this action. Please sign in at /login.')
  }
  const admin = await isAdmin(s, user.id)
  if (!admin) {
    throw new Error(
      `Administrator access required. Account "${user.email}" does not have the admin role in the "user_roles" table. Promote this user in the Supabase SQL editor: INSERT INTO public.user_roles (user_id, role) VALUES ('${user.id}', 'admin') ON CONFLICT (user_id) DO NOTHING;`
    )
  }
}

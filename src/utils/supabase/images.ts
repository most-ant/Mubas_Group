import type { SupabaseClient } from '@supabase/supabase-js'

export function getImageUrl(supabase: SupabaseClient, path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path
  }
  return supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl
}

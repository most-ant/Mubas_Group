import type { SupabaseClient } from '@supabase/supabase-js'

export async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('isAdmin verification notice:', error.message)
      return false
    }
    return data?.role === 'admin'
  } catch (err) {
    console.warn('isAdmin check encountered an unexpected error:', err)
    return false
  }
}

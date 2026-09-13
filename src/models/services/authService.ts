import { supabase } from '../../lib/supabaseClient'

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error?.message ?? null }
}

export async function signOut() {
  await supabase.auth.signOut()
}

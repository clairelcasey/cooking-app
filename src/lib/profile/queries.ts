import type { SupabaseClient } from '@supabase/supabase-js'

export interface HealthGoals {
  protein_goal_g?: number
  fiber_goal_g?: number
}

export interface Profile {
  id: string
  display_name: string | null
  health_goals: HealthGoals | null
}

export async function getProfile(supabase: SupabaseClient): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, health_goals')
    .single()

  if (error || !data) return null
  return data as Profile
}

export async function updateHealthGoals(
  supabase: SupabaseClient,
  goals: HealthGoals
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ health_goals: goals })
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')

  if (error) throw error
}

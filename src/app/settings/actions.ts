'use server'

import { createClient } from '@/lib/supabase/server'
import type { HealthGoals } from '@/lib/profile/queries'

export async function saveNutritionGoals(
  goals: HealthGoals
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ health_goals: goals })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return {}
}

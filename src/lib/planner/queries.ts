import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanEntry, WeekPlan } from '@/types/recipe'
import { format } from 'date-fns'

export async function getWeekPlan(
  supabase: SupabaseClient,
  userId: string,
  weekStart: Date
): Promise<WeekPlan> {
  const weekStartDate = format(weekStart, 'yyyy-MM-dd')

  // Upsert the weekly plan row
  const { data: plan, error: planError } = await supabase
    .from('weekly_plans')
    .upsert(
      { user_id: userId, week_start_date: weekStartDate },
      { onConflict: 'user_id,week_start_date', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (planError) throw planError

  // Fetch all entries for this plan, joined with recipe fields
  const { data: entries, error: entriesError } = await supabase
    .from('plan_entries')
    .select(
      `id, plan_id, entry_date, meal_slot, recipe_id, free_text_meal, nutrition, status,
       recipe:recipes(id, title, image_url, prep_minutes, nutrition, ingredients)`
    )
    .eq('plan_id', plan.id)
    .order('entry_date', { ascending: true })

  if (entriesError) throw entriesError

  return {
    planId: plan.id,
    entries: (entries ?? []) as unknown as PlanEntry[],
  }
}

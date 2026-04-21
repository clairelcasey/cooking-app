'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MealSlot } from '@/types/recipe'

export interface AgentPlanEntry {
  date: string
  mealSlot: MealSlot
  recipeId: string
  recipeTitle: string
}

export async function applyAgentPlan(
  entries: AgentPlanEntry[]
): Promise<{ error?: string }> {
  if (!entries || entries.length === 0) return { error: 'No entries provided' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Derive week start (Monday) from the first entry date
  const firstDate = new Date(entries[0].date + 'T12:00:00')
  const day = firstDate.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  const weekStart = new Date(firstDate)
  weekStart.setDate(firstDate.getDate() + diff)
  const weekStartISO = weekStart.toISOString().split('T')[0]

  // Upsert the weekly_plans row to get/create a planId
  const { data: plan, error: planError } = await supabase
    .from('weekly_plans')
    .upsert(
      { user_id: user.id, week_start_date: weekStartISO },
      { onConflict: 'user_id,week_start_date' }
    )
    .select('id')
    .single()

  if (planError || !plan) return { error: planError?.message ?? 'Could not create plan' }

  // Insert all entries
  const rows = entries.map((e) => ({
    plan_id: plan.id,
    entry_date: e.date,
    meal_slot: e.mealSlot,
    recipe_id: e.recipeId,
    status: 'planned' as const,
  }))

  const { error: insertError } = await supabase.from('plan_entries').insert(rows)
  if (insertError) return { error: insertError.message }

  revalidatePath('/planner')
  return {}
}

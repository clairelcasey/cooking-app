'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MealSlot } from '@/types/recipe'

export async function addPlanEntry(
  planId: string,
  entryDate: string,
  mealSlot: MealSlot,
  recipeId: string
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('plan_entries')
    .insert({
      plan_id: planId,
      entry_date: entryDate,
      meal_slot: mealSlot,
      recipe_id: recipeId,
      status: 'planned',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/planner')
  return { id: data.id }
}

export async function removePlanEntry(
  entryId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('plan_entries')
    .delete()
    .eq('id', entryId)

  if (error) return { error: error.message }

  revalidatePath('/planner')
  return {}
}

export async function movePlanEntry(
  entryId: string,
  newDate: string,
  newMealSlot: MealSlot
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('plan_entries')
    .update({ entry_date: newDate, meal_slot: newMealSlot })
    .eq('id', entryId)

  if (error) return { error: error.message }

  revalidatePath('/planner')
  return {}
}

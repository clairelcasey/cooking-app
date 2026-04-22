import type { SupabaseClient } from '@supabase/supabase-js'
import type { GroceryItem, GroceryList, PantryStaple, RecurringItem } from '@/types/grocery'
import { subDays } from 'date-fns'

export async function getGroceryList(
  supabase: SupabaseClient,
  planId: string
): Promise<GroceryList | null> {
  const { data, error } = await supabase
    .from('grocery_lists')
    .select('*')
    .eq('plan_id', planId)
    .maybeSingle()

  if (error) {
    console.error('[getGroceryList] error:', error)
    return null
  }
  return data as GroceryList | null
}

export async function getPurchaseHistory(
  supabase: SupabaseClient,
  userId: string,
  lookbackDays = 90
): Promise<Array<{ ingredient: string; checked_at: string }>> {
  const cutoff = subDays(new Date(), lookbackDays).toISOString()

  const { data, error } = await supabase
    .from('grocery_lists')
    .select('items')
    .eq('user_id', userId)
    .gte('created_at', cutoff)

  if (error || !data) return []

  return data.flatMap(row => {
    const items = (row.items ?? []) as GroceryItem[]
    return items
      .filter(i => i.checked && i.checked_at)
      .map(i => ({ ingredient: i.ingredient, checked_at: i.checked_at! }))
  })
}

export async function saveGroceryList(
  supabase: SupabaseClient,
  planId: string,
  userId: string,
  items: GroceryItem[]
): Promise<GroceryList> {
  // Check if a list already exists for this plan
  const existing = await getGroceryList(supabase, planId)

  if (existing) {
    // Update in place
    const { error } = await supabase
      .from('grocery_lists')
      .update({ items, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return { ...existing, items }
  }

  // Insert new list
  const { data, error } = await supabase
    .from('grocery_lists')
    .insert({ plan_id: planId, user_id: userId, items })
    .select()
    .single()

  if (error) {
    console.error('[saveGroceryList] insert error:', error)
    throw error
  }
  return data as GroceryList
}

// ─── Recipe-picker list (plan_id = null) ───────────────────────────────────────

export async function getRecipePickerList(
  supabase: SupabaseClient,
  userId: string
): Promise<GroceryList | null> {
  const { data, error } = await supabase
    .from('grocery_lists')
    .select('*')
    .eq('user_id', userId)
    .is('plan_id', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[getRecipePickerList] error:', error)
    return null
  }
  return data as GroceryList | null
}

export async function saveRecipePickerList(
  supabase: SupabaseClient,
  userId: string,
  items: GroceryItem[]
): Promise<GroceryList> {
  const existing = await getRecipePickerList(supabase, userId)

  if (existing) {
    const { error } = await supabase
      .from('grocery_lists')
      .update({ items, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return { ...existing, items }
  }

  const { data, error } = await supabase
    .from('grocery_lists')
    .insert({ plan_id: null, user_id: userId, items })
    .select()
    .single()

  if (error) {
    console.error('[saveRecipePickerList] insert error:', error)
    throw error
  }
  return data as GroceryList
}

export async function updateGroceryItems(
  supabase: SupabaseClient,
  listId: string,
  items: GroceryItem[]
): Promise<void> {
  const { error } = await supabase
    .from('grocery_lists')
    .update({ items, updated_at: new Date().toISOString() })
    .eq('id', listId)

  if (error) throw error
}

export async function getProfileGroceryData(
  supabase: SupabaseClient,
  userId: string
): Promise<{ pantryStaples: PantryStaple[]; recurringItems: RecurringItem[] }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('pantry_staples, recurring_grocery_items')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return { pantryStaples: [], recurringItems: [] }

  return {
    pantryStaples: (data.pantry_staples ?? []) as PantryStaple[],
    recurringItems: (data.recurring_grocery_items ?? []) as RecurringItem[],
  }
}

export async function getPastLists(
  supabase: SupabaseClient,
  userId: string,
  currentPlanId: string,
  limit = 12
): Promise<Array<{ id: string; created_at: string; week_start_date: string }>> {
  const { data, error } = await supabase
    .from('grocery_lists')
    .select('id, created_at, plan:weekly_plans(week_start_date)')
    .eq('user_id', userId)
    .neq('plan_id', currentPlanId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    created_at: row.created_at as string,
    week_start_date:
      ((Array.isArray(row.plan) ? row.plan[0] : row.plan) as { week_start_date: string } | null)
        ?.week_start_date ?? '',
  }))
}

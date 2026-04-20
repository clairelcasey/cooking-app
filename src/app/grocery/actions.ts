'use server'

import { revalidatePath } from 'next/cache'
import { startOfWeek, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getWeekPlan } from '@/lib/planner/queries'
import { generateGroceryList } from '@/lib/grocery/generate'
import {
  getGroceryList,
  getPurchaseHistory,
  saveGroceryList,
  updateGroceryItems,
  getProfileGroceryData,
} from '@/lib/grocery/queries'
import { categorize } from '@/lib/grocery/categories'
import type { GroceryItem, PantryStatus } from '@/types/grocery'

export async function generateList(
  weekStartISO: string
): Promise<{ error?: string; items?: GroceryItem[]; listId?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const weekStart = startOfWeek(parseISO(weekStartISO), { weekStartsOn: 1 })
    const weekPlan = await getWeekPlan(supabase, user.id, weekStart)

    const [existingList, profileData, purchaseHistory] = await Promise.all([
      getGroceryList(supabase, weekPlan.planId),
      getProfileGroceryData(supabase, user.id),
      getPurchaseHistory(supabase, user.id),
    ])

    const items = generateGroceryList({
      planEntries: weekPlan.entries,
      pantryStaples: profileData.pantryStaples,
      recurringItems: profileData.recurringItems,
      purchaseHistory,
      existingList: existingList?.items ?? null,
    })

    const list = await saveGroceryList(supabase, weekPlan.planId, user.id, items)
    revalidatePath('/grocery')
    return { items: list.items, listId: list.id }
  } catch (err) {
    console.error('generateList error:', err)
    return { error: 'Failed to generate list' }
  }
}

export async function toggleItem(
  listId: string,
  itemId: string,
  checked: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const { data: listRow } = await supabase
      .from('grocery_lists')
      .select('user_id, items')
      .eq('id', listId)
      .single()
    if (!listRow || listRow.user_id !== user.id) return { error: 'Unauthorized' }

    const items = (listRow.items as GroceryItem[]).map(item => {
      if (item.id !== itemId) return item
      return {
        ...item,
        checked,
        checked_at: checked ? new Date().toISOString() : undefined,
      }
    })

    await updateGroceryItems(supabase, listId, items)
    revalidatePath('/grocery')
    return {}
  } catch (err) {
    console.error('toggleItem error:', err)
    return { error: 'Failed to update item' }
  }
}

export async function addManualItem(
  listId: string,
  ingredient: string,
  amount: string,
  unit: string
): Promise<{ error?: string; item?: GroceryItem }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!ingredient.trim()) return { error: 'Ingredient name required' }

  try {
    const { data: listRow } = await supabase
      .from('grocery_lists')
      .select('user_id, items')
      .eq('id', listId)
      .single()
    if (!listRow || listRow.user_id !== user.id) return { error: 'Unauthorized' }

    const newItem: GroceryItem = {
      id: crypto.randomUUID(),
      ingredient: ingredient.trim(),
      amount: amount.trim() || null,
      unit: unit.trim(),
      category: categorize(ingredient.trim()),
      checked: false,
      sources: [],
      type: 'manual',
      pantry_status: null,
      pantry_override: null,
    }

    const items = [...(listRow.items as GroceryItem[]), newItem]
    await updateGroceryItems(supabase, listId, items)
    revalidatePath('/grocery')
    return { item: newItem }
  } catch (err) {
    console.error('addManualItem error:', err)
    return { error: 'Failed to add item' }
  }
}

export async function removeItem(
  listId: string,
  itemId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const { data: listRow } = await supabase
      .from('grocery_lists')
      .select('user_id, items')
      .eq('id', listId)
      .single()
    if (!listRow || listRow.user_id !== user.id) return { error: 'Unauthorized' }

    const items = (listRow.items as GroceryItem[]).filter(i => i.id !== itemId)
    await updateGroceryItems(supabase, listId, items)
    revalidatePath('/grocery')
    return {}
  } catch (err) {
    console.error('removeItem error:', err)
    return { error: 'Failed to remove item' }
  }
}

export async function setPantryOverride(
  listId: string,
  itemId: string,
  override: PantryStatus
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const { data: listRow } = await supabase
      .from('grocery_lists')
      .select('user_id, items')
      .eq('id', listId)
      .single()
    if (!listRow || listRow.user_id !== user.id) return { error: 'Unauthorized' }

    const items = (listRow.items as GroceryItem[]).map(item =>
      item.id === itemId ? { ...item, pantry_override: override } : item
    )
    await updateGroceryItems(supabase, listId, items)
    revalidatePath('/grocery')
    return {}
  } catch (err) {
    console.error('setPantryOverride error:', err)
    return { error: 'Failed to update pantry status' }
  }
}

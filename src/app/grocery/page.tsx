import { redirect } from 'next/navigation'
import { startOfWeek, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getWeekPlan } from '@/lib/planner/queries'
import { generateGroceryList } from '@/lib/grocery/generate'
import {
  getGroceryList,
  getPurchaseHistory,
  saveGroceryList,
  getProfileGroceryData,
  getPastLists,
} from '@/lib/grocery/queries'
import { GroceryList } from '@/components/grocery/GroceryList'

export default async function GroceryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const weekParam = Array.isArray(params.week) ? params.week[0] : params.week
  const weekStart = weekParam
    ? startOfWeek(parseISO(weekParam), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 })

  let weekPlan: Awaited<ReturnType<typeof getWeekPlan>>
  try {
    weekPlan = await getWeekPlan(supabase, user.id, weekStart)
  } catch (err) {
    console.error('[GroceryPage] getWeekPlan failed:', err)
    throw err
  }

  let existingList: Awaited<ReturnType<typeof getGroceryList>> = null
  let profileData: Awaited<ReturnType<typeof getProfileGroceryData>> = {
    pantryStaples: [],
    recurringItems: [],
  }
  let purchaseHistory: Awaited<ReturnType<typeof getPurchaseHistory>> = []

  try {
    ;[existingList, profileData, purchaseHistory] = await Promise.all([
      getGroceryList(supabase, weekPlan.planId),
      getProfileGroceryData(supabase, user.id),
      getPurchaseHistory(supabase, user.id),
    ])
  } catch (err) {
    console.error('[GroceryPage] data fetch failed:', err)
    throw err
  }

  // Always regenerate from the current plan so the list stays in sync with the planner.
  // generateGroceryList merges existingList to preserve manual items and pantry overrides.
  let list = existingList
  try {
    const items = generateGroceryList({
      planEntries: weekPlan.entries,
      pantryStaples: profileData.pantryStaples,
      recurringItems: profileData.recurringItems,
      purchaseHistory,
      existingList: existingList?.items ?? null,
    })
    list = await saveGroceryList(supabase, weekPlan.planId, user.id, items)
  } catch (err) {
    console.error('[GroceryPage] saveGroceryList failed:', err)
    // Fall back to the existing list if generation fails
    if (!list) throw err
  }

  const pastLists = await getPastLists(supabase, user.id, weekPlan.planId)

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Grocery List</h1>
      <GroceryList
        weekStart={weekStart.toISOString()}
        listId={list.id}
        planId={weekPlan.planId}
        initialItems={list.items}
        pastLists={pastLists}
      />
    </div>
  )
}

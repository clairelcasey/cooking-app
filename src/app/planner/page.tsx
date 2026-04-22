import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWeekPlan } from '@/lib/planner/queries'
import { getRecipes } from '@/lib/recipes/queries'
import { getProfile } from '@/lib/profile/queries'
import { WeeklyPlanner } from '@/components/planner/WeeklyPlanner'
import { startOfWeek, parseISO } from 'date-fns'

export default async function PlannerPage({
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

  const [weekPlan, recipes, profile] = await Promise.all([
    getWeekPlan(supabase, user.id, weekStart),
    getRecipes(supabase, user.id, {}),
    getProfile(supabase),
  ])

  const nutritionGoals = profile?.health_goals
    ? {
        protein_g: profile.health_goals.protein_goal_g,
        fiber_g: profile.health_goals.fiber_goal_g,
      }
    : undefined

  return (
    <WeeklyPlanner
      weekStart={weekStart.toISOString()}
      initialPlan={weekPlan}
      recipes={recipes}
      nutritionGoals={nutritionGoals}
    />
  )
}

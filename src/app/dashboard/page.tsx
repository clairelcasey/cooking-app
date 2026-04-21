import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWeekPlan } from '@/lib/planner/queries'
import { computeHealthScore } from '@/lib/nutrition/score'
import { format, startOfWeek } from 'date-fns'
import type { MealSlot, Nutrition } from '@/types/recipe'

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner']

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

function greeting(name: string | undefined): string {
  const hour = new Date().getUTCHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  return `Good ${timeOfDay}${name ? `, ${name.split(' ')[0]}` : ''}`
}

function sumNutrition(nutritionList: Nutrition[]): Nutrition {
  return nutritionList.reduce(
    (acc, n) => ({
      calories: (acc.calories ?? 0) + (n.calories ?? 0),
      protein_g: (acc.protein_g ?? 0) + (n.protein_g ?? 0),
      fiber_g: (acc.fiber_g ?? 0) + (n.fiber_g ?? 0),
      fat_g: (acc.fat_g ?? 0) + (n.fat_g ?? 0),
    }),
    {} as Nutrition
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const todayStr = format(today, 'yyyy-MM-dd')

  const weekPlan = await getWeekPlan(supabase, user.id, weekStart)

  const todayEntries = weekPlan.entries.filter((e) => e.entry_date === todayStr)

  // Today's meals by slot
  const todayBySlot = Object.fromEntries(
    SLOTS.map((slot) => [slot, todayEntries.find((e) => e.meal_slot === slot)])
  ) as Record<MealSlot, (typeof weekPlan.entries)[0] | undefined>

  // Today's nutrition (only entries with a linked recipe)
  const todayNutritions = todayEntries
    .filter((e) => e.recipe?.nutrition)
    .map((e) => e.recipe!.nutrition)
  const todayNutrition = todayNutritions.length > 0 ? sumNutrition(todayNutritions) : null

  // Weekly health score: average computeHealthScore across all planned recipe entries
  const weekRecipeEntries = weekPlan.entries.filter((e) => e.recipe?.nutrition)
  const weekHealthScore =
    weekRecipeEntries.length > 0
      ? Math.round(
          weekRecipeEntries.reduce(
            (sum, e) => sum + computeHealthScore(e.recipe!.nutrition),
            0
          ) / weekRecipeEntries.length
        )
      : null

  const name = user.user_metadata?.full_name as string | undefined

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{greeting(name)}</h1>
        <span className="text-sm text-muted-foreground">
          {format(today, 'EEEE, MMM d')}
        </span>
      </div>

      {/* Today's meals */}
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Today&apos;s meals
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SLOTS.map((slot) => {
            const entry = todayBySlot[slot]
            const recipe = entry?.recipe
            const title = recipe?.title ?? entry?.free_text_meal

            return (
              <div
                key={slot}
                className="rounded-lg border bg-card p-4 text-card-foreground"
              >
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {SLOT_LABELS[slot]}
                </p>
                {recipe ? (
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="font-medium hover:underline"
                  >
                    {recipe.title}
                  </Link>
                ) : title ? (
                  <p className="font-medium">{title}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nothing planned</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Health snapshot */}
      {(weekHealthScore !== null || todayNutrition !== null) && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Health this week
          </h2>
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            {weekHealthScore !== null && (
              <p className="mb-2 text-sm">
                <span className="font-medium">Weekly score:</span>{' '}
                <span className="text-lg font-semibold">{weekHealthScore}</span>
                <span className="text-muted-foreground"> / 100</span>
              </p>
            )}
            {todayNutrition !== null && (
              <p className="text-sm text-muted-foreground">
                Today:{' '}
                {[
                  todayNutrition.calories != null && `${Math.round(todayNutrition.calories)} kcal`,
                  todayNutrition.protein_g != null && `${Math.round(todayNutrition.protein_g)}g protein`,
                  todayNutrition.fiber_g != null && `${Math.round(todayNutrition.fiber_g)}g fiber`,
                  todayNutrition.fat_g != null && `${Math.round(todayNutrition.fat_g)}g fat`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

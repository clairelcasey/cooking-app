'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addWeeks, subWeeks, addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, ShoppingBasket } from 'lucide-react'
import { PlannerGrid } from './PlannerGrid'
import { RecipeSidePanel } from './RecipeSidePanel'
import { RecipePicker } from './RecipePicker'
import { NudgeBanner } from './NudgeBanner'
import { addPlanEntry, addQuickAddEntry, removePlanEntry } from '@/app/planner/actions'
import type { Nutrition, PlanEntry, WeekPlan, RecipeListItem, MealSlot } from '@/types/recipe'

interface NutritionGoals {
  protein_g?: number
  fiber_g?: number
}

interface WeeklyPlannerProps {
  weekStart: string
  initialPlan: WeekPlan
  recipes: RecipeListItem[]
  nutritionGoals?: NutritionGoals
}

export function WeeklyPlanner({ weekStart, initialPlan, recipes, nutritionGoals }: WeeklyPlannerProps) {
  const router = useRouter()
  const currentWeekStart = parseISO(weekStart)

  const [entries, setEntries] = useState<PlanEntry[]>(initialPlan.entries)
  const planId = initialPlan.planId

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingSlot, setPendingSlot] = useState<{ date: string; mealSlot: MealSlot } | null>(null)

  // ─── Week navigation ────────────────────────────────────────────────────────
  function navigate(direction: 'prev' | 'next') {
    const next =
      direction === 'next'
        ? addWeeks(currentWeekStart, 1)
        : subWeeks(currentWeekStart, 1)
    router.push(`/planner?week=${format(next, 'yyyy-MM-dd')}`)
  }

  // ─── Add via modal ───────────────────────────────────────────────────────────
  const handleOpenPicker = useCallback((date: string, mealSlot: MealSlot) => {
    setPendingSlot({ date, mealSlot })
    setPickerOpen(true)
  }, [])

  async function handlePickerSelect(recipe: RecipeListItem, date: string, mealSlot: MealSlot) {
    await assignRecipeToSlot(recipe, date, mealSlot)
  }

  // ─── Remove entry ────────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    async (entryId: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
      const result = await removePlanEntry(entryId)
      if (result.error) router.refresh()
    },
    [router]
  )

  // ─── Quick-add (free-text + nutrition) ──────────────────────────────────────
  const handleQuickAdd = useCallback(
    async (date: string, mealSlot: MealSlot, name: string, nutrition: Nutrition) => {
      const tempId = `temp__${Date.now()}`
      const optimisticEntry: PlanEntry = {
        id: tempId,
        plan_id: planId,
        entry_date: date,
        meal_slot: mealSlot,
        recipe_id: null,
        free_text_meal: name,
        status: 'planned',
        nutrition,
      }
      setEntries((prev) => [...prev, optimisticEntry])

      const result = await addQuickAddEntry(planId, date, mealSlot, name, nutrition)
      if (result.error || !result.id) {
        setEntries((prev) => prev.filter((e) => e.id !== tempId))
        router.refresh()
      } else {
        setEntries((prev) =>
          prev.map((e) => (e.id === tempId ? { ...e, id: result.id! } : e))
        )
      }
    },
    [planId, router]
  )

  // ─── Shared assign logic ─────────────────────────────────────────────────────
  async function assignRecipeToSlot(recipe: RecipeListItem, date: string, mealSlot: MealSlot) {
    const tempId = `temp__${Date.now()}`
    const optimisticEntry: PlanEntry = {
      id: tempId,
      plan_id: planId,
      entry_date: date,
      meal_slot: mealSlot,
      recipe_id: recipe.id,
      free_text_meal: null,
      status: 'planned',
      recipe: {
        id: recipe.id,
        title: recipe.title,
        image_url: recipe.image_url,
        prep_minutes: recipe.prep_minutes,
        nutrition: recipe.nutrition ?? {},
        ingredients: recipe.ingredients ?? [],
      },
    }
    setEntries((prev) => [...prev, optimisticEntry])

    const result = await addPlanEntry(planId, date, mealSlot, recipe.id)
    if (result.error || !result.id) {
      setEntries((prev) => prev.filter((e) => e.id !== tempId))
      router.refresh()
    } else {
      setEntries((prev) =>
        prev.map((e) => (e.id === tempId ? { ...e, id: result.id! } : e))
      )
    }
  }

  // ─── Drag-and-drop (native HTML5) ────────────────────────────────────────────
  const handleDrop = useCallback(
    (date: string, mealSlot: MealSlot, recipeId: string, sourceEntryId?: string) => {
      const recipe = recipes.find((r) => r.id === recipeId)
      if (!recipe) return
      const alreadyFilled = entries.some(
        (e) => e.entry_date === date && e.meal_slot === mealSlot
      )
      if (alreadyFilled) return

      if (sourceEntryId) {
        setEntries((prev) => prev.filter((e) => e.id !== sourceEntryId))
        removePlanEntry(sourceEntryId)
      }

      assignRecipeToSlot(recipe, date, mealSlot)
    },
    [recipes, entries]
  )

  const weekEnd = addDays(currentWeekStart, 6)
  const formattedRange =
    currentWeekStart.getFullYear() === weekEnd.getFullYear()
      ? `${format(currentWeekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`
      : `${format(currentWeekStart, 'MMM d, yyyy')} – ${format(weekEnd, 'MMM d, yyyy')}`

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('prev')}
            className="cursor-pointer rounded-lg border border-stone-200 bg-white p-1.5 text-stone-500 shadow-sm transition-colors hover:text-stone-900"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </button>

          <h1 className="text-base font-semibold text-stone-800 sm:text-lg">
            {formattedRange}
          </h1>

          <button
            onClick={() => navigate('next')}
            className="cursor-pointer rounded-lg border border-stone-200 bg-white p-1.5 text-stone-500 shadow-sm transition-colors hover:text-stone-900"
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Grocery list shortcut */}
        {(() => {
          const recipeIds = entries
            .filter(e => e.recipe_id)
            .map(e => e.recipe_id as string)
          const uniqueIds = [...new Set(recipeIds)]
          const href =
            uniqueIds.length > 0
              ? `/grocery?recipes=${uniqueIds.join(',')}`
              : '/grocery'
          return (
            <a
              href={href}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 shadow-sm transition-colors hover:text-stone-900"
            >
              <ShoppingBasket className="size-4" />
              Grocery List
            </a>
          )
        })()}
      </div>

      {/* Nutrition nudge banner */}
      <NudgeBanner
        weekStart={weekStart}
        entries={entries}
        recipes={recipes}
        onOpenAgent={(message) => {
          window.dispatchEvent(new CustomEvent('open-agent', { detail: { message } }))
        }}
      />

      {/* Main content: grid + side panel */}
      <div className="flex gap-4 items-start">
        <div className="min-w-0 flex-1">
          <PlannerGrid
            weekStart={currentWeekStart}
            entries={entries}
            nutritionGoals={nutritionGoals}
            onAdd={handleOpenPicker}
            onQuickAdd={handleQuickAdd}
            onRemove={handleRemove}
            onDrop={handleDrop}
          />
        </div>
        <RecipeSidePanel recipes={recipes} />
      </div>

      {/* Recipe picker modal */}
      <RecipePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        recipes={recipes}
        pendingSlot={pendingSlot}
        onSelect={handlePickerSelect}
      />
    </>
  )
}

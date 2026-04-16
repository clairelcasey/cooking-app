'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { addWeeks, subWeeks, addDays, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PlannerGrid } from './PlannerGrid'
import { RecipeSidePanel } from './RecipeSidePanel'
import { RecipePicker } from './RecipePicker'
import { addPlanEntry, removePlanEntry } from '@/app/planner/actions'
import type { PlanEntry, WeekPlan, RecipeListItem, MealSlot } from '@/types/recipe'

const DRAGGABLE_PREFIX = 'recipe__'

interface WeeklyPlannerProps {
  weekStart: string
  initialPlan: WeekPlan
  recipes: RecipeListItem[]
}

export function WeeklyPlanner({ weekStart, initialPlan, recipes }: WeeklyPlannerProps) {
  const router = useRouter()
  const currentWeekStart = parseISO(weekStart)

  const [entries, setEntries] = useState<PlanEntry[]>(initialPlan.entries)
  const planId = initialPlan.planId

  // Recipe picker state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingSlot, setPendingSlot] = useState<{ date: string; mealSlot: MealSlot } | null>(null)

  // Drag state — resolved by ID lookup to avoid React 19 DataRef timing issues
  const [activeDragRecipe, setActiveDragRecipe] = useState<RecipeListItem | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function recipeFromDragId(id: string): RecipeListItem | undefined {
    if (!id.startsWith(DRAGGABLE_PREFIX)) return undefined
    const recipeId = id.slice(DRAGGABLE_PREFIX.length)
    return recipes.find((r) => r.id === recipeId)
  }

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

  async function handlePickerSelect(
    recipe: RecipeListItem,
    date: string,
    mealSlot: MealSlot
  ) {
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

  // ─── Shared assign logic ─────────────────────────────────────────────────────
  async function assignRecipeToSlot(
    recipe: RecipeListItem,
    date: string,
    mealSlot: MealSlot
  ) {
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

  // ─── Drag handlers (use ID-based lookup, not data.current) ──────────────────
  function handleDragStart(event: DragStartEvent) {
    const recipe = recipeFromDragId(String(event.active.id))
    setActiveDragRecipe(recipe ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragRecipe(null)
    const { active, over } = event
    if (!over) return

    const recipe = recipeFromDragId(String(active.id))
    if (!recipe) return

    // over.id format: "2026-04-14__breakfast"
    const overId = String(over.id)
    const sep = overId.indexOf('__')
    if (sep === -1) return
    const date = overId.slice(0, sep)
    const mealSlot = overId.slice(sep + 2) as MealSlot
    if (!date || !mealSlot) return

    const alreadyFilled = entries.some(
      (e) => e.entry_date === date && e.meal_slot === mealSlot
    )
    if (alreadyFilled) return

    await assignRecipeToSlot(recipe, date, mealSlot)
  }

  const weekEnd = addDays(currentWeekStart, 6)
  const formattedRange =
    currentWeekStart.getFullYear() === weekEnd.getFullYear()
      ? `${format(currentWeekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`
      : `${format(currentWeekStart, 'MMM d, yyyy')} – ${format(weekEnd, 'MMM d, yyyy')}`

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('prev')}
            className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-500 shadow-sm transition-colors hover:text-stone-900"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </button>

          <h1 className="text-base font-semibold text-stone-800 sm:text-lg">
            {formattedRange}
          </h1>

          <button
            onClick={() => navigate('next')}
            className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-500 shadow-sm transition-colors hover:text-stone-900"
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Health score placeholder bar */}
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div className="h-full w-full bg-gradient-to-r from-red-200 via-amber-200 to-emerald-300 opacity-60" />
      </div>

      {/* Main content: grid + side panel */}
      <div className="flex gap-4 items-start">
        <div className="min-w-0 flex-1">
          <PlannerGrid
            weekStart={currentWeekStart}
            entries={entries}
            onAdd={handleOpenPicker}
            onRemove={handleRemove}
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

      {/* Drag overlay — floating card that follows the cursor */}
      <DragOverlay dropAnimation={null}>
        {activeDragRecipe ? (
          <div className="rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-xl opacity-95 cursor-grabbing">
            <span className="text-sm font-medium text-stone-800">
              {activeDragRecipe.title}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

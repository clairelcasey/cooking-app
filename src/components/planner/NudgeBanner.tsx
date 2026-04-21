'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Sparkles } from 'lucide-react'
import type { PlanEntry, RecipeListItem } from '@/types/recipe'

interface NudgeBannerProps {
  weekStart: string
  entries: PlanEntry[]
  recipes: RecipeListItem[]
  onOpenAgent: (message: string) => void
}

interface NutritionGap {
  label: string
  message: string
  agentPrompt: string
  nutrient: 'protein_g' | 'fiber_g'
}

function sumNutrient(entries: PlanEntry[], key: 'protein_g' | 'fiber_g'): number {
  return entries.reduce((sum, e) => {
    const nutrition = e.recipe?.nutrition ?? e.nutrition
    return sum + (nutrition?.[key] ?? 0)
  }, 0)
}

function entriesWithNutrition(entries: PlanEntry[]): number {
  return entries.filter((e) => {
    const n = e.recipe?.nutrition ?? e.nutrition
    return n && (n.protein_g || n.fiber_g || n.calories)
  }).length
}

/** Find the top recipes by a given nutrient, excluding ones already in the plan */
function topRecipesFor(
  recipes: RecipeListItem[],
  nutrient: 'protein_g' | 'fiber_g',
  planEntryIds: Set<string>,
  limit = 2
): RecipeListItem[] {
  return recipes
    .filter((r) => !planEntryIds.has(r.id) && (r.nutrition?.[nutrient] ?? 0) > 0)
    .sort((a, b) => (b.nutrition?.[nutrient] ?? 0) - (a.nutrition?.[nutrient] ?? 0))
    .slice(0, limit)
}

export function NudgeBanner({ weekStart, entries, recipes, onOpenAgent }: NudgeBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Per-week dismissal via localStorage
  const storageKey = `nudge-dismissed-${weekStart}`

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === '1')
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setDismissed(true)
  }

  const gap = useMemo<NutritionGap | null>(() => {
    // Only show nudge if there are at least 3 logged entries with nutrition data
    if (entriesWithNutrition(entries) < 3) return null

    const totalProtein = sumNutrient(entries, 'protein_g')
    const totalFiber = sumNutrient(entries, 'fiber_g')

    // Targets: 20g protein/day × 7 days = 140g, 5g fiber/day × 7 = 35g
    if (totalProtein < 70) {
      return {
        label: 'Low protein',
        message: `Your plan this week has ${Math.round(totalProtein)}g of protein — aim for at least 140g across the week.`,
        agentPrompt: 'My meal plan this week is low on protein. What high-protein recipes from my library should I add?',
        nutrient: 'protein_g',
      }
    }

    if (totalFiber < 20) {
      return {
        label: 'Low fiber',
        message: `Your plan has ${Math.round(totalFiber)}g of fiber this week — vegetables, legumes, or whole grains could help.`,
        agentPrompt: 'My meal plan this week is low on fiber. What recipes from my library would add more fiber?',
        nutrient: 'fiber_g',
      }
    }

    return null
  }, [entries])

  const planEntryIds = useMemo(
    () => new Set(entries.map((e) => e.recipe_id).filter(Boolean) as string[]),
    [entries]
  )

  const suggestions = useMemo(
    () => (gap ? topRecipesFor(recipes, gap.nutrient, planEntryIds) : []),
    [gap, recipes, planEntryIds]
  )

  if (!gap || dismissed) return null

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" />

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              {gap.label}
            </span>
          </div>
          <p className="text-sm text-amber-900 dark:text-amber-200">{gap.message}</p>

          {/* Recipe suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {r.title}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => onOpenAgent(gap.agentPrompt)}
            className="mt-2.5 text-xs font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
          >
            Ask the assistant →
          </button>
        </div>

        <button
          onClick={dismiss}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-amber-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, ChevronRight, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { FoodSearchItem } from '@/app/api/nutrition/food-search/route'
import type { Nutrition, MealSlot as MealSlotType } from '@/types/recipe'

interface SelectedFood {
  fdcId: number
  name: string
  qty: number
  measure: { label: string; gramWeight: number }
  nutrition: Nutrition
}

function computeNutrition(food: FoodSearchItem, qty: number, measureIdx: number): Nutrition {
  const grams = food.measures[measureIdx].gramWeight * qty
  const scale = grams / 100
  return {
    calories: Math.round(food.nutrients100g.calories * scale),
    protein_g: Math.round(food.nutrients100g.protein_g * scale * 10) / 10,
    carbs_g: Math.round(food.nutrients100g.carbs_g * scale * 10) / 10,
    fat_g: Math.round(food.nutrients100g.fat_g * scale * 10) / 10,
    fiber_g: Math.round(food.nutrients100g.fiber_g * scale * 10) / 10,
    sodium_mg: Math.round(food.nutrients100g.sodium_mg * scale),
    sat_fat_g: Math.round(food.nutrients100g.sat_fat_g * scale * 10) / 10,
  }
}

function sumNutritions(items: SelectedFood[]): Nutrition {
  return items.reduce(
    (acc, item) => ({
      calories: (acc.calories ?? 0) + (item.nutrition.calories ?? 0),
      protein_g: (acc.protein_g ?? 0) + (item.nutrition.protein_g ?? 0),
      carbs_g: (acc.carbs_g ?? 0) + (item.nutrition.carbs_g ?? 0),
      fat_g: (acc.fat_g ?? 0) + (item.nutrition.fat_g ?? 0),
      fiber_g: (acc.fiber_g ?? 0) + (item.nutrition.fiber_g ?? 0),
      sodium_mg: (acc.sodium_mg ?? 0) + (item.nutrition.sodium_mg ?? 0),
      sat_fat_g: (acc.sat_fat_g ?? 0) + (item.nutrition.sat_fat_g ?? 0),
    }),
    {} as Nutrition
  )
}

interface QuickAddPopoverProps {
  date: string
  mealSlot: MealSlotType
  isDragOver?: boolean
  onQuickAdd: (date: string, mealSlot: MealSlotType, name: string, nutrition: Nutrition) => void
  onOpenRecipePicker: (date: string, mealSlot: MealSlotType) => void
}

export function QuickAddPopover({
  date,
  mealSlot,
  isDragOver = false,
  onQuickAdd,
  onOpenRecipePicker,
}: QuickAddPopoverProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([])
  const [pendingFood, setPendingFood] = useState<FoodSearchItem | null>(null)
  const [pendingQty, setPendingQty] = useState(1)
  const [pendingMeasureIdx, setPendingMeasureIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state when popover closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setSelectedFoods([])
      setPendingFood(null)
      setPendingQty(1)
      setPendingMeasureIdx(0)
    } else {
      // Focus the search input when opening
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced food search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/nutrition/food-search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data: FoodSearchItem[] = await res.json()
          setResults(data)
        }
      } catch {
        // silently fail — user can still use free-text fallback
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function handleSelectFood(food: FoodSearchItem) {
    setPendingFood(food)
    setPendingQty(1)
    setPendingMeasureIdx(0)
  }

  function handleAddPendingFood() {
    if (!pendingFood) return
    const nutrition = computeNutrition(pendingFood, pendingQty, pendingMeasureIdx)
    setSelectedFoods((prev) => [
      ...prev,
      {
        fdcId: pendingFood.fdcId,
        name: pendingFood.name,
        qty: pendingQty,
        measure: pendingFood.measures[pendingMeasureIdx],
        nutrition,
      },
    ])
    setPendingFood(null)
    setQuery('')
    setResults([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleRemoveSelected(idx: number) {
    setSelectedFoods((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleAddToPlanner() {
    if (selectedFoods.length === 0 && !query.trim()) return

    let name: string
    let nutrition: Nutrition

    if (selectedFoods.length > 0) {
      name = selectedFoods.map((f) => f.name).join(' + ')
      nutrition = sumNutritions(selectedFoods)
    } else {
      name = query.trim()
      nutrition = {}
    }

    onQuickAdd(date, mealSlot, name, nutrition)
    setOpen(false)
  }

  function handleAddFreeText() {
    if (!query.trim()) return
    onQuickAdd(date, mealSlot, query.trim(), {})
    setOpen(false)
  }

  const previewNutrition = pendingFood
    ? computeNutrition(pendingFood, pendingQty, pendingMeasureIdx)
    : null

  const total = selectedFoods.length > 0 ? sumNutritions(selectedFoods) : null
  const canAdd = selectedFoods.length > 0 || query.trim().length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'group flex min-h-[60px] w-full items-center justify-center rounded-lg border border-dashed transition-all',
          isDragOver
            ? 'border-amber-400 bg-amber-50'
            : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50'
        )}
        aria-label={`Add ${mealSlot}`}
      >
        <Plus
          className={cn(
            'size-4 transition-opacity',
            isDragOver ? 'opacity-100 text-amber-500' : 'text-stone-400 opacity-0 group-hover:opacity-100 sm:opacity-100'
          )}
        />
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 overflow-hidden" side="bottom" align="start" sideOffset={4}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center border-b border-stone-100 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Add {mealSlot}
            </span>
          </div>

          {pendingFood ? (
            /* ── Qty picker panel ── */
            <div className="flex flex-col gap-3 p-3">
              <p className="line-clamp-2 text-xs font-medium text-stone-800">{pendingFood.name}</p>

              <div className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-xs text-stone-500">Qty</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPendingQty((q) => Math.max(1, q - 1))}
                    className="flex size-6 items-center justify-center rounded border border-stone-200 text-stone-500 hover:bg-stone-50"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium tabular-nums">{pendingQty}</span>
                  <button
                    onClick={() => setPendingQty((q) => q + 1)}
                    className="flex size-6 items-center justify-center rounded border border-stone-200 text-stone-500 hover:bg-stone-50"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-xs text-stone-500">Size</span>
                <select
                  value={pendingMeasureIdx}
                  onChange={(e) => setPendingMeasureIdx(Number(e.target.value))}
                  className="min-w-0 flex-1 rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-800 outline-none focus:border-stone-400"
                >
                  {pendingFood.measures.map((m, i) => (
                    <option key={i} value={i}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {previewNutrition && (
                <p className="text-xs text-stone-400">
                  ≈ {previewNutrition.calories ?? 0} kcal &middot; {previewNutrition.protein_g ?? 0}g protein
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setPendingFood(null)}
                  className="flex-1 rounded-lg border border-stone-200 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
                >
                  Back
                </button>
                <button
                  onClick={handleAddPendingFood}
                  className="flex-1 rounded-lg bg-amber-500 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  Add item
                </button>
              </div>
            </div>
          ) : (
            /* ── Search panel ── */
            <div className="flex flex-col">
              {/* Search input */}
              <div className="relative px-3 pt-2.5 pb-1.5">
                <Search className="pointer-events-none absolute left-5.5 top-1/2 mt-0.5 size-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim() && results.length === 0 && !isSearching) {
                      handleAddFreeText()
                    }
                  }}
                  placeholder="Search foods…"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-7 pr-3 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:bg-white"
                />
              </div>

              {/* Loading */}
              {isSearching && (
                <div className="flex items-center justify-center py-5">
                  <Loader2 className="size-4 animate-spin text-stone-400" />
                </div>
              )}

              {/* Results list */}
              {!isSearching && results.length > 0 && (
                <ul className="max-h-48 overflow-y-auto border-t border-stone-100">
                  {results.map((food) => (
                    <li key={food.fdcId}>
                      <button
                        onClick={() => handleSelectFood(food)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-stone-50"
                      >
                        <span className="line-clamp-1 min-w-0 flex-1 text-xs text-stone-700">
                          {food.name}
                        </span>
                        <span className="shrink-0 text-xs text-stone-400 tabular-nums">
                          {food.nutrients100g.calories} kcal
                        </span>
                        <ChevronRight className="size-3 shrink-0 text-stone-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Free-text fallback */}
              {!isSearching && query.trim().length > 0 && (
                <div className="border-t border-stone-100">
                  <button
                    onClick={handleAddFreeText}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-stone-50"
                  >
                    <Plus className="size-3 shrink-0 text-stone-400" />
                    <span className="text-xs text-stone-500">
                      Add &ldquo;{query.trim()}&rdquo; without nutrition data
                    </span>
                  </button>
                </div>
              )}

              {/* Empty hint */}
              {!isSearching && query.length === 0 && (
                <p className="px-3 pb-2.5 text-xs text-stone-400">
                  Type at least 2 characters to search
                </p>
              )}
            </div>
          )}

          {/* Selected food chips */}
          {selectedFoods.length > 0 && (
            <div className="border-t border-stone-100 px-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                {selectedFoods.map((food, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200"
                  >
                    <span className="max-w-[150px] truncate">
                      {food.name} &middot; {food.nutrition.calories ?? 0} kcal
                    </span>
                    <button
                      onClick={() => handleRemoveSelected(idx)}
                      className="ml-0.5 text-amber-400 hover:text-amber-700"
                      aria-label={`Remove ${food.name}`}
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Running nutrition total */}
          {total && (
            <div className="border-t border-stone-100 px-3 py-1.5">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-stone-800">{total.calories ?? 0} kcal</span>
                <span className="text-stone-500">{Math.round(total.protein_g ?? 0)}g protein</span>
                <span className="text-stone-500">{Math.round(total.carbs_g ?? 0)}g carbs</span>
                <span className="text-stone-500">{Math.round(total.fat_g ?? 0)}g fat</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 border-t border-stone-100 px-3 py-2">
            <button
              onClick={handleAddToPlanner}
              disabled={!canAdd}
              className="flex-1 rounded-lg bg-amber-500 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to planner
            </button>
            <button
              onClick={() => {
                setOpen(false)
                onOpenRecipePicker(date, mealSlot)
              }}
              className="shrink-0 text-xs text-stone-500 hover:text-stone-800"
            >
              Browse recipes →
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

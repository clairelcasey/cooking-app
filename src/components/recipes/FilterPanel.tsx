'use client'

import { useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Difficulty, MealType } from '@/types/recipe'

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
]

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'cook_count:desc', label: 'Most cooked' },
  { value: 'last_cooked_at:desc', label: 'Recently cooked' },
  { value: 'prep_minutes:asc', label: 'Quickest prep' },
]

export function FilterPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function getParam(key: string) {
    return searchParams.get(key) ?? ''
  }

  const currentSearch = getParam('search')
  const currentDifficulty = getParam('difficulty') as Difficulty | ''
  const currentMealType = getParam('mealType') as MealType | ''
  const currentVegetarian = getParam('vegetarian') === 'true'
  const currentSort = getParam('sort') || 'created_at:desc'

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, val] of Object.entries(updates)) {
        if (val) {
          params.set(key, val)
        } else {
          params.delete(key)
        }
      }
      router.replace(`/recipes?${params.toString()}`)
    },
    [router, searchParams]
  )

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParams({ search: val }), 300)
  }

  const hasFilters = !!(
    currentSearch ||
    currentDifficulty ||
    currentMealType ||
    currentVegetarian ||
    currentSort !== 'created_at:desc'
  )

  return (
    <div className="sticky top-0 z-10 bg-background/95 pb-3 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Row 1: search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            defaultValue={currentSearch}
            onChange={handleSearch}
            placeholder="Search recipes…"
            className="pl-8"
          />
        </div>
        <Select
          value={currentSort}
          onValueChange={(val) => {
            if (!val) return
            updateParams({ sort: val })
          }}
        >
          <SelectTrigger className="w-36 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: meal type + vegetarian + difficulty */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MEAL_TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              updateParams({ mealType: currentMealType === value ? '' : value })
            }
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              currentMealType === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-transparent text-foreground hover:bg-muted'
            )}
          >
            {label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => updateParams({ vegetarian: currentVegetarian ? '' : 'true' })}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            currentVegetarian
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-transparent text-foreground hover:bg-muted'
          )}
        >
          Vegetarian
        </button>

        <div className="mx-1 self-center border-r border-border h-4" />

        {DIFFICULTIES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              updateParams({ difficulty: currentDifficulty === value ? '' : value })
            }
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              currentDifficulty === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-transparent text-foreground hover:bg-muted'
            )}
          >
            {label}
          </button>
        ))}

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace('/recipes')}
            className="flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <X className="size-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

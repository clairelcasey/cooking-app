'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Difficulty } from '@/types/recipe'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'rating:desc', label: 'Highest rated' },
  { value: 'cook_count:desc', label: 'Most cooked' },
  { value: 'last_cooked_at:desc', label: 'Recently cooked' },
  { value: 'prep_minutes:asc', label: 'Quickest prep' },
]

interface FilterPanelProps {
  cuisines: string[]
}

export function FilterPanel({ cuisines }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mobileOpen, setMobileOpen] = useState(false)

  function getParam(key: string) {
    return searchParams.get(key) ?? ''
  }

  const currentSearch = getParam('search')
  const currentCuisine = getParam('cuisine')
  const currentDifficulty = getParam('difficulty') as Difficulty | ''
  const currentMinRating = Number(getParam('minRating') || 1)
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

  function clearAll() {
    router.replace('/recipes')
  }

  const hasFilters = !!(currentSearch || currentCuisine || currentDifficulty || getParam('minRating') || (currentSort !== 'created_at:desc'))

  const filterContent = (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={currentSearch}
          onChange={handleSearch}
          placeholder="Search recipes…"
          className="pl-8"
        />
      </div>

      <Separator />

      {/* Sort */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Sort by</p>
        <Select
          value={currentSort}
          onValueChange={(val) => {
            if (!val) return
            const [sortBy, sortDir] = val.split(':')
            updateParams({ sort: val, sortBy: sortBy ?? '', sortDir: sortDir ?? '' })
          }}
        >
          <SelectTrigger className="w-full">
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

      <Separator />

      {/* Cuisine */}
      {cuisines.length > 0 && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Cuisine</p>
            <Select
              value={currentCuisine || '__all__'}
              onValueChange={(val) => updateParams({ cuisine: !val || val === '__all__' ? '' : val })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All cuisines</SelectItem>
                {cuisines.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
        </>
      )}

      {/* Difficulty */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Difficulty</p>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <Button
              key={d}
              type="button"
              variant={currentDifficulty === d ? 'default' : 'outline'}
              size="sm"
              className="flex-1 capitalize"
              onClick={() => updateParams({ difficulty: currentDifficulty === d ? '' : d })}
            >
              {d}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Min rating */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Min rating</p>
          <span className="text-sm text-muted-foreground">
            {currentMinRating > 1 ? `${currentMinRating}+ stars` : 'Any'}
          </span>
        </div>
        <Slider
          value={[currentMinRating]}
          min={1}
          max={5}
          step={1}
          onValueChange={(v) => {
            const val = Array.isArray(v) ? v[0] : v
            updateParams({ minRating: val != null && val > 1 ? String(val) : '' })
          }}
        />
      </div>

      {hasFilters && (
        <>
          <Separator />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-muted-foreground"
            onClick={clearAll}
          >
            <X className="size-4" />
            Clear all filters
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="lg:w-56 lg:shrink-0">
      {/* Mobile: dialog trigger button — sits above the grid in the flex-col layout */}
      <div className="lg:hidden">
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
            <SlidersHorizontal className="size-4" />
            Filters
            {hasFilters && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                •
              </span>
            )}
          </DialogTrigger>
          <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Filter &amp; sort</DialogTitle>
            </DialogHeader>
            {filterContent}
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className={cn('hidden lg:block')}>
        <div className="sticky top-4">
          <p className="mb-4 text-sm font-semibold">Filter &amp; sort</p>
          {filterContent}
        </div>
      </aside>
    </div>
  )
}

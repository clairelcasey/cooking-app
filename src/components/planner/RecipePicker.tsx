'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { RecipeListItem, MealSlot } from '@/types/recipe'

interface RecipePickerProps {
  open: boolean
  onClose: () => void
  recipes: RecipeListItem[]
  pendingSlot: { date: string; mealSlot: MealSlot } | null
  onSelect: (recipe: RecipeListItem, date: string, mealSlot: MealSlot) => void
}

export function RecipePicker({
  open,
  onClose,
  recipes,
  pendingSlot,
  onSelect,
}: RecipePickerProps) {
  const [search, setSearch] = useState('')

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(recipe: RecipeListItem) {
    if (!pendingSlot) return
    onSelect(recipe, pendingSlot.date, pendingSlot.mealSlot)
    setSearch('')
    onClose()
  }

  const mealLabel = pendingSlot
    ? pendingSlot.mealSlot.charAt(0).toUpperCase() + pendingSlot.mealSlot.slice(1)
    : ''

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setSearch(''); onClose() } }}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-stone-100">
          <DialogHeader>
            <DialogTitle className="text-stone-800">
              Add {mealLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              placeholder="Search recipes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-stone-50 border-stone-200"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[50dvh] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-stone-400">
              No recipes found
            </p>
          ) : (
            filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleSelect(recipe)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  'hover:bg-stone-50 focus:bg-stone-50 focus:outline-none'
                )}
              >
                <span className="flex-1 truncate text-sm font-medium text-stone-800">
                  {recipe.title}
                </span>
                {recipe.cuisine && (
                  <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                    {recipe.cuisine}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

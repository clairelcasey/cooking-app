'use client'

import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { generateFromRecipes } from '@/app/grocery/actions'
import type { RecipeListItem } from '@/types/recipe'
import type { GroceryItem } from '@/types/grocery'

interface GroceryRecipePickerProps {
  open: boolean
  onClose: () => void
  recipes: RecipeListItem[]
  initialSelectedIds: string[]
  onGenerate: (items: GroceryItem[], listId: string) => void
}

export function GroceryRecipePicker({
  open,
  onClose,
  recipes,
  initialSelectedIds,
  onGenerate,
}: GroceryRecipePickerProps) {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  )
  const [isGenerating, setIsGenerating] = useState(false)

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  function toggleRecipe(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleGenerate() {
    if (selectedIds.size === 0) return
    setIsGenerating(true)
    const result = await generateFromRecipes([...selectedIds])
    setIsGenerating(false)
    if (result.items && result.listId) {
      onGenerate(result.items, result.listId)
      setSearch('')
      onClose()
    }
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      setSearch('')
      onClose()
    }
  }

  const selectedCount = selectedIds.size

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-sm flex-col overflow-hidden p-0 sm:max-w-md">
        {/* Header */}
        <div className="shrink-0 border-b border-stone-100 px-4 pb-3 pt-4">
          <DialogHeader>
            <DialogTitle className="text-stone-800">Select Recipes</DialogTitle>
          </DialogHeader>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              placeholder="Search recipes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 border-stone-200 bg-stone-50 pl-8"
              autoFocus
            />
          </div>
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-stone-400">No recipes found</p>
          ) : (
            filtered.map(recipe => {
              const selected = selectedIds.has(recipe.id)
              return (
                <button
                  key={recipe.id}
                  onClick={() => toggleRecipe(recipe.id)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    'hover:bg-stone-50 focus:bg-stone-50 focus:outline-none',
                    selected && 'bg-stone-50'
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                      selected ? 'border-stone-800 bg-stone-800' : 'border-stone-300'
                    )}
                  >
                    {selected && <Check className="size-3 text-white" />}
                  </div>

                  {/* Thumbnail */}
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt=""
                      className="size-9 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="size-9 shrink-0 rounded-md bg-stone-100" />
                  )}

                  {/* Title + meta */}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-stone-800">
                      {recipe.title}
                    </span>
                    {recipe.prep_minutes && (
                      <span className="text-xs text-stone-400">{recipe.prep_minutes} min</span>
                    )}
                  </div>

                  {recipe.difficulty && (
                    <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs capitalize text-stone-500">
                      {recipe.difficulty}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-stone-100 px-4 py-3">
          <button
            onClick={handleGenerate}
            disabled={selectedCount === 0 || isGenerating}
            className={cn(
              'w-full cursor-pointer rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors',
              'hover:bg-stone-700',
              'disabled:pointer-events-none disabled:opacity-40'
            )}
          >
            {isGenerating
              ? 'Generating…'
              : selectedCount === 0
              ? 'Select recipes to generate'
              : `Generate list · ${selectedCount} recipe${selectedCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

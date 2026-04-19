'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RecipeListItem } from '@/types/recipe'

interface RecipeSidePanelProps {
  recipes: RecipeListItem[]
}

export function RecipeSidePanel({ recipes }: RecipeSidePanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div className="hidden lg:flex">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-3 text-xs font-medium text-stone-500 shadow-sm transition-colors hover:text-stone-800"
          aria-label="Open recipe panel"
        >
          <ChevronLeft className="size-3.5" />
          <span className="[writing-mode:vertical-lr] rotate-180">Recipes</span>
        </button>
      </div>
    )
  }

  return (
    <div className="hidden lg:flex w-52 shrink-0 flex-col rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-stone-100 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Recipes
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="rounded p-0.5 text-stone-400 transition-colors hover:text-stone-700"
            aria-label="Collapse recipe panel"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-stone-400">Drag to add to your plan</p>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {recipes.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-stone-400">No recipes yet</p>
        ) : (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', recipe.id)}
              className="px-3 py-2.5 text-sm text-stone-700 rounded-lg cursor-grab hover:bg-stone-50 select-none truncate"
            >
              {recipe.title}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

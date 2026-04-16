'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecipeListItem } from '@/types/recipe'

interface DraggableRecipeRowProps {
  recipe: RecipeListItem
}

function DraggableRecipeRow({ recipe }: DraggableRecipeRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe__${recipe.id}`,
    data: { recipe },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
        'cursor-grab active:cursor-grabbing select-none',
        isDragging ? 'opacity-40' : 'hover:bg-stone-50'
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-3.5 shrink-0 text-stone-300" />
      <span className="flex-1 truncate text-sm text-stone-700">{recipe.title}</span>
      {recipe.cuisine && (
        <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-xs text-stone-400">
          {recipe.cuisine}
        </span>
      )}
    </div>
  )
}

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
          className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-3 text-xs font-medium text-stone-500 shadow-sm transition-colors hover:text-stone-800 writing-mode-vertical"
          aria-label="Open recipe panel"
        >
          <ChevronLeft className="size-3.5" />
          <span className="[writing-mode:vertical-lr] rotate-180">Recipes</span>
        </button>
      </div>
    )
  }

  return (
    <div className="hidden lg:flex w-56 shrink-0 flex-col rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2.5">
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

      <p className="px-3 py-2 text-xs text-stone-400">
        Drag a recipe into a slot
      </p>

      <div className="flex-1 overflow-y-auto py-1">
        {recipes.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-stone-400">
            No recipes yet
          </p>
        ) : (
          recipes.map((recipe) => (
            <DraggableRecipeRow key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  )
}

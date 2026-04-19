'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanEntry, MealSlot as MealSlotType } from '@/types/recipe'

interface MealSlotProps {
  date: string
  mealSlot: MealSlotType
  entry: PlanEntry | undefined
  onAdd: (date: string, mealSlot: MealSlotType) => void
  onRemove: (entryId: string) => void
  onDrop: (date: string, mealSlot: MealSlotType, recipeId: string, sourceEntryId?: string) => void
}

export function MealSlot({ date, mealSlot, entry, onAdd, onRemove, onDrop }: MealSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const dropProps = {
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const recipeId = e.dataTransfer.getData('text/plain')
      const sourceEntryId = e.dataTransfer.getData('application/x-entry-id') || undefined
      if (recipeId) onDrop(date, mealSlot, recipeId, sourceEntryId)
    },
  }

  if (entry?.recipe || entry?.free_text_meal) {
    const title = entry.recipe?.title ?? entry.free_text_meal ?? ''
    return (
      <div
        {...dropProps}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', entry.recipe?.id ?? '')
          e.dataTransfer.setData('application/x-entry-id', entry.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        className={cn(
          'group relative flex w-full min-h-[60px] cursor-grab items-start overflow-hidden rounded-lg border bg-white px-2.5 py-1.5 shadow-sm transition-all',
          isDragOver ? 'ring-2 ring-amber-400 border-amber-300' : 'border-stone-200'
        )}
      >
        <span className="line-clamp-3 text-xs font-medium leading-snug text-stone-800 pr-4">{title}</span>
        <button
          onClick={() => onRemove(entry.id)}
          className="absolute top-1.5 right-1.5 rounded p-0.5 text-stone-300 opacity-0 transition-opacity hover:text-stone-600 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Remove ${title}`}
        >
          <X className="size-3" />
        </button>
      </div>
    )
  }

  return (
    <button
      {...dropProps}
      onClick={() => onAdd(date, mealSlot)}
      className={cn(
        'group flex min-h-[60px] w-full items-center justify-center rounded-lg border border-dashed transition-all',
        isDragOver
          ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400'
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
    </button>
  )
}

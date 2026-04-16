'use client'

import { useDroppable } from '@dnd-kit/core'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanEntry, MealSlot as MealSlotType } from '@/types/recipe'

interface MealSlotProps {
  date: string
  mealSlot: MealSlotType
  entry: PlanEntry | undefined
  onAdd: (date: string, mealSlot: MealSlotType) => void
  onRemove: (entryId: string) => void
}

export function MealSlot({ date, mealSlot, entry, onAdd, onRemove }: MealSlotProps) {
  const droppableId = `${date}__${mealSlot}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })

  if (entry?.recipe || entry?.free_text_meal) {
    const title = entry.recipe?.title ?? entry.free_text_meal ?? ''
    return (
      <div
        ref={setNodeRef}
        className={cn(
          'group relative flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm transition-all',
          isOver ? 'ring-2 ring-amber-400 border-amber-300' : 'border-stone-200'
        )}
      >
        <span className="flex-1 truncate text-sm font-medium text-stone-800">
          {title}
        </span>
        <button
          onClick={() => onRemove(entry.id)}
          className="shrink-0 rounded p-0.5 text-stone-300 opacity-0 transition-opacity hover:text-stone-600 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Remove ${title}`}
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      ref={setNodeRef}
      onClick={() => onAdd(date, mealSlot)}
      className={cn(
        'group flex min-h-[44px] w-full items-center justify-center rounded-lg border border-dashed transition-all',
        isOver
          ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400'
          : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50'
      )}
      aria-label={`Add ${mealSlot}`}
    >
      <Plus
        className={cn(
          'size-4 transition-opacity',
          isOver ? 'opacity-100 text-amber-500' : 'text-stone-400 opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-100'
        )}
      />
    </button>
  )
}

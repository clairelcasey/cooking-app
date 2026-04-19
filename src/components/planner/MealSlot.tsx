'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickAddPopover } from './QuickAddPopover'
import type { Nutrition, PlanEntry, MealSlot as MealSlotType } from '@/types/recipe'

interface MealSlotProps {
  date: string
  mealSlot: MealSlotType
  entry: PlanEntry | undefined
  onAdd: (date: string, mealSlot: MealSlotType) => void
  onQuickAdd: (date: string, mealSlot: MealSlotType, name: string, nutrition: Nutrition) => void
  onRemove: (entryId: string) => void
  onDrop: (date: string, mealSlot: MealSlotType, recipeId: string, sourceEntryId?: string) => void
}

export function MealSlot({ date, mealSlot, entry, onAdd, onQuickAdd, onRemove, onDrop }: MealSlotProps) {
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
    <div
      {...dropProps}
      className={cn(
        'w-full rounded-lg transition-all',
        isDragOver ? 'ring-2 ring-amber-400' : ''
      )}
    >
      <QuickAddPopover
        date={date}
        mealSlot={mealSlot}
        isDragOver={isDragOver}
        onQuickAdd={onQuickAdd}
        onOpenRecipePicker={onAdd}
      />
    </div>
  )
}

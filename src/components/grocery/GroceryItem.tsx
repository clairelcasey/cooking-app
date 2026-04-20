'use client'

import { Check, X, Star, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GroceryItem, PantryStatus } from '@/types/grocery'

interface GroceryItemRowProps {
  item: GroceryItem
  onToggle: (id: string, checked: boolean) => void
  onRemove: (id: string) => void
  onPantryOverride: (id: string, override: PantryStatus) => void
}

export function GroceryItemRow({ item, onToggle, onRemove, onPantryOverride }: GroceryItemRowProps) {
  const qty = [item.amount, item.unit].filter(Boolean).join(' ')

  return (
    <div className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, !item.checked)}
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          item.checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/40 hover:border-primary'
        )}
        aria-label={item.checked ? 'Uncheck item' : 'Check item'}
      >
        {item.checked && <Check className="size-3" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span
            className={cn(
              'text-sm font-medium leading-snug',
              item.checked && 'line-through text-muted-foreground'
            )}
          >
            {item.ingredient}
          </span>
          {qty && (
            <span className="text-xs text-muted-foreground">{qty}</span>
          )}
          {item.type === 'restock' && !item.checked && (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600">
              <Star className="size-3 fill-current" />
              restock
            </span>
          )}
          {item.type === 'recurring' && item.sources.length === 0 && !item.checked && (
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground/60">
              <RotateCcw className="size-3" />
              weekly
            </span>
          )}
        </div>

        {item.sources.length > 0 && !item.checked && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground/60">
            {item.sources.join(' · ')}
          </p>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.id)}
        className="mt-0.5 shrink-0 text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
        aria-label={`Remove ${item.ingredient}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

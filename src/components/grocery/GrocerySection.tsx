'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GroceryItemRow } from './GroceryItem'
import { CATEGORY_LABELS } from '@/lib/grocery/categories'
import type { GroceryCategory, GroceryItem, PantryStatus } from '@/types/grocery'

interface GrocerySectionProps {
  category: GroceryCategory
  items: GroceryItem[]
  onToggle: (id: string, checked: boolean) => void
  onRemove: (id: string) => void
  onPantryOverride: (id: string, override: PantryStatus) => void
}

export function GrocerySection({
  category,
  items,
  onToggle,
  onRemove,
  onPantryOverride,
}: GrocerySectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const label = CATEGORY_LABELS[category]

  return (
    <div className="mb-1">
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex w-full cursor-pointer items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>
          {label}
          <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/60">
            ({items.length})
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform duration-150',
            collapsed && '-rotate-90'
          )}
        />
      </button>

      {!collapsed && (
        <div className="space-y-0.5">
          {items.map(item => (
            <GroceryItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onRemove={onRemove}
              onPantryOverride={onPantryOverride}
            />
          ))}
        </div>
      )}
    </div>
  )
}

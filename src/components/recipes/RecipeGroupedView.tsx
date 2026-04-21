'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RecipeGrid } from './RecipeGrid'
import type { RecipeListItem, MealType } from '@/types/recipe'

interface MealGroup {
  label: string
  recipes: RecipeListItem[]
}

interface RecipeGroupedViewProps {
  groups: Record<MealType | 'other', RecipeListItem[]>
}

const SECTION_ORDER: Array<{ key: MealType | 'other'; label: string }> = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'other', label: 'Other' },
]

function CollapsibleSection({ label, recipes }: MealGroup) {
  const [open, setOpen] = useState(true)

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-2 py-2 text-left"
      >
        <h2 className="text-base font-semibold">{label}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {recipes.length}
        </span>
        <ChevronDown
          className={cn('ml-auto size-4 text-muted-foreground transition-transform duration-200', {
            '-rotate-180': open,
          })}
        />
      </button>

      {open && (
        <div className="pb-6 pt-1">
          <RecipeGrid recipes={recipes} />
        </div>
      )}
    </section>
  )
}

export function RecipeGroupedView({ groups }: RecipeGroupedViewProps) {
  const visibleSections = SECTION_ORDER.filter(({ key }) => groups[key].length > 0)

  if (visibleSections.length === 0) {
    return <RecipeGrid recipes={[]} />
  }

  return (
    <div className="divide-y divide-border">
      {visibleSections.map(({ key, label }) => (
        <CollapsibleSection key={key} label={label} recipes={groups[key]} />
      ))}
    </div>
  )
}

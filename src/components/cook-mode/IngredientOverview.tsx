'use client'

import { ChevronRight, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SCALE_STEPS, type ScaleFactor, type ScaledIngredient } from '@/lib/cook-mode/scale'

interface IngredientOverviewProps {
  title: string
  scaleFactor: ScaleFactor
  onScaleChange: (factor: ScaleFactor) => void
  unitSystem: 'metric' | 'imperial'
  onUnitSystemChange: (system: 'metric' | 'imperial') => void
  scaledIngredients: ScaledIngredient[]
  onStart: () => void
}

export function IngredientOverview({
  title,
  scaleFactor,
  onScaleChange,
  unitSystem,
  onUnitSystemChange,
  scaledIngredients,
  onStart,
}: IngredientOverviewProps) {
  const currentIndex = SCALE_STEPS.indexOf(scaleFactor)

  function decreaseScale() {
    if (currentIndex > 0) onScaleChange(SCALE_STEPS[currentIndex - 1])
  }

  function increaseScale() {
    if (currentIndex < SCALE_STEPS.length - 1) onScaleChange(SCALE_STEPS[currentIndex + 1])
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Title */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-semibold leading-tight">{title}</h1>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between px-6 pb-4">
        {/* Scale control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={decreaseScale}
            disabled={currentIndex === 0}
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            aria-label="Decrease scale"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-10 text-center text-sm font-semibold tabular-nums">
            {scaleFactor}×
          </span>
          <button
            type="button"
            onClick={increaseScale}
            disabled={currentIndex === SCALE_STEPS.length - 1}
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            aria-label="Increase scale"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {/* Unit toggle */}
        <div className="flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => onUnitSystemChange('metric')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              unitSystem === 'metric'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Metric
          </button>
          <button
            type="button"
            onClick={() => onUnitSystemChange('imperial')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              unitSystem === 'imperial'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Imperial
          </button>
        </div>
      </div>

      {/* Ingredient list */}
      <div className="flex-1 overflow-y-auto px-6">
        <ul className="divide-y divide-border">
          {scaledIngredients.map((ing, i) => (
            <li key={i} className="flex items-baseline gap-3 py-3">
              <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums text-primary">
                {ing.badge}
              </span>
              <span className="text-sm text-foreground">
                {ing.ingredient}
                {ing.note && (
                  <span className="ml-1 text-xs text-muted-foreground">({ing.note})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-6 py-6">
        <Button className="w-full gap-2" size="lg" onClick={onStart}>
          Start Cooking
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

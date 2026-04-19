'use client'

import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  computeNutritionDimensions,
  type ProteinLevel,
  type CalorieLevel,
  type WholeFoodsLevel,
  type MacroBalance,
  type FiberLevel,
  type SatietyLabel,
} from '@/lib/nutrition/score'
import type { Ingredient, Nutrition } from '@/types/recipe'

interface NutritionBreakdownProps {
  nutrition: Nutrition | null | undefined
  ingredients: Ingredient[]
  compact?: boolean
  className?: string
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function proteinColor(level: ProteinLevel) {
  if (level === 'high') return 'bg-green-500'
  if (level === 'medium') return 'bg-amber-400'
  return 'bg-red-400'
}

function proteinBadgeColor(level: ProteinLevel) {
  if (level === 'high') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  if (level === 'medium') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

function calorieColor(level: CalorieLevel) {
  if (level === 'light') return 'bg-green-500'
  if (level === 'moderate') return 'bg-amber-400'
  return 'bg-red-400'
}

function calorieBadgeColor(level: CalorieLevel) {
  if (level === 'light') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  if (level === 'moderate') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

function wholeFoodsBadgeColor(level: WholeFoodsLevel) {
  if (level === 'clean') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  if (level === 'mixed') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

function macroBadgeColor(balance: MacroBalance) {
  return balance === 'balanced'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
}

function fiberColor(level: FiberLevel) {
  if (level === 'high') return 'bg-green-500'
  if (level === 'medium') return 'bg-amber-400'
  return 'bg-red-400'
}

function fiberBadgeColor(level: FiberLevel) {
  if (level === 'high') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  if (level === 'medium') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

function satietyBadgeColor(label: SatietyLabel) {
  if (label === 'high') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  if (label === 'moderate') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

// ─── Bar component ────────────────────────────────────────────────────────────

function Bar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn('h-full rounded-full transition-all', colorClass)}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

// ─── Compact view (recipe card) ───────────────────────────────────────────────

function CompactBreakdown({ nutrition, ingredients }: { nutrition: Nutrition; ingredients: Ingredient[] }) {
  const d = computeNutritionDimensions(nutrition, ingredients)

  const chips = [
    {
      label: d.proteinLevel === 'high' ? 'High protein' : d.proteinLevel === 'medium' ? 'Med protein' : 'Low protein',
      color: proteinBadgeColor(d.proteinLevel),
    },
    {
      label: d.calorieLevel === 'light' ? 'Light' : d.calorieLevel === 'moderate' ? 'Moderate' : 'Heavy',
      color: calorieBadgeColor(d.calorieLevel),
    },
    {
      label: d.fiberLevel === 'high' ? `${d.fiberG}g fiber` : d.fiberLevel === 'medium' ? `${d.fiberG}g fiber` : 'Low fiber',
      color: fiberBadgeColor(d.fiberLevel),
    },
    {
      label: d.wholeFoods === 'clean' ? 'Clean' : d.wholeFoods === 'mixed' ? 'Mixed' : 'Processed',
      color: wholeFoodsBadgeColor(d.wholeFoods),
    },
    {
      label: d.macroBalance === 'balanced' ? 'Balanced' : 'Unbalanced',
      color: macroBadgeColor(d.macroBalance),
    },
    {
      label: d.satietyLabel === 'high' ? 'High satiety' : d.satietyLabel === 'moderate' ? 'Moderate satiety' : 'Low satiety',
      color: satietyBadgeColor(d.satietyLabel),
    },
  ]

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', chip.color)}
        >
          {chip.label}
        </span>
      ))}
    </div>
  )
}

// ─── Full view (recipe detail) ────────────────────────────────────────────────

function FullBreakdown({ nutrition, ingredients }: { nutrition: Nutrition; ingredients: Ingredient[] }) {
  const d = computeNutritionDimensions(nutrition, ingredients)

  // Protein bar: scale 0–50g → 0–100%
  const proteinBarPct = Math.min((d.proteinG / 50) * 100, 100)
  // Calorie bar: scale 0–800kcal → 0–100%
  const caloriePct = Math.min((d.calories / 800) * 100, 100)
  // Fiber bar: scale 0–10g → 0–100%
  const fiberBarPct = Math.min((d.fiberG / 10) * 100, 100)

  return (
    <div className="space-y-4">
      {/* Protein */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Protein</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{d.proteinG}g / serving</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', proteinBadgeColor(d.proteinLevel))}>
              {d.proteinLevel}
            </span>
          </div>
        </div>
        <Bar pct={proteinBarPct} colorClass={proteinColor(d.proteinLevel)} />
      </div>

      {/* Calories */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Calories</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{d.calories} kcal / serving</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', calorieBadgeColor(d.calorieLevel))}>
              {d.calorieLevel}
            </span>
          </div>
        </div>
        <Bar pct={caloriePct} colorClass={calorieColor(d.calorieLevel)} />
      </div>

      {/* Fiber */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Fiber</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{d.fiberG}g / serving</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', fiberBadgeColor(d.fiberLevel))}>
              {d.fiberLevel}
            </span>
          </div>
        </div>
        <Bar pct={fiberBarPct} colorClass={fiberColor(d.fiberLevel)} />
        <p className="text-[10px] text-muted-foreground">Goal: ~7g per meal · based on 25g/day target</p>
      </div>

      {/* Whole Foods */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Ingredients</span>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', wholeFoodsBadgeColor(d.wholeFoods))}>
          {d.wholeFoods === 'clean' ? 'Whole foods' : d.wholeFoods === 'mixed' ? 'Mixed' : 'Processed'}
        </span>
      </div>

      {/* Macro balance */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Macro balance</span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', macroBadgeColor(d.macroBalance))}>
            {d.macroBalance === 'balanced' ? 'Balanced' : 'Unbalanced'}
          </span>
        </div>
        {/* Stacked macro bar */}
        <div className="flex h-2 w-full overflow-hidden rounded-full">
          <div className="bg-blue-400" style={{ width: `${d.proteinPct}%` }} title={`Protein ${d.proteinPct}%`} />
          <div className="bg-amber-400" style={{ width: `${d.fatPct}%` }} title={`Fat ${d.fatPct}%`} />
          <div className="bg-stone-300" style={{ width: `${d.carbPct}%` }} title={`Carbs ${d.carbPct}%`} />
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-blue-400" />Protein {d.proteinPct}%</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-amber-400" />Fat {d.fatPct}%</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-stone-300" />Carbs {d.carbPct}%</span>
        </div>
      </div>

      {/* Fat Loss Signal */}
      <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Fat Loss Signal</span>
            <Popover>
              <PopoverTrigger
                aria-label="What is Fat Loss Signal?"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="size-3.5" />
              </PopoverTrigger>
              <PopoverContent className="w-72 text-sm" side="top">
                <div className="space-y-3">
                  <p className="font-semibold">What is the Fat Loss Signal?</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    This score estimates how well a single meal supports fat loss — not by cutting calories, but by keeping you fuller for longer so you naturally eat less overall.
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <p className="font-medium">It's based on two things research consistently shows matter most:</p>
                    <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                      <li><span className="font-medium text-foreground">Protein % of calories</span> — protein is the most satiating macronutrient. Aim for 25–40% of a meal's calories coming from protein.</li>
                      <li><span className="font-medium text-foreground">Fiber density</span> — fiber slows digestion and suppresses hunger hormones. Aim for 7g+ of fiber per meal.</li>
                    </ul>
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2 text-xs space-y-1">
                    <p className="font-medium">What to aim for per meal:</p>
                    <p className="text-muted-foreground">🟢 High satiety — protein &gt;25% of cals + 5g+ fiber</p>
                    <p className="text-muted-foreground">🟡 Moderate — decent protein or fiber, not both</p>
                    <p className="text-muted-foreground">🔴 Low satiety — likely to leave you hungry</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    This is a per-recipe signal. For fat loss, most meals should score Moderate or High.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', satietyBadgeColor(d.satietyLabel))}>
            {d.satietyLabel === 'high' ? 'High satiety' : d.satietyLabel === 'moderate' ? 'Moderate' : 'Low satiety'}
          </span>
        </div>
        <div className="space-y-0.5 text-[11px] text-muted-foreground">
          <div className="flex justify-between">
            <span>Protein density</span>
            <span>{d.proteinPct}% of calories</span>
          </div>
          <div className="flex justify-between">
            <span>Fiber density</span>
            <span>{d.fiberDensity}g per 100 kcal</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">Est. per serving · assumes 4 servings</p>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function NutritionBreakdown({ nutrition, ingredients, compact = false, className }: NutritionBreakdownProps) {
  if (!nutrition || Object.keys(nutrition).length === 0) return null

  return (
    <div className={className}>
      {compact ? (
        <CompactBreakdown nutrition={nutrition} ingredients={ingredients} />
      ) : (
        <FullBreakdown nutrition={nutrition} ingredients={ingredients} />
      )}
    </div>
  )
}

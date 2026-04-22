'use client'

import { cn } from '@/lib/utils'
import type { Nutrition } from '@/types/recipe'

interface NutritionGoals {
  protein_g: number
  fiber_g: number
}

const DEFAULT_GOALS: NutritionGoals = { protein_g: 120, fiber_g: 25 }

interface DayNutritionBarProps {
  nutritionList: Nutrition[]
  goals?: Partial<NutritionGoals>
  className?: string
}

function sumNutrition(list: Nutrition[]): Nutrition {
  return list.reduce(
    (acc, n) => ({
      calories: (acc.calories ?? 0) + (n.calories ?? 0),
      protein_g: (acc.protein_g ?? 0) + (n.protein_g ?? 0),
      carbs_g: (acc.carbs_g ?? 0) + (n.carbs_g ?? 0),
      fat_g: (acc.fat_g ?? 0) + (n.fat_g ?? 0),
      fiber_g: (acc.fiber_g ?? 0) + (n.fiber_g ?? 0),
      sodium_mg: (acc.sodium_mg ?? 0) + (n.sodium_mg ?? 0),
      sat_fat_g: (acc.sat_fat_g ?? 0) + (n.sat_fat_g ?? 0),
    }),
    {} as Nutrition
  )
}

function fiberBarColor(fiberG: number, goalG: number): string {
  if (fiberG >= goalG) return 'bg-green-500'
  if (fiberG >= 12) return 'bg-amber-400'
  return 'bg-red-400'
}

function fiberTextColor(fiberG: number, goalG: number): string {
  if (fiberG >= goalG) return 'text-green-600 dark:text-green-400'
  if (fiberG >= 12) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

interface MacroRowProps {
  label: string
  value: number
  goal: number
  barColor: string
  textColor?: string
}

function MacroRow({ label, value, goal, barColor, textColor }: MacroRowProps) {
  const pct = Math.min(value / goal, 1) * 100
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-medium', textColor)}>
          {Math.round(value)}g{' '}
          <span className="font-normal text-muted-foreground">/ {goal}g</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={barColor} style={{ width: `${pct}%`, height: '100%' }} />
      </div>
    </div>
  )
}

export function DayNutritionBar({ nutritionList, goals, className }: DayNutritionBarProps) {
  const valid = nutritionList.filter((n) => n && Object.keys(n).length > 0)
  if (valid.length === 0) return null

  const total = sumNutrition(valid)
  const protein = total.protein_g ?? 0
  const calories = total.calories ?? 0
  const fiber = total.fiber_g ?? 0

  const proteinGoal = goals?.protein_g ?? DEFAULT_GOALS.protein_g
  const fiberGoal = goals?.fiber_g ?? DEFAULT_GOALS.fiber_g

  return (
    <div className={cn('space-y-1.5 px-1 py-1.5', className)}>
      <MacroRow
        label="Protein"
        value={protein}
        goal={proteinGoal}
        barColor="bg-blue-400"
      />
      <MacroRow
        label="Fiber"
        value={fiber}
        goal={fiberGoal}
        barColor={fiberBarColor(fiber, fiberGoal)}
        textColor={fiberTextColor(fiber, fiberGoal)}
      />
      <p className="text-[9px] text-muted-foreground">
        {calories} kcal · {valid.length} meal{valid.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

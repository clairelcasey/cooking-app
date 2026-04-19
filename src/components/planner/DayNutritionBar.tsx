'use client'

import { cn } from '@/lib/utils'
import type { Nutrition } from '@/types/recipe'

interface DayNutritionBarProps {
  nutritionList: Nutrition[]
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

function fiberColor(fiberG: number): string {
  if (fiberG >= 20) return 'text-green-600 dark:text-green-400'
  if (fiberG >= 12) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

export function DayNutritionBar({ nutritionList, className }: DayNutritionBarProps) {
  const valid = nutritionList.filter((n) => n && Object.keys(n).length > 0)
  if (valid.length === 0) return null

  const total = sumNutrition(valid)

  const protein = total.protein_g ?? 0
  const calories = total.calories ?? 0
  const carbs = total.carbs_g ?? 0
  const fat = total.fat_g ?? 0
  const fiber = total.fiber_g ?? 0

  // Macro % of calories
  const totalMacroCals = protein * 4 + carbs * 4 + fat * 9
  const proteinPct = totalMacroCals > 0 ? Math.round((protein * 4 / totalMacroCals) * 100) : 0
  const fatPct = totalMacroCals > 0 ? Math.round((fat * 9 / totalMacroCals) * 100) : 0
  const carbPct = totalMacroCals > 0 ? Math.round((carbs * 4 / totalMacroCals) * 100) : 0

  return (
    <div className={cn('space-y-1 px-1 py-1.5', className)}>
      {/* Calories + protein row */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-medium text-foreground">{calories} kcal</span>
        <span>{Math.round(protein)}g protein</span>
      </div>

      {/* Stacked macro bar */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="bg-blue-400" style={{ width: `${proteinPct}%` }} />
        <div className="bg-amber-400" style={{ width: `${fatPct}%` }} />
        <div className="bg-stone-300" style={{ width: `${carbPct}%` }} />
      </div>

      {/* Fiber row */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">Fiber</span>
        <span className={cn('font-medium', fiberColor(fiber))}>
          {Math.round(fiber)}g <span className="font-normal text-muted-foreground">/ 25g</span>
        </span>
      </div>

      <p className="text-[9px] text-muted-foreground">
        {valid.length} meal{valid.length !== 1 ? 's' : ''} tracked
      </p>
    </div>
  )
}

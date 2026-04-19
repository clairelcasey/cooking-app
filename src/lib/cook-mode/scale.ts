import type { Ingredient } from '@/types/recipe'
import { convertAmount } from '@/lib/recipes/conversions'

export const SCALE_STEPS = [0.5, 1, 1.5, 2, 3] as const
export type ScaleFactor = (typeof SCALE_STEPS)[number]

export interface ScaledIngredient {
  ingredient: string
  amount: string
  unit: string
  note?: string
  /** Pre-formatted badge text shown inline in step descriptions, e.g. "2 cups" or "100 g" */
  badge: string
}

/** Parse a fraction string like "1/2" or mixed "1 1/2" into a float */
export function parseAmount(amount: string | number | null): number {
  if (amount == null) return 0
  if (typeof amount === 'number') return isNaN(amount) ? 0 : amount

  const str = amount.trim()
  // Mixed number: "1 1/2"
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3])
  // Simple fraction: "1/2"
  const fraction = str.match(/^(\d+)\/(\d+)$/)
  if (fraction) return parseInt(fraction[1]) / parseInt(fraction[2])

  return parseFloat(str) || 0
}

const NICE_FRACTIONS: [number, string][] = [
  [1 / 8, '⅛'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [3 / 8, '⅜'],
  [1 / 2, '½'],
  [5 / 8, '⅝'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [7 / 8, '⅞'],
]

/** Format a number as a human-readable amount string, preferring nice fractions */
export function formatScaledAmount(value: number): string {
  if (value === 0) return '0'
  if (value < 0) return String(parseFloat(value.toFixed(2)))

  const whole = Math.floor(value)
  const frac = value - whole

  // Close enough to an integer
  if (Math.abs(frac) < 0.05) return String(Math.round(value))

  for (const [fracVal, symbol] of NICE_FRACTIONS) {
    if (Math.abs(frac - fracVal) < 0.04) {
      return whole > 0 ? `${whole}${symbol}` : symbol
    }
  }

  // Fall back to a clean decimal
  return parseFloat(value.toFixed(2)).toString()
}

/**
 * Scale a recipe's ingredients by `factor` and convert to the target unit system.
 * Returns ScaledIngredient[] ready for render-time amount injection.
 */
export function scaleIngredients(
  ingredients: Ingredient[],
  factor: number,
  unitSystem: 'metric' | 'imperial',
): ScaledIngredient[] {
  return ingredients.map((ing) => {
    const raw = parseAmount(ing.amount)
    const scaled = raw * factor

    // convertAmount handles unit-system conversion
    const converted = convertAmount(scaled, ing.unit, unitSystem)

    const formattedAmount = formatScaledAmount(parseFloat(converted.amount) || scaled)

    return {
      ingredient: ing.ingredient,
      amount: formattedAmount,
      unit: converted.unit,
      note: ing.note,
      badge: [formattedAmount, converted.unit].filter(Boolean).join(' '),
    }
  })
}

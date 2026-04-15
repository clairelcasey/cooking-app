import type { Ingredient } from '@/types/recipe'

// Source of truth: metric. Conversions to imperial at display time.
const METRIC_TO_IMPERIAL: Record<string, { factor: number; unit: string }> = {
  ml: { factor: 1 / 236.588, unit: 'cup' },
  g: { factor: 1 / 28.3495, unit: 'oz' },
  kg: { factor: 1 / 0.453592, unit: 'lb' },
  l: { factor: 1 / 0.946353, unit: 'qt' },
}

const IMPERIAL_TO_METRIC: Record<string, { factor: number; unit: string }> = {
  cup: { factor: 236.588, unit: 'ml' },
  cups: { factor: 236.588, unit: 'ml' },
  tbsp: { factor: 14.787, unit: 'ml' },
  tsp: { factor: 4.929, unit: 'ml' },
  oz: { factor: 28.3495, unit: 'g' },
  lb: { factor: 453.592, unit: 'g' },
  lbs: { factor: 453.592, unit: 'g' },
}

function formatAmount(value: number): string {
  if (value === Math.floor(value)) return String(value)
  return parseFloat(value.toFixed(2)).toString()
}

export function convertAmount(
  amount: number | string | null,
  unit: string,
  targetSystem: 'metric' | 'imperial'
): { amount: string; unit: string } {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  if (isNaN(numAmount)) return { amount: String(amount ?? ''), unit }

  const unitLower = unit.toLowerCase()

  if (targetSystem === 'imperial') {
    const conversion = METRIC_TO_IMPERIAL[unitLower]
    if (!conversion) return { amount: formatAmount(numAmount), unit }
    return { amount: formatAmount(numAmount * conversion.factor), unit: conversion.unit }
  } else {
    const conversion = IMPERIAL_TO_METRIC[unitLower]
    if (!conversion) return { amount: formatAmount(numAmount), unit }
    return { amount: formatAmount(numAmount * conversion.factor), unit: conversion.unit }
  }
}

export function convertIngredients(
  ingredients: Ingredient[],
  targetSystem: 'metric' | 'imperial'
): Ingredient[] {
  return ingredients.map((ing) => {
    const { amount, unit } = convertAmount(ing.amount, ing.unit, targetSystem)
    return { ...ing, amount, unit }
  })
}

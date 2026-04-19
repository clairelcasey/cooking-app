import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1'

const NUTRIENT_IDS = {
  calories: 1008,
  protein_g: 1003,
  carbs_g: 1005,
  fat_g: 1004,
  fiber_g: 1079,
  sodium_mg: 1093,
  sat_fat_g: 1258,
}

export interface FoodSearchItem {
  fdcId: number
  name: string
  nutrients100g: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number
    sodium_mg: number
    sat_fat_g: number
  }
  measures: { label: string; gramWeight: number }[]
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'q param is required' }, { status: 400 })
  }

  const apiKey = process.env.USDA_FDC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'USDA API key not configured' }, { status: 500 })
  }

  const url = new URL(`${FDC_BASE}/foods/search`)
  url.searchParams.set('query', q)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('dataType', 'Foundation,SR Legacy')
  url.searchParams.set('pageSize', '8')

  let data: {
    foods?: Array<{
      fdcId: number
      description: string
      foodNutrients: Array<{ nutrientId: number; value: number }>
      foodMeasures?: Array<{ disseminationText: string; gramWeight: number }>
    }>
  }

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 },
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'USDA API error' }, { status: 502 })
    }
    data = await res.json()
  } catch {
    return NextResponse.json({ error: 'USDA API unreachable' }, { status: 502 })
  }

  const foods: FoodSearchItem[] = (data.foods ?? []).map((food) => {
    function getNutrient(id: number): number {
      return food.foodNutrients.find((n) => n.nutrientId === id)?.value ?? 0
    }

    const measures: FoodSearchItem['measures'] = (food.foodMeasures ?? [])
      .filter((m) => m.gramWeight > 0)
      .map((m) => ({ label: m.disseminationText, gramWeight: m.gramWeight }))

    // Always include 100g as a fallback measure
    measures.push({ label: '100g', gramWeight: 100 })

    return {
      fdcId: food.fdcId,
      name: food.description,
      nutrients100g: {
        calories: Math.round(getNutrient(NUTRIENT_IDS.calories)),
        protein_g: Math.round(getNutrient(NUTRIENT_IDS.protein_g) * 10) / 10,
        carbs_g: Math.round(getNutrient(NUTRIENT_IDS.carbs_g) * 10) / 10,
        fat_g: Math.round(getNutrient(NUTRIENT_IDS.fat_g) * 10) / 10,
        fiber_g: Math.round(getNutrient(NUTRIENT_IDS.fiber_g) * 10) / 10,
        sodium_mg: Math.round(getNutrient(NUTRIENT_IDS.sodium_mg)),
        sat_fat_g: Math.round(getNutrient(NUTRIENT_IDS.sat_fat_g) * 10) / 10,
      },
      measures,
    }
  })

  return NextResponse.json(foods)
}

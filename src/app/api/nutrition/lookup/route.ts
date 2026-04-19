import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lookupRecipeNutrition } from '@/lib/nutrition/lookup'
import type { Ingredient } from '@/types/recipe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { ingredients?: Ingredient[]; servings?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { ingredients, servings = 4 } = body
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json({ error: 'ingredients array is required' }, { status: 400 })
  }

  const result = await lookupRecipeNutrition(ingredients, servings)
  if (!result) {
    return NextResponse.json({ error: 'Could not determine nutrition for these ingredients' }, { status: 422 })
  }

  return NextResponse.json(result)
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { lookupRecipeNutrition } from '@/lib/nutrition/lookup'
import type { RecipeFormValues } from '@/lib/validations/recipe'
import type { Ingredient, Nutrition, RecipeStep } from '@/types/recipe'

function parseIngredients(raw: RecipeFormValues['ingredients']): Ingredient[] {
  return raw.map((ing) => ({
    amount: isNaN(parseFloat(ing.amount)) ? ing.amount : parseFloat(ing.amount),
    unit: ing.unit ?? '',
    ingredient: ing.ingredient,
    note: ing.note || undefined,
  }))
}

function parseSteps(raw: RecipeFormValues['steps']): RecipeStep[] {
  return raw.map((step, index) => ({
    order: index + 1,
    description: step.description,
    duration_minutes:
      step.duration_minutes === '' || step.duration_minutes === undefined
        ? null
        : Number(step.duration_minutes),
  }))
}

function parseNumber(val: string | number | undefined | ''): number | null {
  if (val === '' || val === undefined) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('recipe-images')
    .upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
  return data.publicUrl
}

async function deleteImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  imageUrl: string
): Promise<void> {
  // Extract path from public URL: .../object/public/recipe-images/{path}
  const marker = '/object/public/recipe-images/'
  const idx = imageUrl.indexOf(marker)
  if (idx === -1) return
  const path = imageUrl.slice(idx + marker.length)
  await supabase.storage.from('recipe-images').remove([path])
}

export async function createRecipe(
  formData: RecipeFormValues,
  imageFile?: File,
  existingImageUrl?: string
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  let image_url: string | null = existingImageUrl ?? null
  if (imageFile && imageFile.size > 0) {
    image_url = await uploadImage(supabase, user.id, imageFile)
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      owner_id: user.id,
      title: formData.title,
      description: formData.description || null,
      source_url: formData.source_url || null,
      cuisine: formData.cuisine || null,
      difficulty: formData.difficulty || null,
      meal_type: formData.meal_type || null,
      is_vegetarian: formData.is_vegetarian ?? false,
      prep_minutes: parseNumber(formData.prep_minutes),
      cook_minutes: parseNumber(formData.cook_minutes),
      visibility: formData.visibility,
      notes: formData.notes || null,
      ingredients: parseIngredients(formData.ingredients),
      steps: parseSteps(formData.steps),
      image_url,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/recipes')

  // Async nutrition lookup — best-effort, does not block the response
  const ingredients = parseIngredients(formData.ingredients)
  lookupRecipeNutrition(ingredients).then((result) => {
    if (!result) return
    createClient().then((sb) =>
      sb
        .from('recipes')
        .update({ nutrition: result.nutrition, health_score: result.health_score })
        .eq('id', data.id)
    )
  }).catch(() => {/* silently ignore nutrition lookup failures */})

  return { id: data.id }
}

export async function updateRecipe(
  id: string,
  formData: RecipeFormValues,
  imageFile?: File
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify ownership
  const { data: existing } = await supabase
    .from('recipes')
    .select('id, owner_id, image_url')
    .eq('id', id)
    .single()
  if (!existing || existing.owner_id !== user.id) return { error: 'Not found' }

  let image_url = existing.image_url as string | null
  if (imageFile && imageFile.size > 0) {
    if (image_url) await deleteImage(supabase, image_url)
    image_url = await uploadImage(supabase, user.id, imageFile)
  }

  const { error } = await supabase
    .from('recipes')
    .update({
      title: formData.title,
      description: formData.description || null,
      source_url: formData.source_url || null,
      cuisine: formData.cuisine || null,
      difficulty: formData.difficulty || null,
      meal_type: formData.meal_type || null,
      is_vegetarian: formData.is_vegetarian ?? false,
      prep_minutes: parseNumber(formData.prep_minutes),
      cook_minutes: parseNumber(formData.cook_minutes),
      visibility: formData.visibility,
      notes: formData.notes || null,
      ingredients: parseIngredients(formData.ingredients),
      steps: parseSteps(formData.steps),
      image_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/recipes')
  revalidatePath(`/recipes/${id}`)

  // Async nutrition lookup — best-effort
  const ingredients = parseIngredients(formData.ingredients)
  lookupRecipeNutrition(ingredients).then((result) => {
    if (!result) return
    createClient().then((sb) =>
      sb
        .from('recipes')
        .update({ nutrition: result.nutrition, health_score: result.health_score })
        .eq('id', id)
    )
  }).catch(() => {/* silently ignore nutrition lookup failures */})

  return {}
}

export async function patchRecipe(
  id: string,
  data: Partial<{
    title: string
    description: string | null
    notes: string | null
    cuisine: string | null
    difficulty: 'easy' | 'medium' | 'hard' | null
    meal_type: 'breakfast' | 'lunch' | 'dinner' | null
    is_vegetarian: boolean
    prep_minutes: number | null
    cook_minutes: number | null
    visibility: 'private' | 'family' | 'public'
    source_url: string | null
    ingredients: Ingredient[]
    steps: RecipeStep[]
    nutrition: Nutrition
    health_score: number | null
  }>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: existing } = await supabase
    .from('recipes')
    .select('id, owner_id')
    .eq('id', id)
    .single()
  if (!existing || existing.owner_id !== user.id) return { error: 'Not found' }

  const { error } = await supabase
    .from('recipes')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/recipes')
  revalidatePath(`/recipes/${id}`)
  return {}
}

export async function deleteRecipe(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: existing } = await supabase
    .from('recipes')
    .select('id, owner_id, image_url')
    .eq('id', id)
    .single()
  if (!existing || existing.owner_id !== user.id) return { error: 'Not found' }

  if (existing.image_url) {
    await deleteImage(supabase, existing.image_url as string)
  }

  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/recipes')
  redirect('/recipes')
}

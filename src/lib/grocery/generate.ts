import type { GroceryItem, GroceryItemType, PantryStatus, PantryStaple, RecurringItem } from '@/types/grocery'
import type { Ingredient, PlanEntry } from '@/types/recipe'
import { parseAmount, formatScaledAmount } from '@/lib/cook-mode/scale'
import { categorize } from './categories'
import { getShelfLifeDays } from './shelf-life'

// ─── Normalization ─────────────────────────────────────────────────────────────

export function normalizeIngredientName(name: string): string {
  let s = name.toLowerCase().trim()
  s = s.replace(/\s+/g, ' ')
  // Strip trailing 'oes' (tomatoes → tomato, potatoes → potato)
  if (s.endsWith('oes') && s.length > 5) {
    s = s.slice(0, -2)
  // Strip trailing 'ies' → 'y' (berries → berry)
  } else if (s.endsWith('ies') && s.length > 4) {
    s = s.slice(0, -3) + 'y'
  // Strip trailing 's' for simple plurals (eggs → egg, chickens → chicken)
  } else if (s.endsWith('s') && !s.endsWith('ss') && s.length > 4) {
    s = s.slice(0, -1)
  }
  return s
}

// ─── Unit families ─────────────────────────────────────────────────────────────

type UnitFamily = 'volume' | 'weight' | 'count' | 'unknown'

const VOLUME_UNITS = new Set(['ml', 'l', 'cup', 'cups', 'tbsp', 'tsp', 'fl oz', 'qt', 'pint', 'gallon'])
const WEIGHT_UNITS = new Set(['g', 'kg', 'oz', 'lb', 'lbs', 'pound', 'pounds'])
const COUNT_UNITS = new Set([
  '', 'piece', 'pieces', 'whole', 'can', 'cans', 'package', 'packages',
  'pkg', 'head', 'heads', 'bunch', 'bunches', 'clove', 'cloves',
  'stalk', 'stalks', 'sprig', 'sprigs', 'slice', 'slices', 'strip', 'strips',
  'fillet', 'fillets', 'large', 'medium', 'small',
])

function getUnitFamily(unit: string): UnitFamily {
  const u = unit.toLowerCase().trim()
  if (VOLUME_UNITS.has(u)) return 'volume'
  if (WEIGHT_UNITS.has(u)) return 'weight'
  if (COUNT_UNITS.has(u)) return 'count'
  return 'unknown'
}

// ─── Base unit conversions ─────────────────────────────────────────────────────

const TO_ML: Record<string, number> = {
  ml: 1, l: 1000,
  cup: 236.588, cups: 236.588,
  tbsp: 14.787, tsp: 4.929,
  'fl oz': 29.5735,
  qt: 946.353, pint: 473.176, gallon: 3785.41,
}

const TO_GRAMS: Record<string, number> = {
  g: 1, kg: 1000,
  oz: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
}

function toMl(amount: number, unit: string): number | null {
  const factor = TO_ML[unit.toLowerCase().trim()]
  return factor != null ? amount * factor : null
}

function toGrams(amount: number, unit: string): number | null {
  const factor = TO_GRAMS[unit.toLowerCase().trim()]
  return factor != null ? amount * factor : null
}

function formatVolume(ml: number, preferredUnit: string): { amount: string; unit: string } {
  const factor = TO_ML[preferredUnit.toLowerCase().trim()]
  if (factor) return { amount: formatScaledAmount(ml / factor), unit: preferredUnit }
  // Fall back to sensible unit
  if (ml < 5) return { amount: formatScaledAmount(ml / 4.929), unit: 'tsp' }
  if (ml < 60) return { amount: formatScaledAmount(ml / 14.787), unit: 'tbsp' }
  if (ml < 1000) return { amount: formatScaledAmount(ml / 236.588), unit: 'cup' }
  return { amount: formatScaledAmount(ml / 1000), unit: 'l' }
}

function formatWeight(g: number, preferredUnit: string): { amount: string; unit: string } {
  const factor = TO_GRAMS[preferredUnit.toLowerCase().trim()]
  if (factor) return { amount: formatScaledAmount(g / factor), unit: preferredUnit }
  if (g < 1000) return { amount: formatScaledAmount(g), unit: 'g' }
  return { amount: formatScaledAmount(g / 1000), unit: 'kg' }
}

// ─── Deduplication ─────────────────────────────────────────────────────────────

interface RawIngredient {
  ingredient: string
  amount: string | number | null
  unit: string
  source: string
  type: GroceryItemType
}

export function deduplicateIngredients(items: RawIngredient[]): GroceryItem[] {
  // Group by normalized name
  const groups = new Map<string, RawIngredient[]>()
  for (const item of items) {
    const key = normalizeIngredientName(item.ingredient)
    const existing = groups.get(key) ?? []
    existing.push(item)
    groups.set(key, existing)
  }

  const result: GroceryItem[] = []

  for (const group of groups.values()) {
    // Sources = unique recipe titles (exclude 'Recurring' pseudo-source)
    const sources = [...new Set(
      group.filter(i => i.type === 'recipe').map(i => i.source).filter(Boolean)
    )]
    // recipe type takes priority over recurring
    const dominantType: GroceryItemType =
      group.some(i => i.type === 'recipe') ? 'recipe' : group[0].type

    if (group.length === 1) {
      const item = group[0]
      result.push({
        id: crypto.randomUUID(),
        ingredient: item.ingredient,
        amount: item.amount != null ? String(item.amount) : null,
        unit: item.unit,
        category: categorize(item.ingredient),
        checked: false,
        sources,
        type: dominantType,
        pantry_status: null,
        pantry_override: null,
      })
      continue
    }

    const preferredUnit = group[0].unit
    const family = getUnitFamily(preferredUnit)
    const allSameFamily = group.every(i => getUnitFamily(i.unit) === family)

    if (family === 'volume' && allSameFamily) {
      const totalMl = group.reduce(
        (sum, i) => sum + (toMl(parseAmount(i.amount), i.unit) ?? 0), 0
      )
      const { amount, unit } = formatVolume(totalMl, preferredUnit)
      result.push({
        id: crypto.randomUUID(),
        ingredient: group[0].ingredient,
        amount,
        unit,
        category: categorize(group[0].ingredient),
        checked: false,
        sources,
        type: dominantType,
        pantry_status: null,
        pantry_override: null,
      })
    } else if (family === 'weight' && allSameFamily) {
      const totalG = group.reduce(
        (sum, i) => sum + (toGrams(parseAmount(i.amount), i.unit) ?? 0), 0
      )
      const { amount, unit } = formatWeight(totalG, preferredUnit)
      result.push({
        id: crypto.randomUUID(),
        ingredient: group[0].ingredient,
        amount,
        unit,
        category: categorize(group[0].ingredient),
        checked: false,
        sources,
        type: dominantType,
        pantry_status: null,
        pantry_override: null,
      })
    } else if (family === 'count' && allSameFamily) {
      const total = group.reduce((sum, i) => sum + parseAmount(i.amount), 0)
      result.push({
        id: crypto.randomUUID(),
        ingredient: group[0].ingredient,
        amount: total > 0 ? formatScaledAmount(total) : null,
        unit: preferredUnit,
        category: categorize(group[0].ingredient),
        checked: false,
        sources,
        type: dominantType,
        pantry_status: null,
        pantry_override: null,
      })
    } else {
      // Incompatible units — keep as separate line items
      for (const item of group) {
        const itemSources = item.type === 'recipe' ? [item.source].filter(Boolean) : []
        result.push({
          id: crypto.randomUUID(),
          ingredient: item.ingredient,
          amount: item.amount != null ? String(item.amount) : null,
          unit: item.unit,
          category: categorize(item.ingredient),
          checked: false,
          sources: itemSources,
          type: item.type,
          pantry_status: null,
          pantry_override: null,
        })
      }
    }
  }

  return result
}

// ─── Pantry history ────────────────────────────────────────────────────────────

export interface CheckedHistoryItem {
  ingredient: string
  checked_at: string
}

export function computePantryStatus(
  item: GroceryItem,
  history: CheckedHistoryItem[],
  now: Date
): PantryStatus {
  const normalizedItem = normalizeIngredientName(item.ingredient)
  const shelfLifeDays = getShelfLifeDays(item.ingredient)

  for (const h of history) {
    const normalizedHistory = normalizeIngredientName(h.ingredient)
    if (normalizedItem !== normalizedHistory) continue

    const purchasedAt = new Date(h.checked_at)
    const daysSince = (now.getTime() - purchasedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince <= shelfLifeDays) return 'in_pantry'
  }

  return null
}

// ─── Shared finishing pipeline ─────────────────────────────────────────────────
// Applies dedup, restock suggestions, pantry overrides, and pantry status to a
// raw ingredient list. Called by both generateGroceryList and generateFromSelectedRecipes.

interface FinishOptions {
  pantryStaples: PantryStaple[]
  recurringItems: RecurringItem[]
  purchaseHistory: CheckedHistoryItem[]
  existingList: GroceryItem[] | null
}

function finishList(recipeRaw: RawIngredient[], options: FinishOptions): GroceryItem[] {
  const { pantryStaples, recurringItems, purchaseHistory, existingList } = options
  const now = new Date()

  const rawItems: RawIngredient[] = [...recipeRaw]

  for (const item of recurringItems) {
    rawItems.push({
      ingredient: item.ingredient,
      amount: item.amount,
      unit: item.unit ?? '',
      source: '',
      type: 'recurring',
    })
  }

  let items = deduplicateIngredients(rawItems)

  const listKeys = new Set(items.map(i => normalizeIngredientName(i.ingredient)))
  const recipeKeys = new Set(
    recipeRaw.map(i => normalizeIngredientName(i.ingredient))
  )

  for (const staple of pantryStaples) {
    const normalizedStaple = normalizeIngredientName(staple.ingredient)
    const isUsed = [...recipeKeys].some(k =>
      k.includes(normalizedStaple) || normalizedStaple.includes(k)
    )
    if (!isUsed) continue
    const alreadyPresent = [...listKeys].some(k =>
      k.includes(normalizedStaple) || normalizedStaple.includes(k)
    )
    if (alreadyPresent) continue

    items.push({
      id: crypto.randomUUID(),
      ingredient: staple.ingredient,
      amount: null,
      unit: '',
      category: categorize(staple.ingredient),
      checked: false,
      sources: [],
      type: 'restock',
      pantry_status: null,
      pantry_override: null,
    })
    listKeys.add(normalizedStaple)
  }

  if (existingList) {
    items = items.map(item => {
      const normalizedName = normalizeIngredientName(item.ingredient)
      const match = existingList.find(
        e => normalizeIngredientName(e.ingredient) === normalizedName
      )
      if (!match) return item
      return { ...item, pantry_override: match.pantry_override }
    })

    const manualItems = existingList.filter(i => i.type === 'manual')
    items.push(...manualItems)
  }

  items = items.map(item => ({
    ...item,
    pantry_status: computePantryStatus(item, purchaseHistory, now),
  }))

  return items
}

// ─── Plan-based generation ─────────────────────────────────────────────────────

export interface GenerateListInput {
  planEntries: PlanEntry[]
  pantryStaples: PantryStaple[]
  recurringItems: RecurringItem[]
  purchaseHistory: CheckedHistoryItem[]
  existingList: GroceryItem[] | null
}

export function generateGroceryList(input: GenerateListInput): GroceryItem[] {
  const { planEntries, ...options } = input

  const recipeRaw: RawIngredient[] = []
  for (const entry of planEntries) {
    if (!entry.recipe?.ingredients) continue
    for (const ing of entry.recipe.ingredients) {
      recipeRaw.push({
        ingredient: ing.ingredient,
        amount: ing.amount,
        unit: ing.unit ?? '',
        source: entry.recipe.title,
        type: 'recipe',
      })
    }
  }

  return finishList(recipeRaw, options)
}

// ─── Recipe-picker–based generation ───────────────────────────────────────────

export function generateFromSelectedRecipes(
  recipes: Array<{ id: string; title: string; ingredients: Ingredient[] }>,
  options: FinishOptions
): GroceryItem[] {
  const recipeRaw: RawIngredient[] = []
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      recipeRaw.push({
        ingredient: ing.ingredient,
        amount: ing.amount,
        unit: ing.unit ?? '',
        source: recipe.title,
        type: 'recipe',
      })
    }
  }

  return finishList(recipeRaw, options)
}

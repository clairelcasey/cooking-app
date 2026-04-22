export type GroceryCategory =
  | 'produce'
  | 'proteins'
  | 'dairy'
  | 'bakery'
  | 'pantry'
  | 'spices'
  | 'frozen'
  | 'beverages'
  | 'other'

export type GroceryItemType = 'recipe' | 'recurring' | 'manual' | 'restock'

export type PantryStatus = 'in_pantry' | 'need_to_buy' | null

export interface GroceryItem {
  id: string
  ingredient: string
  amount: string | null
  unit: string
  category: GroceryCategory
  checked: boolean
  checked_at?: string // ISO timestamp — set when checked off while shopping
  sources: string[] // recipe titles that use this ingredient
  type: GroceryItemType
  pantry_status: PantryStatus // history-derived estimate
  pantry_override: PantryStatus // manual override — takes precedence over pantry_status
}

export interface GroceryList {
  id: string
  plan_id: string | null
  user_id: string
  items: GroceryItem[]
  created_at: string
  updated_at: string
}

// Stored in profiles.recurring_grocery_items
export interface RecurringItem {
  ingredient: string
  amount: string | null
  unit: string
}

// Stored in profiles.pantry_staples
export interface PantryStaple {
  ingredient: string
}

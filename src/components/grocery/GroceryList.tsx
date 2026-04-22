'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, ChevronDown, Check, Package, ShoppingBasket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GrocerySection } from './GrocerySection'
import { GroceryItemRow } from './GroceryItem'
import { AddItemInput } from './AddItemInput'
import { GroceryRecipePicker } from './GroceryRecipePicker'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/grocery/categories'
import { toggleItem, addManualItem, removeItem, setPantryOverride } from '@/app/grocery/actions'
import type { GroceryItem, GroceryCategory, PantryStatus } from '@/types/grocery'
import type { RecipeListItem } from '@/types/recipe'

interface GroceryListProps {
  listId: string | null
  initialItems: GroceryItem[]
  recipes: RecipeListItem[]
  initialSelectedIds: string[]
}

function effectiveStatus(item: GroceryItem): PantryStatus {
  return item.pantry_override ?? item.pantry_status
}

export function GroceryList({
  listId: initialListId,
  initialItems,
  recipes,
  initialSelectedIds,
}: GroceryListProps) {
  const router = useRouter()
  const [listId, setListId] = useState<string | null>(initialListId)
  const [items, setItems] = useState<GroceryItem[]>(initialItems)
  const [pickerOpen, setPickerOpen] = useState(initialSelectedIds.length > 0)
  const [copied, setCopied] = useState(false)
  const [checkedExpanded, setCheckedExpanded] = useState(false)
  const [pantryExpanded, setPantryExpanded] = useState(false)

  // Three buckets: active (need to buy), checked (got it), in pantry (skip)
  const active = items.filter(i => !i.checked && effectiveStatus(i) !== 'in_pantry')
  const checked = items.filter(i => i.checked)
  const inPantry = items.filter(i => !i.checked && effectiveStatus(i) === 'in_pantry')

  const activeCategories = CATEGORY_ORDER.filter(cat => active.some(i => i.category === cat))

  // ─── Handlers ────────────────────────────────────────────────────────────────

  async function handleToggle(itemId: string, isChecked: boolean) {
    if (!listId) return
    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? { ...i, checked: isChecked, checked_at: isChecked ? new Date().toISOString() : undefined }
          : i
      )
    )
    const result = await toggleItem(listId, itemId, isChecked)
    if (result.error) router.refresh()
  }

  async function handleAddManual(ingredient: string, amount: string, unit: string) {
    if (!listId) return
    const result = await addManualItem(listId, ingredient, amount, unit)
    if (result.item) setItems(prev => [...prev, result.item!])
    if (result.error) router.refresh()
  }

  async function handleRemove(itemId: string) {
    if (!listId) return
    setItems(prev => prev.filter(i => i.id !== itemId))
    const result = await removeItem(listId, itemId)
    if (result.error) router.refresh()
  }

  async function handlePantryOverride(itemId: string, override: PantryStatus) {
    if (!listId) return
    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, pantry_override: override } : i)
    )
    await setPantryOverride(listId, itemId, override)
  }

  function handleNeedToBuy(itemId: string) {
    handlePantryOverride(itemId, 'need_to_buy')
  }

  function handleGenerate(newItems: GroceryItem[], newListId: string) {
    setItems(newItems)
    setListId(newListId)
  }

  function handleCopy() {
    const text = buildPlainText(active)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => setPickerOpen(true)}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white',
            'transition-colors hover:bg-stone-700'
          )}
        >
          <ShoppingBasket className="size-3.5" />
          Select Recipes
        </button>

        <button
          onClick={handleCopy}
          disabled={active.length === 0}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium',
            'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            'disabled:pointer-events-none disabled:opacity-40'
          )}
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Grocery insight banner */}
      {active.length > 0 && (() => {
        const hasProteins = active.some(i => i.category === 'proteins')
        const produceCount = active.filter(i => i.category === 'produce').length
        const gap = !hasProteins
          ? 'No proteins on your list.'
          : produceCount < 3
          ? 'Less than 3 produce items on your list.'
          : null

        if (!gap) return null

        const prompt = !hasProteins
          ? 'My grocery list has no proteins. What should I add?'
          : 'My grocery list is low on produce. What vegetables or fruits should I add?'

        return (
          <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-sm dark:border-sky-800/40 dark:bg-sky-950/20">
            <p className="text-sky-800 dark:text-sky-300">
              <span className="font-medium">Heads up:</span> {gap}
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-agent', { detail: { message: prompt } }))}
              className="mt-1.5 cursor-pointer text-xs font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
            >
              Ask the assistant →
            </button>
          </div>
        )
      })()}

      {/* Empty state */}
      {active.length === 0 && checked.length === 0 && inPantry.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm">No items yet.</p>
          <p className="mt-1 text-xs">
            Click <span className="font-medium text-foreground">Select Recipes</span> to generate your grocery list.
          </p>
        </div>
      )}

      {/* Active shopping list */}
      {activeCategories.map(cat => (
        <GrocerySection
          key={cat}
          category={cat}
          items={active.filter(i => i.category === cat)}
          onToggle={handleToggle}
          onRemove={handleRemove}
          onPantryOverride={handlePantryOverride}
        />
      ))}

      {/* Add item input */}
      {listId && <AddItemInput onAdd={handleAddManual} />}

      {/* Checked items */}
      {checked.length > 0 && (
        <CollapsibleSection
          label="Checked"
          count={checked.length}
          expanded={checkedExpanded}
          onToggle={() => setCheckedExpanded(v => !v)}
        >
          {checked.map(item => (
            <GroceryItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onRemove={handleRemove}
              onPantryOverride={handlePantryOverride}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* In pantry */}
      {inPantry.length > 0 && (
        <CollapsibleSection
          label="In pantry"
          count={inPantry.length}
          expanded={pantryExpanded}
          onToggle={() => setPantryExpanded(v => !v)}
          icon={<Package className="size-3.5" />}
          description="Already at home — skipped from your list"
        >
          {inPantry.map(item => (
            <PantryItemRow
              key={item.id}
              item={item}
              onNeedToBuy={handleNeedToBuy}
              onRemove={handleRemove}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* Recipe picker modal */}
      <GroceryRecipePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        recipes={recipes}
        initialSelectedIds={initialSelectedIds}
        onGenerate={handleGenerate}
      />
    </div>
  )
}

// ─── Collapsible section shell ─────────────────────────────────────────────────

function CollapsibleSection({
  label,
  count,
  expanded,
  onToggle,
  icon,
  description,
  children,
}: {
  label: string
  count: number
  expanded: boolean
  onToggle: () => void
  icon?: React.ReactNode
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-4">
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
          <span className="font-normal normal-case tracking-normal text-muted-foreground/60">
            ({count})
          </span>
        </span>
        <ChevronDown
          className={cn('size-3.5 transition-transform duration-150', !expanded && '-rotate-90')}
        />
      </button>
      {expanded && (
        <>
          {description && (
            <p className="mb-1 px-3 text-xs text-muted-foreground/60">{description}</p>
          )}
          <div className="space-y-0.5">{children}</div>
        </>
      )}
    </div>
  )
}

// ─── Pantry item row ───────────────────────────────────────────────────────────

function PantryItemRow({
  item,
  onNeedToBuy,
  onRemove,
}: {
  item: GroceryItem
  onNeedToBuy: (id: string) => void
  onRemove: (id: string) => void
}) {
  const qty = [item.amount, item.unit].filter(Boolean).join(' ')

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
      <Package className="size-4 shrink-0 text-muted-foreground/30" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm text-muted-foreground">{item.ingredient}</span>
          {qty && <span className="text-xs text-muted-foreground/60">{qty}</span>}
        </div>
        {item.sources.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground/50">
            {item.sources.join(' · ')}
          </p>
        )}
      </div>

      <button
        onClick={() => onNeedToBuy(item.id)}
        className="shrink-0 cursor-pointer rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
      >
        Need to buy
      </button>
      <button
        onClick={() => onRemove(item.id)}
        className="shrink-0 cursor-pointer text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
        aria-label={`Remove ${item.ingredient}`}
      >
        ×
      </button>
    </div>
  )
}

// ─── Plain text export ─────────────────────────────────────────────────────────

function buildPlainText(items: GroceryItem[]): string {
  const byCategory: Partial<Record<GroceryCategory, GroceryItem[]>> = {}
  for (const item of items) {
    if (!byCategory[item.category]) byCategory[item.category] = []
    byCategory[item.category]!.push(item)
  }

  const lines: string[] = []
  for (const cat of CATEGORY_ORDER) {
    const catItems = byCategory[cat]
    if (!catItems?.length) continue
    lines.push(CATEGORY_LABELS[cat].toUpperCase())
    for (const item of catItems) {
      const qty = [item.amount, item.unit].filter(Boolean).join(' ')
      lines.push(`• ${item.ingredient}${qty ? ', ' + qty : ''}`)
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

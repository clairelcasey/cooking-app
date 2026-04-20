'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO, addWeeks, subWeeks } from 'date-fns'
import { RefreshCw, Copy, ChevronDown, ChevronLeft, ChevronRight, Check, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GrocerySection } from './GrocerySection'
import { GroceryItemRow } from './GroceryItem'
import { AddItemInput } from './AddItemInput'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/grocery/categories'
import { generateList, toggleItem, addManualItem, removeItem, setPantryOverride } from '@/app/grocery/actions'
import type { GroceryItem, GroceryCategory, PantryStatus } from '@/types/grocery'

interface PastList {
  id: string
  created_at: string
  week_start_date: string
}

interface GroceryListProps {
  weekStart: string
  listId: string
  planId: string
  initialItems: GroceryItem[]
  pastLists: PastList[]
}

function effectiveStatus(item: GroceryItem): PantryStatus {
  return item.pantry_override ?? item.pantry_status
}

export function GroceryList({
  weekStart,
  listId,
  initialItems,
}: GroceryListProps) {
  const router = useRouter()
  const [items, setItems] = useState<GroceryItem[]>(initialItems)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [checkedExpanded, setCheckedExpanded] = useState(false)
  const [pantryExpanded, setPantryExpanded] = useState(false)

  const weekStartDate = parseISO(weekStart)
  const prevWeek = subWeeks(weekStartDate, 1)
  const nextWeek = addWeeks(weekStartDate, 1)
  const weekLabel =
    format(weekStartDate, 'MMM d') + ' – ' + format(addWeeks(weekStartDate, 1), 'MMM d')

  // Three buckets: active (need to buy), checked (got it), in pantry (skip)
  const active = items.filter(i => !i.checked && effectiveStatus(i) !== 'in_pantry')
  const checked = items.filter(i => i.checked)
  const inPantry = items.filter(i => !i.checked && effectiveStatus(i) === 'in_pantry')

  const activeCategories = CATEGORY_ORDER.filter(cat => active.some(i => i.category === cat))

  // ─── Handlers ────────────────────────────────────────────────────────────────

  async function handleToggle(itemId: string, isChecked: boolean) {
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
    const result = await addManualItem(listId, ingredient, amount, unit)
    if (result.item) setItems(prev => [...prev, result.item!])
    if (result.error) router.refresh()
  }

  async function handleRemove(itemId: string) {
    setItems(prev => prev.filter(i => i.id !== itemId))
    const result = await removeItem(listId, itemId)
    if (result.error) router.refresh()
  }

  async function handlePantryOverride(itemId: string, override: PantryStatus) {
    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, pantry_override: override } : i)
    )
    await setPantryOverride(listId, itemId, override)
  }

  // Move an item from the pantry section back to the active list
  function handleNeedToBuy(itemId: string) {
    handlePantryOverride(itemId, 'need_to_buy')
  }

  async function handleRegenerate() {
    setIsRegenerating(true)
    const result = await generateList(weekStart)
    if (result.items) setItems(result.items)
    setIsRegenerating(false)
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
      {/* Week navigation */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/grocery?week=${format(prevWeek, 'yyyy-MM-dd')}`)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-medium">{weekLabel}</span>
          <button
            onClick={() => router.push(`/grocery?week=${format(nextWeek, 'yyyy-MM-dd')}`)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className={cn(
              'flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium',
              'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
          >
            <RefreshCw className={cn('size-3.5', isRegenerating && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium',
              'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
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
      </div>

      {/* Empty state */}
      {active.length === 0 && checked.length === 0 && inPantry.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm">No items yet.</p>
          <p className="mt-1 text-xs">
            Plan some meals in the Planner and regenerate, or add items below.
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
      <AddItemInput onAdd={handleAddManual} />

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

      {/* In pantry — items skipped because they're already at home */}
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
        className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
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
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors">
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
        className="shrink-0 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
      >
        Need to buy
      </button>
      <button
        onClick={() => onRemove(item.id)}
        className="shrink-0 text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
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

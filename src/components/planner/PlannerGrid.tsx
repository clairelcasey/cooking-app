'use client'

import { addDays, format, isToday, parseISO } from 'date-fns'
import { MealSlot } from './MealSlot'
import { cn } from '@/lib/utils'
import type { PlanEntry, MealSlot as MealSlotType } from '@/types/recipe'

const MEAL_SLOTS: MealSlotType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_LABELS: Record<MealSlotType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

interface PlannerGridProps {
  weekStart: Date
  entries: PlanEntry[]
  onAdd: (date: string, mealSlot: MealSlotType) => void
  onRemove: (entryId: string) => void
  onDrop: (date: string, mealSlot: MealSlotType, recipeId: string) => void
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function PlannerGrid({ weekStart, entries, onAdd, onRemove, onDrop }: PlannerGridProps) {
  const days = getWeekDays(weekStart)

  function getEntry(date: Date, mealSlot: MealSlotType): PlanEntry | undefined {
    const dateStr = format(date, 'yyyy-MM-dd')
    return entries.find(
      (e) => e.entry_date === dateStr && e.meal_slot === mealSlot
    )
  }

  // ─── Desktop layout: grid with meal-type label column ────────────────────────
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        {/* Day headers row */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-x-2 mb-2">
          <div /> {/* empty label column */}
          {days.map((day) => {
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'text-center py-1.5 px-2 rounded-lg',
                  today ? 'bg-amber-50' : ''
                )}
              >
                <div
                  className={cn(
                    'text-xs font-semibold uppercase tracking-widest',
                    today ? 'text-amber-600' : 'text-stone-400'
                  )}
                >
                  {format(day, 'EEE')}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold leading-tight',
                    today ? 'text-amber-700' : 'text-stone-700'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Meal rows */}
        {MEAL_SLOTS.map((slot) => (
          <div
            key={slot}
            className="grid grid-cols-[80px_repeat(7,1fr)] gap-x-2 mb-1.5 items-center"
          >
            <div className="flex items-center py-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-stone-400 pr-2 text-right w-full">
                {MEAL_LABELS[slot]}
              </span>
            </div>
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              return (
                <MealSlot
                  key={dateStr}
                  date={dateStr}
                  mealSlot={slot}
                  entry={getEntry(day, slot)}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  onDrop={onDrop}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Mobile: stacked day cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {days.map((day) => {
          const today = isToday(day)
          const dateStr = format(day, 'yyyy-MM-dd')
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'rounded-xl border bg-white shadow-sm overflow-hidden',
                today ? 'border-amber-200' : 'border-stone-200'
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  'px-4 py-2.5 border-b',
                  today
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-stone-50 border-stone-100'
                )}
              >
                <span
                  className={cn(
                    'font-semibold',
                    today ? 'text-amber-700' : 'text-stone-700'
                  )}
                >
                  {format(day, 'EEEE')}
                </span>
                <span
                  className={cn(
                    'ml-2 text-sm',
                    today ? 'text-amber-500' : 'text-stone-400'
                  )}
                >
                  {format(day, 'MMM d')}
                </span>
                {today && (
                  <span className="ml-2 text-xs font-medium text-amber-500">
                    Today
                  </span>
                )}
              </div>

              {/* Meal slots */}
              <div className="divide-y divide-stone-100">
                {MEAL_SLOTS.map((slot) => (
                  <div
                    key={slot}
                    className="flex items-start gap-3 px-4 py-2.5"
                  >
                    <span className="w-20 shrink-0 pt-2.5 text-xs font-semibold uppercase tracking-widest text-stone-400">
                      {MEAL_LABELS[slot]}
                    </span>
                    <div className="flex-1">
                      <MealSlot
                        date={dateStr}
                        mealSlot={slot}
                        entry={getEntry(day, slot)}
                        onAdd={onAdd}
                        onRemove={onRemove}
                        onDrop={onDrop}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

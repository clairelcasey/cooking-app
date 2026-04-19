import type { ScaledIngredient } from './scale'

type Segment =
  | { type: 'text'; content: string }
  | { type: 'match'; content: string; badge: string }

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Splits a step description into segments, tagging ingredient name matches so
 * cook mode can render an inline amount badge next to each mention.
 *
 * Ingredients are matched longest-name-first to avoid substring conflicts
 * (e.g. "olive oil" before "oil"). Each ingredient name is matched only once
 * (first occurrence). Plural forms are tried too (appending "s").
 */
export function buildSegments(
  stepText: string,
  ingredients: ScaledIngredient[],
): Segment[] {
  // Only include ingredients that have a non-empty badge
  const relevant = ingredients
    .filter((ing) => ing.ingredient && ing.badge)
    .sort((a, b) => b.ingredient.length - a.ingredient.length)

  let segments: Segment[] = [{ type: 'text', content: stepText }]

  for (const ing of relevant) {
    const name = escapeRegex(ing.ingredient)
    // Match the name as a whole word, optionally pluralised
    const regex = new RegExp(`\\b(${name}s?)\\b`, 'i')
    let matched = false

    const next: Segment[] = []
    for (const seg of segments) {
      // Only split unprocessed text segments, and only match once per ingredient
      if (seg.type !== 'text' || matched) {
        next.push(seg)
        continue
      }

      const parts = seg.content.split(regex)
      if (parts.length === 1) {
        // No match
        next.push(seg)
        continue
      }

      // split with a capture group: [before, match, after, match2, after2, ...]
      parts.forEach((part, idx) => {
        if (idx % 2 === 0) {
          if (part) next.push({ type: 'text', content: part })
        } else {
          next.push({ type: 'match', content: part, badge: ing.badge })
          matched = true // only first occurrence
        }
      })
    }
    segments = next
  }

  return segments
}

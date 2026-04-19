import Anthropic from '@anthropic-ai/sdk'
import type { Ingredient, Nutrition } from '@/types/recipe'

const anthropic = new Anthropic()

export async function estimateIngredientNutrition(ingredient: Ingredient): Promise<Nutrition | null> {
  const amountStr = ingredient.amount != null ? String(ingredient.amount) : ''
  const query = [amountStr, ingredient.unit, ingredient.ingredient].filter(Boolean).join(' ').trim()

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: 'You are a nutrition estimation assistant. Return ONLY a JSON object — no markdown, no explanation.',
      messages: [
        {
          role: 'user',
          content: `Estimate the nutritional values for this ingredient amount: "${query}"

Return only JSON with these fields (use 0 if none):
{"calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number, "sodium_mg": number, "sat_fat_g": number}`,
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return null

    const cleaned = textBlock.text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()

    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    function num(key: string): number | undefined {
      const v = parsed[key]
      return typeof v === 'number' && isFinite(v) ? v : undefined
    }

    return {
      calories: num('calories'),
      protein_g: num('protein_g'),
      carbs_g: num('carbs_g'),
      fat_g: num('fat_g'),
      fiber_g: num('fiber_g'),
      sodium_mg: num('sodium_mg'),
      sat_fat_g: num('sat_fat_g'),
    }
  } catch {
    return null
  }
}

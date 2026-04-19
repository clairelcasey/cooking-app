import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { RECIPE_EXTRACTION_SYSTEM_PROMPT, parseClaudeRecipe } from '@/lib/import/claude-extract'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { text } = body
  if (!text || text.trim().length < 20) {
    return NextResponse.json({ error: 'Please provide more recipe text.' }, { status: 400 })
  }

  // Limit input size
  const trimmedText = text.slice(0, 25000)

  let recipe: ReturnType<typeof parseClaudeRecipe>
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: RECIPE_EXTRACTION_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Extract the recipe from this text:\n\n${trimmedText}`,
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from Claude' }, { status: 500 })
    }

    recipe = parseClaudeRecipe(textBlock.text)
  } catch (err) {
    console.error('Claude API error:', err)
    return NextResponse.json({ error: 'Recipe extraction failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ recipe })
}

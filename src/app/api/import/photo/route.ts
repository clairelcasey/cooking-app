import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { RECIPE_EXTRACTION_SYSTEM_PROMPT, parseClaudeRecipe } from '@/lib/import/claude-extract'

const anthropic = new Anthropic()

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported image type. Use JPEG, PNG, GIF, or WebP.' },
      { status: 400 }
    )
  }

  // Upload to Supabase Storage so we have a permanent URL
  const ext = file.name.split('.').pop() ?? 'jpg'
  const storagePath = `${user.id}/import-${Date.now()}.${ext}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('recipe-images')
    .upload(storagePath, fileBuffer, { contentType: file.type, upsert: true })

  let image_url: string | null = null
  if (!uploadError) {
    const { data } = supabase.storage.from('recipe-images').getPublicUrl(storagePath)
    image_url = data.publicUrl
  }

  // Convert to base64 for Claude vision
  const base64Data = Buffer.from(fileBuffer).toString('base64')

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
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: file.type as AllowedMimeType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Extract the recipe from this image.',
            },
          ],
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

  return NextResponse.json({ recipe, image_url })
}

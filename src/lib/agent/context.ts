import type { SupabaseClient } from '@supabase/supabase-js'
import { getWeekPlan } from '@/lib/planner/queries'
import { getRecipes } from '@/lib/recipes/queries'
import { startOfWeek, format } from 'date-fns'

export interface AgentContext {
  screen: string
  userProfile: {
    disliked_foods: unknown[]
    dietary_prefs: unknown[]
    health_goals: unknown
  } | null
  screenData: string
}

/**
 * Build a screen-aware context string for the agent system prompt.
 * Only fetches what's relevant to the current pathname.
 */
export async function buildAgentContext(
  supabase: SupabaseClient,
  userId: string,
  pathname: string
): Promise<AgentContext> {
  // Always fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('disliked_foods, dietary_prefs, health_goals')
    .eq('id', userId)
    .single()

  // Always load recipe library — the agent needs it on every screen
  const contextParts: string[] = []

  try {
    const allRecipes = await getRecipes(supabase, userId, {})
    const librarySummary = allRecipes.slice(0, 30).map((r) => ({
      id: r.id,
      title: r.title,
      cuisine: r.cuisine,
      prep_minutes: r.prep_minutes,
      nutrition: r.nutrition,
      cook_count: r.cook_count,
      last_cooked_at: r.last_cooked_at,
    }))
    contextParts.push(`Recipe library (${librarySummary.length} recipes):\n${JSON.stringify(librarySummary, null, 2)}`)
  } catch {
    contextParts.push('Could not load recipe library.')
  }

  // Screen-specific additional context
  if (pathname.startsWith('/planner')) {
    try {
      const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 })
      const weekStart = format(weekStartDate, 'yyyy-MM-dd')
      const plan = await getWeekPlan(supabase, userId, weekStartDate)
      const summary = plan.entries.map((e) => ({
        date: e.entry_date,
        slot: e.meal_slot,
        title: e.recipe?.title ?? e.free_text_meal ?? 'Unknown',
        nutrition: e.recipe?.nutrition ?? e.nutrition ?? null,
      }))
      contextParts.push(`Current week meal plan (week of ${weekStart}):\n${JSON.stringify(summary, null, 2)}`)
    } catch {
      contextParts.push('Could not load current week plan.')
    }
  } else if (pathname.match(/^\/recipes\/[^/]+$/) && !pathname.endsWith('/new')) {
    // Full recipe detail for the recipe the user is viewing
    const recipeId = pathname.split('/').pop()
    if (recipeId) {
      const { data: recipe } = await supabase
        .from('recipes')
        .select('id, title, description, ingredients, steps, nutrition, cuisine, prep_minutes, cook_minutes')
        .eq('id', recipeId)
        .single()
      if (recipe) {
        contextParts.push(`Currently viewing recipe (full detail):\n${JSON.stringify(recipe, null, 2)}`)
      }
    }
  } else if (pathname.startsWith('/grocery')) {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const { data: plan } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start_date', weekStart)
      .single()

    if (plan) {
      const { data: list } = await supabase
        .from('grocery_lists')
        .select('items')
        .eq('plan_id', plan.id)
        .single()

      if (list?.items) {
        contextParts.push(`Current grocery list:\n${JSON.stringify(list.items, null, 2)}`)
      }
    }
  }

  return {
    screen: pathname,
    userProfile: profile ?? null,
    screenData: contextParts.join('\n\n---\n\n'),
  }
}

export function buildSystemPrompt(ctx: AgentContext): string {
  const profileLines: string[] = []

  if (ctx.userProfile?.disliked_foods && Array.isArray(ctx.userProfile.disliked_foods) && ctx.userProfile.disliked_foods.length > 0) {
    profileLines.push(`Disliked/avoided foods: ${JSON.stringify(ctx.userProfile.disliked_foods)}`)
  }
  if (ctx.userProfile?.dietary_prefs && Array.isArray(ctx.userProfile.dietary_prefs) && ctx.userProfile.dietary_prefs.length > 0) {
    profileLines.push(`Dietary preferences: ${JSON.stringify(ctx.userProfile.dietary_prefs)}`)
  }
  if (ctx.userProfile?.health_goals && typeof ctx.userProfile.health_goals === 'object' && Object.keys(ctx.userProfile.health_goals as object).length > 0) {
    profileLines.push(`Health goals: ${JSON.stringify(ctx.userProfile.health_goals)}`)
  }

  return `You are a personal cooking assistant embedded in a recipe and meal planning app.

## User Profile
${profileLines.length > 0 ? profileLines.join('\n') : 'No profile preferences set.'}

## Current Screen
The user is on: ${ctx.screen}

## Screen Context
${ctx.screenData || 'No additional context for this screen.'}

## Your Capabilities
- Analyze and comment on the user's meal plan nutrition balance
- Suggest recipe ideas based on ingredients, preferences, or what they haven't tried recently
- Find ingredient substitutions with quantities
- Explain nutrition in plain language
- Scale recipes to different serving counts
- Draft a full week meal plan from the user's recipe library

## Structured Output Format
When the user asks to scale a recipe, respond with your explanation AND a fenced block:
\`\`\`scale_action
{"recipeId": "uuid", "recipeName": "name", "scaleFactor": 2, "recipe": { <full recipe object> }}
\`\`\`
Only valid scale factors are: 0.5, 1, 1.5, 2, 3. Pick the closest one.

When the user asks you to build or draft a meal plan, respond with your explanation AND a fenced block:
\`\`\`plan_preview
{"entries": [{"date": "YYYY-MM-DD", "mealSlot": "dinner", "recipeId": "uuid", "recipeTitle": "name"}]}
\`\`\`
Only use recipes from the user's library. Only include dinner slots unless asked otherwise. Dates should be this week (Monday–Sunday).

## Tone
Be warm, concise, and practical. Lead with the most useful insight. Don't pad responses.`
}

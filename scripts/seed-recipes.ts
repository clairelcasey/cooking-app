import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TARGET_EMAIL = 'clcasey805@gmail.com'

async function findUserId(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) throw new Error(`Failed to list users: ${error.message}`)
  const user = data.users.find((u) => u.email === email)
  if (!user) throw new Error(`No user found with email ${email}`)
  return user.id
}

async function seed() {
  const ownerId = await findUserId(TARGET_EMAIL)
  console.log(`Found user: ${ownerId}`)

  const recipes = [
    {
      owner_id: ownerId,
      family_id: null,
      visibility: 'private',
      public_slug: null,
      title: 'Healthy Oatmeal Banana Bread',
      description:
        'A wholesome 5-ingredient quick bread made entirely in a blender — no refined sugar or flour. Dense, moist, and perfect for breakfast.',
      source_url: 'https://thebigmansworld.com/healthy-oatmeal-banana-bread/',
      image_url: null,
      cuisine: 'American',
      difficulty: 'easy',
      meal_type: 'breakfast',
      is_vegetarian: true,
      tags: [],
      prep_minutes: 5,
      cook_minutes: 38,
      health_score: null,
      last_cooked_at: null,
      cook_count: 0,
      notes: 'Freeze individual slices for up to 6 months. Cool completely before slicing or it will crumble.',
      nutrition: {
        calories: 130,
        protein_g: 3,
        carbs_g: 26,
        fat_g: 2,
        fiber_g: 3,
      },
      ingredients: [
        { amount: 180, unit: 'g', ingredient: 'rolled oats', note: 'gluten-free if needed' },
        { amount: 600, unit: 'g', ingredient: 'ripe bananas', note: 'about 4 large' },
        { amount: 2, unit: '', ingredient: 'large eggs' },
        { amount: 90, unit: 'ml', ingredient: 'maple syrup', note: 'or honey / agave nectar' },
        { amount: 5, unit: 'g', ingredient: 'baking soda' },
        { amount: 170, unit: 'g', ingredient: 'chocolate chips', note: 'optional' },
      ],
      steps: [
        {
          order: 1,
          description: 'Preheat oven to 180°C (350°F). Grease a standard loaf pan.',
          duration_minutes: 5,
        },
        {
          order: 2,
          description: 'Add all ingredients to a high-speed blender and blend until completely smooth.',
          duration_minutes: null,
        },
        {
          order: 3,
          description: 'Fold in chocolate chips if using.',
          duration_minutes: null,
        },
        {
          order: 4,
          description: 'Pour batter into the prepared loaf pan.',
          duration_minutes: null,
        },
        {
          order: 5,
          description: 'Bake 35–40 minutes until a skewer inserted in the centre comes out mostly clean.',
          duration_minutes: 38,
        },
        {
          order: 6,
          description: 'Cool completely in the pan before slicing.',
          duration_minutes: null,
        },
      ],
    },
    {
      owner_id: ownerId,
      family_id: null,
      visibility: 'private',
      public_slug: null,
      title: '15-Minute Garlic Parmesan White Beans',
      description:
        'A quick Mediterranean dish with canned cannellini beans, cherry tomatoes, garlic, and bold spices — finished with shaved Parmesan and a drizzle of olive oil.',
      source_url: 'https://www.themediterraneandish.com/white-beans-recipe/',
      image_url: null,
      cuisine: 'Mediterranean',
      difficulty: 'easy',
      meal_type: 'dinner',
      is_vegetarian: true,
      tags: [],
      prep_minutes: 5,
      cook_minutes: 15,
      health_score: null,
      last_cooked_at: null,
      cook_count: 0,
      notes: 'Butter beans or great northern beans work as substitutes. Reheat gently with a splash of water.',
      nutrition: {
        calories: 317,
        protein_g: 21.2,
        carbs_g: 50.5,
        fat_g: 4.2,
        fiber_g: 11.5,
      },
      ingredients: [
        { amount: 30, unit: 'ml', ingredient: 'extra virgin olive oil', note: 'plus extra to finish' },
        { amount: 4, unit: '', ingredient: 'garlic cloves', note: 'minced' },
        { amount: 850, unit: 'g', ingredient: 'canned cannellini beans', note: '2 × 425g cans, drained' },
        { amount: 120, unit: 'ml', ingredient: 'water' },
        { amount: 150, unit: 'g', ingredient: 'cherry tomatoes', note: 'halved' },
        { amount: 1, unit: 'tsp', ingredient: 'Aleppo pepper' },
        { amount: 0.5, unit: 'tsp', ingredient: 'cumin' },
        { amount: 30, unit: 'g', ingredient: 'Parmesan', note: 'shaved' },
        { amount: 25, unit: 'g', ingredient: 'Pecorino Romano', note: 'grated' },
        { amount: 30, unit: 'g', ingredient: 'fresh parsley', note: 'roughly chopped' },
        { amount: 0.5, unit: '', ingredient: 'lemon', note: 'juice only' },
        { amount: null, unit: '', ingredient: 'kosher salt and black pepper', note: 'to taste' },
      ],
      steps: [
        {
          order: 1,
          description: 'Warm olive oil in a large pan over medium heat. Sauté garlic until golden, about 2 minutes.',
          duration_minutes: 2,
        },
        {
          order: 2,
          description: 'Add drained beans and 120ml water. Season with salt, pepper, Aleppo pepper, and cumin.',
          duration_minutes: 2,
        },
        {
          order: 3,
          description: 'Add cherry tomatoes and cook about 10 minutes, stirring occasionally, until warmed through.',
          duration_minutes: 10,
        },
        {
          order: 4,
          description: 'Stir in parsley, Parmesan, Pecorino Romano, and lemon juice.',
          duration_minutes: null,
        },
        {
          order: 5,
          description: 'Finish with a generous drizzle of olive oil. Serve immediately with crusty bread.',
          duration_minutes: null,
        },
      ],
    },
  ]

  const { data, error } = await supabase.from('recipes').insert(recipes).select('id, title')
  if (error) throw new Error(`Insert failed: ${error.message}`)

  console.log('Inserted recipes:')
  data?.forEach((r: { id: string; title: string }) => console.log(`  ${r.id} — ${r.title}`))
  console.log('Done.')
}

seed().catch((err) => {
  console.error(err.message)
  process.exit(1)
})

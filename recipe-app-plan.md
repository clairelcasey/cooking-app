# Recipe & Cooking Assistant — Full Build Plan

> Paste this into Claude Code at the start of a session. It contains the full product spec, architecture decisions, data model, and build order.

---

## Project Overview

A personal recipe and cooking assistant web app, mobile-first (PWA), built for a health-conscious software engineer. Designed from day one to support family sharing. Key principles: structured data everywhere, offline-capable, AI where it meaningfully helps.

---

## Stack Decisions

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | Mobile-responsive, PWA-capable, Vercel-native |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, composable |
| Drag & Drop | dnd-kit | Best-in-class for complex drag state |
| Backend / DB | Supabase (Postgres) | Auth, RLS, storage, real-time — all in one |
| Auth | Supabase Auth | Email + Google OAuth, row-level security |
| AI Agent | Claude API (Anthropic) | Chat agent, recipe extraction, idea generation |
| Nutrition | USDA FoodData Central API (free) | Ingredient-level nutrition lookup |
| Hosting | Vercel | Zero-config Next.js deploys |
| Dev Environment | Cursor IDE | AI pair programmer with full project context |
| UI Scaffolding | v0.dev | Generate individual components, paste into project |

**Estimated monthly cost at personal use scale: $5–15/mo (mostly Claude API)**

---

## Architecture Principles

1. **Structured ingredients, not free text.** Store as `{amount, unit, ingredient, note}` objects. Required for grocery dedup, nutrition lookup, unit conversion, and pantry tracking.
2. **Structured steps, not a text blob.** Store as `{order, description, duration_minutes?}` array. Required for cook mode with timers.
3. **Cook log vs plan are different events.** Track planned meals and actually-cooked meals separately and immutably.
4. **Offline-first PWA.** Recipe library and current week's plan must be available offline. Use Next.js + Workbox. Design the service worker caching strategy from day one.
5. **Real-time sync via Supabase.** Changes on mobile reflect on desktop instantly via Supabase real-time subscriptions.
6. **Family sharing modeled from day one.** Use `family_groups` and row-level security so adding a family member is a config change, not a schema migration.

---

## Full Supabase Schema

Run this SQL in the Supabase SQL editor to initialize the database.

```sql
-- Users (extended profile beyond Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  display_name text,
  disliked_foods jsonb default '[]', -- [{name: "cilantro", severity: "never|avoid"}]
  pantry_staples jsonb default '[]', -- [{ingredient: "olive oil"}, ...]
  dietary_prefs jsonb default '[]',  -- ["high-protein", "gluten-free", ...]
  health_goals jsonb default '{}',
  created_at timestamptz default now()
);

-- Family groups
create table family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references family_groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('owner', 'member', 'viewer')) default 'member',
  joined_at timestamptz default now(),
  unique (family_id, user_id)
);

-- Recipes
create table recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  family_id uuid references family_groups(id), -- null = personal only
  visibility text check (visibility in ('private', 'family', 'public')) default 'private',
  public_slug text unique, -- for shareable links: /r/{slug}

  title text not null,
  description text,
  source_url text,
  image_url text,

  -- Structured ingredients: [{amount: 2, unit: "cup", ingredient: "flour", note: "sifted"}]
  ingredients jsonb not null default '[]',

  -- Structured steps: [{order: 1, description: "...", duration_minutes: 10}]
  steps jsonb not null default '[]',

  tags text[] default '{}',
  cuisine text,
  rating integer check (rating between 1 and 5),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),

  prep_minutes integer,
  cook_minutes integer,

  -- Nutrition (populated via USDA API on save)
  nutrition jsonb default '{}', -- {calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg}
  health_score integer, -- computed 1-100

  -- Cook history
  last_cooked_at timestamptz,
  cook_count integer default 0,

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cook log (immutable record of actually cooking something)
create table cook_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete set null,
  free_text_meal text, -- if not from a saved recipe
  cooked_at timestamptz not null,
  rating integer check (rating between 1 and 5),
  notes text
);

-- Weekly plans
create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  week_start_date date not null, -- always a Monday
  created_at timestamptz default now(),
  unique (user_id, week_start_date)
);

create table plan_entries (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references weekly_plans(id) on delete cascade,
  entry_date date not null,
  meal_slot text check (meal_slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid references recipes(id) on delete set null,
  free_text_meal text, -- for logging "had pizza" without a saved recipe
  status text check (status in ('planned', 'cooked', 'skipped')) default 'planned',
  logged_at timestamptz -- when it was marked as cooked
);

-- Grocery lists (auto-generated from weekly plan)
create table grocery_lists (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references weekly_plans(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  items jsonb default '[]', -- [{ingredient, amount, unit, checked: false, category: "produce"}]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table recipes enable row level security;
alter table cook_log enable row level security;
alter table weekly_plans enable row level security;
alter table plan_entries enable row level security;
alter table grocery_lists enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles: own" on profiles for all using (auth.uid() = id);

-- Recipes: own private, family if member, public for all
create policy "recipes: owner" on recipes for all using (auth.uid() = owner_id);
create policy "recipes: family" on recipes for select using (
  visibility = 'family' and
  family_id in (select family_id from family_members where user_id = auth.uid())
);
create policy "recipes: public" on recipes for select using (visibility = 'public');

-- Cook log, plans, grocery lists: own only
create policy "cook_log: own" on cook_log for all using (auth.uid() = user_id);
create policy "weekly_plans: own" on weekly_plans for all using (auth.uid() = user_id);
create policy "plan_entries: own" on plan_entries for all using (
  plan_id in (select id from weekly_plans where user_id = auth.uid())
);
create policy "grocery_lists: own" on grocery_lists for all using (auth.uid() = user_id);
```

---

## Feature Specs

### 1. Recipe Library
- Card grid view: photo, title, rating stars, tags, prep time, difficulty chip
- Filter/sort: cuisine, tags, rating, cook count, last cooked, prep time
- **Visibility controls per recipe**: `private` (only you), `family` (family group members), `public` (anyone with the link)
  - Public recipes get a clean shareable URL: `/r/{public-slug}` — works without login
  - Public page is minimal and beautiful: photo, ingredients, steps, metric toggle — no app chrome
  - In your library, public recipes show a small "published" badge so you know what's shared
- Tap to expand: full recipe, metric/imperial toggle (preference saved per user), edit mode, notes
- Import methods:
  - **URL**: fetch HTML → send to Claude → extract structured recipe
  - **Photo**: upload image → Claude vision → extract structured recipe
  - **Manual**: form with structured ingredient/step entry
- Fallback for blocked scrapers: "paste the recipe text" input → Claude parses it
- Cook mode: full-screen step-by-step view, timers per step, screen stay-awake (via WakeLock API)

### 2. Weekly / Monthly Planner
- **View toggle: Week / Month** — persisted as user preference
- **Week view**: 7-column calendar with full meal slots (breakfast / lunch / dinner / snack) per day
  - Drag recipes from library or idea board into slots (dnd-kit)
  - "Log what I ate" button per slot — marks status as `cooked`, sets `logged_at`
  - Free-text logging for meals without a saved recipe
  - Health score summary bar at top — updates live as slots are filled, color-coded green/yellow/red
  - One-tap grocery list generation from planned recipes
  - AI nudge banner: proactive suggestions based on the week's nutrition balance
- **Month view**: condensed calendar showing meal summaries per day
  - Each day shows colored indicator dots or a single meal title (not full slot detail)
  - Click any day → zooms into week view for that week
  - Drag a recipe to a day in month view → prompts meal slot assignment on zoom-in
  - Health score shown as a subtle color wash per day (green/yellow/red)
- **Data model unchanged** — `plan_entries` is already date-based; week vs month is just a different query date range

### 3. Grocery List
- Auto-generated from all planned recipe ingredients for the week
- Smart deduplication and quantity merging across recipes
- Pantry staples filtered out automatically (user-defined list)
- Grouped by category (produce, proteins, dairy, pantry, etc.)
- Check off items in-app while shopping
- "Copy to clipboard" as plain text fallback

### 4. AI Agent (Claude API)
- Chat drawer accessible from any screen
- Has full context: recipe library, disliked foods, current week plan, cook history, health goals
- Proactive nudges on the weekly planner view
- Use cases:
  - "Does my plan look balanced this week?"
  - "What can I make with chicken and sweet potato?"
  - "I haven't tried anything new in a while — suggest something"
  - "Scale this recipe to 3 servings"
  - "What's a good substitute for buttermilk here?"

**Claude API call pattern (hybrid AI — only call AI where it matters):**
```javascript
// Use AI for: recipe extraction, idea generation, agent chat, plan review
// Use simple logic for: grocery dedup, unit conversion, health score calculation

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: `You are a personal cooking assistant. You have access to the user's recipe library,
             disliked foods: ${JSON.stringify(user.disliked_foods)},
             current week plan: ${JSON.stringify(weekPlan)},
             and cook history summary: ${JSON.stringify(cookHistory)}.
             Always respond in a helpful, concise way. For structured outputs, respond with JSON only.`,
    messages: conversationHistory
  })
});
```

### 5. Idea Generator
- Filter inputs: cuisine, max prep time, protein type, difficulty
- Disliked foods automatically excluded from all suggestions
- Claude generates 5–8 ideas as structured cards
- One-tap to save as draft recipe or drop into weekly plan

### 6. Cook Mode
- Full-screen, distraction-free view
- One step at a time with swipe to advance
- Per-step countdown timers
- WakeLock API keeps screen on
- Metric display (user preference)

### 7. Auth & Sharing
- Supabase Auth: email/password + Google OAuth
- Session persisted in cookies (Next.js App Router pattern)
- Public recipe links: `/r/{public_slug}` — works without login
- Family sharing (phase 2): invite by email → joins family group → sees shared recipes

---

## Unit Conversion

Store all recipe ingredients in metric (grams, ml) as the source of truth. Display in user's preferred unit system. Conversion happens at render time, never mutates stored data.

> **Open questions to think through:**
> - **Preview-only mode**: Should users be able to enter a recipe (or import one) without saving, just to preview the nutrition metrics? Could be a lightweight "try before you save" flow.
> - **Default unit preference**: Add a setting in user profile for preferred unit system (metric vs US/imperial). When importing or entering a recipe, the display defaults to that preference. We already plan to store everything as metric internally — this would just control how it's shown.
> - **Do we save both metric and US values?** Current plan: store metric only, convert at render time. This is simpler and avoids drift. The alternative (storing both) adds write complexity and sync risk if values ever diverge. Lean toward store-once-convert-at-render unless there's a performance reason not to.

```javascript
// Simple conversion lookup — no AI needed
const CONVERSIONS = {
  cup_to_ml: 236.588,
  tbsp_to_ml: 14.787,
  tsp_to_ml: 4.929,
  oz_to_g: 28.3495,
  lb_to_g: 453.592,
};
```

---

## Health Score Calculation

Simple weighted formula — no AI needed, runs client-side.

```javascript
function computeHealthScore(nutrition) {
  // Score out of 100, higher = healthier
  const scores = {
    protein:  Math.min(nutrition.protein_g / 30, 1) * 25,   // up to 25 pts
    fiber:    Math.min(nutrition.fiber_g / 8, 1) * 20,      // up to 20 pts
    calories: nutrition.calories < 600 ? 20 : nutrition.calories < 800 ? 10 : 0,
    sodium:   nutrition.sodium_mg < 600 ? 20 : nutrition.sodium_mg < 1000 ? 10 : 0,
    fat:      nutrition.sat_fat_g < 5 ? 15 : nutrition.sat_fat_g < 10 ? 8 : 0,
  };
  return Math.round(Object.values(scores).reduce((a, b) => a + b, 0));
}
```

---

## PWA & Offline Setup

Add to `next.config.js` using `next-pwa` (Workbox under the hood):
- Cache: recipe library, current + next week's plan, all recipe images
- Background sync: queue plan edits made offline, sync when connection returns
- Web App Manifest: add to home screen, splash screen, theme color

---

## Build Order

Build in this sequence to avoid rework:

1. **Supabase setup** — run schema SQL, configure RLS, set up auth providers ✅
2. **Next.js scaffold** — `npx create-next-app`, add Tailwind + shadcn, wire Supabase client ✅
3. **Auth** — login/signup pages, session handling, protected routes ✅
4. **Recipe library** — manual entry form + card grid display (no AI yet) ✅
5. **Weekly planner** — calendar UI + drag-and-drop with dnd-kit ✅
6. **Recipe import** — URL + photo parsing via Claude API
7. **Health scoring** — wire up USDA API, compute scores, display on planner
8. **Cook mode** — full-screen step view with timers
9. **Grocery list** — generate from planner, dedup logic, pantry filter
10. **AI agent** — chat drawer + weekly nudges
11. **Idea generator** — Claude-powered with disliked foods filter
12. **PWA** — service worker, offline caching, manifest
13. **Public sharing links** — `/r/{slug}` routing
14. **Family sharing** — invite flow, family_members table, shared recipe visibility

---

## Key Libraries

```json
{
  "dependencies": {
    "next": "^14",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0",
    "dnd-kit": "^6",
    "zustand": "^4",
    "tailwindcss": "^3",
    "shadcn-ui": "latest",
    "next-pwa": "^5",
    "date-fns": "^3",
    "zod": "^3"
  }
}
```

---

## Future Considerations (Phase 2+)

- **Pantry tracker**: mark ingredients as stocked → auto-exclude from grocery list
- **Frequency signals**: `last_cooked_at` + `cook_count` → AI agent references ("you haven't made this in 3 months")
- **Family sharing**: invite flow, per-member disliked foods, shared recipe pool
- **Native app shell**: wrap PWA in Expo for push notifications and haptics
- **Export**: PDF recipe cards, share to AnyList or Instacart
- **Recipe versioning**: track edits over time, restore previous versions

---

*Plan generated April 2026. Stack versions may need updating at time of build.*

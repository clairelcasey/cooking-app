@AGENTS.md

# Cooking App — Claude Guidelines

## Security

This is a public repository. Before pushing any commit:

- Confirm no secrets, API keys, or credentials are staged (Supabase URL/keys, Anthropic API key, Google OAuth credentials, etc.)
- Confirm `.env.local` and any other `.env*` files are not tracked by git
- Confirm no hardcoded secrets appear in source files — all sensitive values must come from `process.env`
- If a new secret is needed, add it to `.env.local` (gitignored) and document the variable name in a `.env.local.example` file with a placeholder value

# 🐾 PawPulse

Your all-in-one hub for pet care, health & fun — an AI-assisted pet-care app built on a
fully open-source, self-hostable stack.

Originally scaffolded on Base44, PawPulse has been **ported off Base44's hosted backend**
onto **Supabase** (Postgres + Auth + Storage + Edge Functions) with a pluggable,
OpenAI-compatible LLM backend. There is no proprietary backend dependency — you own the
data, the functions, and the deploy.

**Live demo:** https://pawpulse-pawpulse.vercel.app

---

## ✨ Features

- **Pet profiles** — track meals, walks, weight, and vet visits per pet
- **Health & vaccinations** — log records and get gentle renewal reminders
- **AI Coach** — ask pet-care questions, get diet plans, seasonal alerts (LLM-backed)
- **Community feed** — share wins and tips with other owners
- **Shop** — Amazon product search + local service (walker/sitter) booking
- **Shareable "pet's week" story graphics** — AI-generated images
- **No login wall** — opens straight to Home via Supabase anonymous sign-in; each device
  gets its own private data

## 🏗️ Architecture

```
React (Vite) SPA
   │
   ├─ src/api/base44Client.js   ← adapter: entities.* → Supabase tables,
   │                              integrations.Core.* → Edge Functions / Storage
   │
   ▼
Supabase
   ├─ Postgres + Row Level Security   (per-user private data; global read for community)
   ├─ Auth                            (anonymous sign-in — no login screen)
   ├─ Storage  bucket: uploads/       (pet & generated images, owner-scoped RLS)
   └─ Edge Functions (Deno)
        ├─ invoke-llm      → any OpenAI-compatible LLM (default: Google Gemini free tier)
        └─ generate-image  → free Pollinations image gen, stored in our own bucket
```

The frontend only ever holds the **public** Supabase URL + anon key (RLS enforces access).
All privileged keys (service role, LLM API keys) live **only** in Edge Function secrets.

## 🚀 Local development

Prerequisites: Node 18+, npm, and a Supabase project.

```bash
npm install
cp .env.example .env.local     # fill in your Supabase URL + anon key
npm run dev                    # http://localhost:5173
```

`.env.local` needs only the two **public** frontend values:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 🗄️ Backend setup (Supabase)

1. **Create a Supabase project** and grab the project ref, URL, and anon key.
2. **Apply the schema + RLS + storage** migrations in `supabase/migrations/` (run them in
   the SQL editor, or via `supabase db push`).
3. **Enable anonymous sign-ins:** Dashboard → Authentication → Sign In / Providers →
   **Anonymous sign-ins** → enable. (The app calls `signInAnonymously()` on load.)
4. **Set Edge Function secrets** (never commit these):
   ```bash
   supabase secrets set LLM_API_KEY=your-llm-key --project-ref <ref>
   supabase secrets set LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai --project-ref <ref>
   supabase secrets set LLM_MODEL=gemini-flash-lite-latest --project-ref <ref>
   ```
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected into functions.
5. **Deploy the Edge Functions** (no Docker needed with `--use-api`):
   ```bash
   supabase functions deploy invoke-llm     --project-ref <ref> --use-api
   supabase functions deploy generate-image --project-ref <ref> --use-api
   ```

### Swapping the LLM provider

`invoke-llm` targets any OpenAI-compatible chat-completions endpoint. Set `LLM_BASE_URL`,
`LLM_MODEL`, and `LLM_API_KEY` accordingly. Examples in `.env.example`:

- **Google Gemini (free tier, default):** `gemini-flash-lite-latest` — healthy daily quota;
  latency is erratic on the free tier (a paid key on the same endpoint is consistently fast).
- **OpenRouter (open-source models):** e.g. `google/gemma-4-31b-it:free`. When the base URL
  contains `openrouter`, the function also tries a set of free-model fallbacks.

## 🌐 Deploy (Vercel)

The build bakes the public `VITE_` values into the JS, so a prebuilt `dist/` needs no host
env config. SPA routing is handled by `vercel.json` rewrites (and `public/_redirects` for
Netlify/Cloudflare portability).

```bash
npm run build
npx vercel@latest deploy --prod --yes
```

New Vercel projects default to SSO/Deployment Protection (auth wall on all URLs) — disable
it in Project → Settings → Deployment Protection if the app should be public.

## 📁 Layout

```
src/                 React app (pages, components, hooks)
src/api/             Supabase adapter (base44Client.js) + entities/integrations
supabase/functions/  Edge functions (invoke-llm, generate-image)
supabase/migrations/ SQL: schema, RLS, uploads bucket
base44/              Original Base44 entity/function definitions (reference only)
public/              logo, manifest, _redirects
```

## 📝 License

MIT — see [LICENSE](LICENSE).

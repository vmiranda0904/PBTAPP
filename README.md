# PBTAPP

A premium React + Vite volleyball product concept wired for real Supabase athlete data, AI pipeline highlights, Stripe subscriptions, a conversion-focused landing page, and investor pitch content.

## Live architecture

Frontend (Vercel)  
↓  
API Routes (Vercel)  
↓  
AI Engine (Railway)  
↓  
Supabase (DB + Storage)  
↓  
Stripe (Payments)

## Product surfaces

- Landing page with hero, feature grid, pricing, and CTA
- Onboarding flow for athlete, coach, and recruiter roles
- Athlete dashboard
- Coach dashboard
- Live game mode
- Recruiter dashboard
- Athlete profile
- Investor pitch deck view

## Data + monetization architecture

- `src/lib/supabase.ts` initializes the Supabase browser client
- `src/lib/api.ts` fetches athlete, stats, and subscription rows from Supabase
- `services/ai-engine/main.py` exposes a Railway-ready FastAPI AI engine with `/health`, `/results`, and `/live`
- `services/ai-engine/save_results.py` persists AI-generated stat payloads and highlight URLs
- `api/checkout.js` creates Stripe subscription checkout sessions
- `api/webhook.js` processes Stripe webhook events and persists subscription status into Supabase
- `supabase/schema.sql` contains the athlete, stats, and subscriptions tables

## Production deployment

### Vercel

- Import the repository in Vercel
- Use the repo root as the project root
- The included `vercel.json` builds the Vite frontend and serves `api/*.js` as serverless functions
- Configure frontend env vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_AI_PIPELINE_URL`
  - `VITE_CHECKOUT_API_URL=/api/checkout`
  - `VITE_STRIPE_ATHLETE_PRO_PRICE_ID`
  - `VITE_STRIPE_COACH_PRO_PRICE_ID`
  - `VITE_STRIPE_RECRUITER_PRO_PRICE_ID`
- Configure server env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_SUCCESS_URL`
  - `STRIPE_CANCEL_URL`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Railway

- Deploy `services/ai-engine`
- Use the included `services/ai-engine/Procfile`
- Install Python dependencies from `services/ai-engine/requirements.txt`
- Configure:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `PORT`

### Stripe live mode

- Create products for:
  - Athlete Pro → $12/mo
  - Coach Pro → $199/mo
  - Recruiter Pro → $149/mo
- Point the webhook endpoint to `/api/webhook`
- Use live API keys in production

## Test checklist

- signup works
- role redirect works
- AI pipeline returns data
- highlight appears
- Stripe checkout works
- subscription unlocks feature

## Investor pitch

The pitch deck content is available in-app and mirrored in `INVESTOR_PITCH.md`.

## Supabase schema

Apply the SQL in `supabase/schema.sql` to create:

- `athletes`
- `stats`
- `subscriptions`

The AI pipeline helper updates `athletes.highlight_url`, recalculates `athletes.score`, and creates or updates the linked `stats` row for each athlete upload. Stripe webhooks upsert subscription state into `subscriptions`.

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run lint
npm run build
```

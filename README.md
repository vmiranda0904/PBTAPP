# PBTAPP

A premium React + Vite volleyball product concept wired for real Supabase athlete data, AI pipeline highlights, and Stripe subscription upgrades.

## Data + monetization architecture

- `src/lib/supabase.ts` initializes the Supabase browser client
- `src/lib/api.ts` fetches athlete and stat rows from Supabase
- `services/ai-engine/save_results.py` persists AI-generated stat payloads and highlight URLs
- `api/checkout.js` creates Stripe subscription checkout sessions
- `supabase/schema.sql` contains the final athlete and stats table schema

## Environment setup

Copy `.env.example` to `.env` and provide:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEFAULT_ATHLETE_ID`
- `VITE_AI_PIPELINE_URL`
- `VITE_CHECKOUT_API_URL`
- `VITE_STRIPE_ATHLETE_PRO_PRICE_ID`
- `VITE_STRIPE_COACH_PRO_PRICE_ID`
- `VITE_STRIPE_RECRUITER_PRO_PRICE_ID`

For the checkout handler, configure server-side environment variables in your deployment platform:

- `STRIPE_SECRET_KEY`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

## Supabase schema

Apply the SQL in `supabase/schema.sql` to create:

- `athletes`
- `stats`

The AI pipeline helper updates `athletes.highlight_url`, recalculates `athletes.score`, and creates or updates the linked `stats` row for each athlete upload.

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

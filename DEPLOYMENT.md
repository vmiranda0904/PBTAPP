# Production deployment

## Vercel

1. Import the repository into Vercel.
2. Keep the root directory at the repository root.
3. Add frontend environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_AI_PIPELINE_URL`
   - `VITE_CHECKOUT_API_URL=/api/checkout`
   - `VITE_STRIPE_ATHLETE_PRO_PRICE_ID`
   - `VITE_STRIPE_COACH_PRO_PRICE_ID`
   - `VITE_STRIPE_RECRUITER_PRO_PRICE_ID`
4. Add server environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_SUCCESS_URL`
   - `STRIPE_CANCEL_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Configure Stripe to send live webhook events to `/api/webhook`.

## Railway

1. Deploy `services/ai-engine`.
2. Use the included `services/ai-engine/Procfile`.
3. Set:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `PORT`
4. Confirm `GET /health` returns `{"status":"ok"}`.

## Stripe live mode

- Athlete Pro → $12/mo
- Coach Pro → $199/mo
- Recruiter Pro → $149/mo

## Demo checklist

- signup works
- role redirect works
- AI pipeline returns data
- highlight appears
- Stripe checkout works
- subscription unlocks feature

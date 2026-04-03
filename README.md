# PBTAPP

A premium React + Vite volleyball product concept wired for real Supabase athlete data, AI pipeline highlights, Stripe subscriptions, a conversion-focused landing page, and investor demo content.

The product direction now spans three connected experiences:

- **Athlete App** — highlights, stats, score, and shareable recruiting profiles
- **Team / Coach Platform** — analytics, scouting, game plans, and live coaching tools
- **Recruiter Network** — athlete search, rankings, comparisons, and saved prospects

## Features

Frontend (Vercel)  
↓  
API Routes (Vercel)  
↓  
AI Engine (Railway)  
↓  
Supabase (DB + Storage)  
↓  
Stripe (Payments)

## Priority order

1. Investor demo + story
2. Production deployment
3. Landing page + onboarding
4. User acquisition

## Product surfaces

- Demo-ready landing / entry flow
- Demo script and investor pitch content
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

## Demo mode

Set `VITE_DEMO_MODE=true` to keep the walkthrough stable even when live services are unavailable. Demo mode fills the athlete, coach, live, and recruiter flows with polished sample data for rehearsals and investor presentations.

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


## AI engine skeleton

The repository now includes a backend service skeleton at `services/ai-engine` for sports performance and video-analysis workloads.

### API contract

- `POST /jobs` — upload a video and create an async processing job
- `GET /jobs/{job_id}` — poll job state and retrieve the latest report payload
- `GET /jobs/{job_id}/report` — download the generated JSON report
- `GET /health` — inspect device selection and pipeline defaults

### Performance-first defaults in v1

- Frame skipping defaults to every 3rd frame
- Detection cadence defaults to every 5th eligible frame
- Frames are resized to `640x360` before model inference
- Default model target is `yolov8n.pt`
- Result caching is keyed by the uploaded video hash
- FFmpeg export defaults are `-preset ultrafast -crf 28`
- GPU deployment is designed around `cuda` when available and recommends RunPod for production

### Run the AI engine locally

```bash
cd services/ai-engine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set `VITE_AI_ENGINE_URL=http://localhost:8000` in the frontend `.env` file to enable the upload and polling UI.

## Coach scouting AI

The AI engine now layers coach-facing scouting intelligence on top of the video job flow.

### Scouting outputs

- Opponent profiles by team and player
- Play-event records with timestamp, player, positions, result, and pressure level
- Tendency analysis for left / middle / right attack preferences
- Weakness detection based on repeated error patterns
- Automated game-plan recommendations and live-adjustment prompts
- Simple positional heatmaps for coach review in the frontend dashboard
- Team-vs-team matchup analysis and comparison insights
- Priority-ranked live alerts for the browser voice assistant
- Athlete scoring/rankings plus auto-generated playbook and defensive scheme outputs
- Downloadable PDF scouting report artifacts

### Updated upload contract

`POST /jobs` now accepts:

- `video` — opponent film upload
- `sport` — sport context, defaulting to `volleyball`
- `team_name` — opponent name used in the scouting report

The current backend still uses a deterministic preview generator for play events until tracked detections are wired in, but the contract and UI are now ready for real tendency, weakness, and game-plan outputs.

### Voice assistant and report artifacts

- High-priority live insights can be spoken through the browser speech API, which automatically uses the active Bluetooth audio output when connected.
- The AI engine now also produces a local PDF scouting report at `GET /jobs/{job_id}/report.pdf`.
- When cloud storage credentials are added later, the PDF generation step can be extended to upload and return public share links.

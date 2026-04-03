# Team Communications App

A simple React + Vite workspace for team communication, shared calendar planning, roster visibility, and lightweight management tracking.

## Features

- Team communication feed for announcements and channel updates
- Team calendar for upcoming meetings and milestones
- Roster board showing teammates, roles, locations, and availability
- Management board for tracking open follow-up tasks
- Quick add forms for updates, calendar events, and teammates

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

### Updated upload contract

`POST /jobs` now accepts:

- `video` — opponent film upload
- `sport` — sport context, defaulting to `volleyball`
- `team_name` — opponent name used in the scouting report

The current backend still uses a deterministic preview generator for play events until tracked detections are wired in, but the contract and UI are now ready for real tendency, weakness, and game-plan outputs.

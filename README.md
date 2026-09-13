# Echoscribe

Echoscribe turns a podcast or any spoken-audio file into something you can read:
a full transcript, an English summary (and a summary in the original language if
it wasn't English), and a sentiment/emotion breakdown across the recording.

It's a small full-stack app — a FastAPI backend that runs the models and a React
frontend that drives the uploads and shows the results.

## What it does

| Step | Model |
|------|-------|
| Speech-to-text + language detection | OpenAI Whisper (`base`) |
| Translation to / from English | Helsinki-NLP OPUS-MT |
| Summarization | `facebook/bart-large-cnn` |
| Sentiment | default HF `sentiment-analysis` pipeline |
| Emotion (per chunk) | `j-hartmann/emotion-english-distilroberta-base` |

Uploads are processed by a background worker; the frontend polls job status and
loads the result when it's ready. There's no database — each browser gets an
anonymous session cookie, and the backend keeps that session's jobs in memory
for the History panel. History resets whenever the backend restarts, and one
browser never sees another's jobs.

You can also download a short **audio summary**: the backend narrates the
summary text with the OS's offline text-to-speech engine and hands back a WAV
file — a "listen to it in 30 seconds" version of the podcast.

## Project layout

```
backend/     FastAPI app, background worker, model cache, in-memory session store
frontend/    React 19 + Vite + Tailwind UI
legacy/      the original Streamlit prototype (kept for reference)
```

## Running it locally

With Docker:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API + Swagger docs: http://localhost:8000/docs

The first start downloads the model weights from Hugging Face, which can take a
few minutes. After that they're cached.

Without Docker, run the two halves separately:

```bash
# backend
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# frontend
cd frontend && npm install && npm run dev
```

`ffmpeg` needs to be on your PATH for Whisper to read audio. On Linux, the
audio-summary feature also needs `espeak` installed (the Docker image
already includes it); on Windows and macOS the built-in TTS voice is used
automatically.

Copy `.env.example` to `.env` before running `docker compose up` — Compose
refuses to start without it.

## Deploying (backend on Render, frontend on Vercel)

### Backend — Render

You can create the service either from [`render.yaml`](render.yaml) (**New →
Blueprint**, config applied automatically) or manually (**New → Web
Service**). Either way, these settings matter:

| Setting | Value |
|---|---|
| Runtime | Docker |
| Dockerfile Path | `Dockerfile` (repo root — Render's default, nothing to change) |
| Docker Build Context Directory | `.` (repo root — Render's default) |
| Health Check Path | `/health` |

The Dockerfile lives at the repo root specifically so these can stay at
Render's defaults — no custom path to get wrong.

Environment variables — see [`render.yaml`](render.yaml) for the full list
(`WHISPER_MODEL_SIZE`, `MAX_UPLOAD_SIZE_MB`, `ALLOWED_ORIGINS`,
`COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`). `COOKIE_SAMESITE`/`COOKIE_SECURE`
are required as-is because the frontend and backend live on different
domains, so the session cookie only survives as a cross-site cookie.

**Plan sizing.** This app loads Whisper, a summarizer, two translation
models, and sentiment/emotion pipelines into memory at startup — comfortably
under 2GB combined, but well past what Render's free/starter 512MB tier can
hold (confirmed in practice: it OOM-crashes mid-job on that tier even after
aggressive lazy-loading and per-step memory tricks). Use at least the
**Standard** plan (2GB RAM). The blueprint also provisions a persistent disk
mounted at `/root/.cache` so model weights (several GB, pulled from Hugging
Face on first boot) are cached across deploys instead of re-downloaded every
time — Free/Starter don't support persistent disks at all.

First boot downloads all the model weights — expect several minutes before
`/health` goes green.

Once deployed, note your service URL (e.g.
`https://echoscribe-backend.onrender.com`).

### Frontend — Vercel

1. Import the repo into Vercel with **Root Directory** set to `frontend`
   (Vite framework preset is auto-detected via `vercel.json`).
2. Set the project env var `VITE_API_URL` to the Render URL from step 6
   above, with no trailing slash. The frontend calls this URL directly for
   every API request (uploads can be tens of MB, well past what a
   same-origin rewrite/proxy through Vercel's edge network reliably
   forwards) rather than going through a rewrite.
3. Deploy. Update `ALLOWED_ORIGINS` on Render if the final Vercel URL
   differs from what you set in step 4 above (custom domain, preview URLs,
   etc.) and redeploy the backend.

### Known tradeoffs to expect in production

- **No database**: job history lives in memory per backend process. A
  Render restart or redeploy clears everyone's history. Don't run more than
  one backend instance/replica — a second instance would maintain its own,
  inconsistent history.
- **Cold start on redeploy**: models are preloaded at startup for fast first
  requests, but that preload itself takes a little while after each deploy —
  `/health` won't go green until it finishes.

## Credits

Designed & developed by Murugavel V. Licensed under the terms in [LICENSE](LICENSE).

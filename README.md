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

**On the Free plan (512MB RAM), read this first.** This app runs Whisper +
a summarizer + two translation models + sentiment/emotion pipelines —
several GB combined if all were resident at once, which will not fit in
512MB. To make Free plausible, the code:
- loads each model lazily on first use instead of preloading everything at
  startup (`backend/main.py`), so idle memory stays low and the health
  check doesn't wait on a multi-GB download;
- releases each model from memory immediately after its processing step
  (`backend/worker.py` + `backend/ml/model_cache.py`), so at most one
  model is resident at a time — at the cost of reloading it from local
  disk cache on the *next* job;
- uses `sshleifer/distilbart-cnn-12-6` (~300MB) instead of
  `facebook/bart-large-cnn` (~1.6GB) for summarization.

Even so, this is a tight fit and **not guaranteed** — PyTorch's own
baseline overhead plus a single model's weights and activation memory can
still flirt with 512MB, and Free has no persistent disk, so every restart
or idle spin-down re-downloads all model weights from Hugging Face (several
minutes before `/health` goes green again). Set `WHISPER_MODEL_SIZE=tiny`
(smaller than the default `base`) to shave off a bit more. If it still
OOMs, the honest fix is upgrading the instance type — no code changes
needed, everything above still works and gets faster (less
loading/releasing churn) with more RAM.

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
  Render restart, redeploy, or the free-tier idle spin-down clears
  everyone's history. Don't run more than one backend instance/replica —
  a second instance would maintain its own, inconsistent history.
- **Cold starts**: every job now reloads whatever model it needs (see the
  Free-plan note above), and Free additionally spins the whole service down
  after 15 minutes idle — so both "first request after a while" and, to a
  lesser extent, every individual analysis step will be slower than a
  beefier always-warm plan.

## Credits

Designed & developed by Murugavel V. Licensed under the terms in [LICENSE](LICENSE).

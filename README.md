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

1. Push this repo to GitHub/GitLab and create a new Blueprint on Render
   pointing at it — it picks up [`render.yaml`](render.yaml) automatically
   (a Docker web service built from `backend/Dockerfile`, using the repo
   root as the build context).
2. Pick at least the **Standard** plan (2 GB RAM). Whisper + BART-large-CNN
   + two translation models + a sentiment/emotion pipeline are all loaded
   into memory at startup — the 512 MB free/starter tier will get OOM-killed
   or fail the health check.
3. The blueprint provisions a persistent disk mounted at `/root/.cache` so
   model weights (several GB, pulled from Hugging Face on first boot) are
   cached across deploys instead of re-downloaded every time.
4. Set the `ALLOWED_ORIGINS` env var (marked `sync: false` in the blueprint,
   so Render will prompt for it) to your Vercel URL, e.g.
   `https://echoscribe.vercel.app`. `COOKIE_SAMESITE=none` and
   `COOKIE_SECURE=true` are already set — required because the frontend and
   backend live on different domains, so the session cookie only makes it
   back to the browser as a cross-site cookie.
5. First boot downloads all the model weights — expect several minutes
   before `/health` goes green. Render's free/starter tiers also spin down
   idle services, so the *first* request after any idle period will be
   slow again while everything reloads into memory.
6. Note your service URL (e.g. `https://echoscribe-backend.onrender.com`).

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
- **Cold starts**: on paid-but-modest Render plans, the first request after
  a deploy or wake-from-idle can take a long time while models load.

## Credits

Designed & developed by Murugavel V. Licensed under the terms in [LICENSE](LICENSE).

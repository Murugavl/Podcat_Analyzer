---
title: Echoscribe
emoji: 🎙️
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 4.44.1
app_file: app.py
pinned: false
---

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

## Deploying (backend on Hugging Face Spaces, frontend on Vercel)

This app loads Whisper, a summarizer, two translation models, and
sentiment/emotion pipelines into memory at startup — comfortably under 2GB
combined. That ruled out free-tier Render (512MB, OOM-crashes even after
aggressive memory tuning) and paid Render wasn't an option, so the backend
runs on **Hugging Face Spaces** instead: its free CPU tier gives 16GB RAM,
no credit card required, and it already hosts every model this app
downloads.

Docker Spaces specifically require a paid HF PRO subscription, so this
runs on the free **Gradio SDK** instead: [`app.py`](app.py) mounts the
existing FastAPI backend (`backend/main.py` — all its `/api/*` routes,
unchanged) underneath a one-page Gradio UI, which is there only to satisfy
the SDK's expectations. [`requirements.txt`](requirements.txt),
[`packages.txt`](packages.txt) (apt packages: `ffmpeg`, `espeak`,
`libespeak1`), and [`runtime.txt`](runtime.txt) at the repo root are what
Spaces' non-Docker build reads — separate from `backend/requirements.txt`
and the `Dockerfile`, which still exist for local Docker Compose use.

### Backend — Hugging Face Spaces

1. Create a Space at [huggingface.co/new-space](https://huggingface.co/new-space):
   pick the **Gradio** SDK, Free CPU Basic hardware.
2. Push this repo to the Space's own git remote (shown on the Space's page
   after creation, e.g. `git remote add space https://huggingface.co/spaces/<user>/<space-name>`,
   then `git push space main`). The root [`README.md`](README.md) already
   carries the YAML frontmatter (`sdk: gradio`, `app_file: app.py`) Spaces
   needs to recognize and run [`app.py`](app.py) — no separate config file
   required.
3. In the Space's **Settings → Variables and secrets**, add the same
   variables Render would have needed: `WHISPER_MODEL_SIZE=base`,
   `MAX_UPLOAD_SIZE_MB=100`, `LOG_FILE=logs/podcast_analyzer.log`,
   `ALLOWED_ORIGINS=<your Vercel URL>`, `COOKIE_SAMESITE=none`,
   `COOKIE_SECURE=true`. `COOKIE_SAMESITE`/`COOKIE_SECURE` are required as-is
   because the frontend and backend live on different domains, so the
   session cookie only survives as a cross-site cookie.
4. First boot downloads all the model weights — expect several minutes
   before the Space status goes green. A Space that's gone idle re-downloads
   them on wake, since the free tier has no persistent disk (same tradeoff
   Render's free tier had, but with far more RAM to work with while it
   runs).
5. Note the Space's public URL, e.g. `https://<user>-<space-name>.hf.space`.

### Frontend — Vercel

1. Import the repo into Vercel with **Root Directory** set to `frontend`
   (Vite framework preset is auto-detected via `vercel.json`).
2. Set the project env var `VITE_API_URL` to the Space URL from step 5
   above, with no trailing slash. The frontend calls this URL directly for
   every API request (uploads can be tens of MB, well past what a
   same-origin rewrite/proxy through Vercel's edge network reliably
   forwards) rather than going through a rewrite.
3. Deploy. Update `ALLOWED_ORIGINS` on the Space if the final Vercel URL
   differs from what you set in step 3 above (custom domain, preview URLs,
   etc.) — no redeploy needed, Spaces variable changes restart the container.

### Known tradeoffs to expect in production

- **No database**: job history lives in memory per backend process. A
  Space restart (redeploy, or waking from idle) clears everyone's history.
  Don't run more than one backend instance/replica — a second instance
  would maintain its own, inconsistent history.
- **Cold start on redeploy/wake**: models are preloaded at startup for fast
  first requests, but that preload itself takes a little while — the Space
  won't accept requests until it finishes.

## Credits

Designed & developed by Murugavel V. Licensed under the terms in [LICENSE](LICENSE).

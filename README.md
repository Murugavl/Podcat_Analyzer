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

## Credits

Designed & developed by Murugavel V. Licensed under the terms in [LICENSE](LICENSE).

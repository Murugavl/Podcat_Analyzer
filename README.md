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
loads the result when it's ready. Past jobs are stored in SQLite and browsable
from the History panel.

## Project layout

```
backend/     FastAPI app, background worker, model cache, SQLite store
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

`ffmpeg` needs to be on your PATH for Whisper to read audio.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Railway (backend) and Vercel (frontend).

## Credits

Designed & developed by Murugavel V. Licensed under the terms in [LICENSE](LICENSE).

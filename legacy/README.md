# Legacy Streamlit prototype

This folder holds the original single-file Streamlit version of the project
(pre-rename, when it was called "Podcast Analyzer"). It is kept for reference
and as a self-contained fallback.

The current application is the FastAPI backend in [`../backend`](../backend) and
the React frontend in [`../frontend`](../frontend). New work goes there.

## Running the old prototype

```bash
cd legacy
python -m venv .venv && . .venv/Scripts/activate   # Windows
pip install -r requirements.txt
streamlit run app.py
```

`ffmpeg` must be on your PATH for Whisper to read audio.

## Files

| File | Purpose |
|------|---------|
| `app.py` | Streamlit UI + pipeline orchestration |
| `processor.py` | transcription / translation / summarisation / sentiment / emotion helpers |
| `requirements.txt` | Python deps for the Streamlit app |
| `packages.txt`, `runtime.txt` | Streamlit Community Cloud deploy hints |

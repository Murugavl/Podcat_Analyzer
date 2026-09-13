# app.py — Hugging Face Spaces (Gradio SDK) entrypoint.
#
# Docker Spaces require a paid HF PRO plan; the free tier only offers the
# Gradio/Streamlit/Static SDKs. Gradio is itself built on FastAPI, so the
# existing backend (backend/main.py — all its /api/* routes, CORS,
# startup/shutdown hooks) is mounted as-is; a minimal Gradio page is
# mounted alongside it purely to satisfy the SDK's expectation of a
# Gradio UI. The actual product is the React frontend on Vercel, which
# talks to this Space's /api/* routes directly.
import gradio as gr
import uvicorn

from backend.main import app as fastapi_app

with gr.Blocks(title="Echoscribe", analytics_enabled=False) as ui:
    gr.Markdown(
        "# Echoscribe backend\n"
        "This Space serves the Echoscribe API. The actual app is the "
        "React frontend, which talks to this Space's `/api/*` routes.\n\n"
        "API docs: `/docs` · Health check: `/health`"
    )

app = gr.mount_gradio_app(fastapi_app, ui, path="/ui")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)

# Lives at the repo root (not backend/) so platform defaults work without
# custom per-service path configuration: Render's default Dockerfile
# path/context, and Hugging Face Spaces' Docker SDK, both expect it here.
# Build context is the repo root.
FROM python:3.10-slim
RUN apt-get update && apt-get install -y ffmpeg espeak libespeak1 curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
COPY backend/constraints.txt backend/constraints.txt
ENV PIP_CONSTRAINT=/app/backend/constraints.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/
RUN mkdir -p audio logs
EXPOSE 8000
# Render injects $PORT at runtime; Hugging Face Spaces does not (it routes
# to the port declared as `app_port` in README.md's frontmatter, which is
# set to 8000 to match this fallback); `docker compose up` also relies on
# the fallback since it publishes a fixed host port instead.
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

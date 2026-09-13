# Lives at the repo root (not backend/) so Render's default Dockerfile
# path/context ("Dockerfile" at repo root) works without any custom
# per-service path configuration. Build context is the repo root.
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
# Render (and most PaaS hosts) inject $PORT at runtime; fall back to 8000
# for `docker compose up`, which publishes a fixed host port instead.
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

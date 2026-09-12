FROM python:3.10-slim
RUN apt-get update && apt-get install -y ffmpeg espeak libespeak1 curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt backend/requirements.txt
COPY constraints.txt backend/constraints.txt
ENV PIP_CONSTRAINT=/app/backend/constraints.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY . backend/
RUN mkdir -p audio logs
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

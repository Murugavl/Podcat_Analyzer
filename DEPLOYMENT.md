# Deployment Guide: Echoscribe

This guide details instructions for launching the Podcast Analyzer application locally using Docker Compose, as well as cloud deployment parameters for Railway (backend) and Vercel (frontend).

---

## 1. Local Development (Docker Compose)

The application is dockerized with separate backend and frontend containers. Database and log directories are mounted to named Docker volumes for persistent storage.

### Running the App
From the project root directory, run:
```bash
docker compose up --build
```

- **Backend API**: Accessible at [http://localhost:8000](http://localhost:8000).
- **Backend Swagger UI**: Available at [http://localhost:8000/docs](http://localhost:8000/docs).
- **Frontend Dashboard**: Accessible at [http://localhost:5173](http://localhost:5173).

---

## 2. First-Time Startup & Model Preloading

> [!NOTE]
> During the very first launch, the backend downloads the ML model weights (Whisper model, Helsinki translations, BART summarizer, and DistilRoBERTa emotion classifier) directly from Hugging Face.
> 
> Depending on network speeds, this download can take **5 to 10 minutes**. The backend health check features a `start_period` buffer of **60 seconds** and multiple retries to handle this startup latency. Once downloaded, these models are cached and subsequent restarts will boot instantly.

---

## 3. Deploying the Backend to Railway

Railway runs the backend service using the Dockerfile located in `backend/`.

### Deployment Steps:
1. Log in to [Railway](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repository** and select this repository.
3. In the project settings, configure:
   - **Root Directory**: `/` (Leave empty or set to root).
   - **Build Command / Builder**: Railway automatically detects `railway.toml` at root and targets the `backend/Dockerfile` with Docker builder.
4. Set the following **Environment Variables** in the Railway service dashboard under Variables:
   - `WHISPER_MODEL_SIZE` = `base`
   - `MAX_UPLOAD_SIZE_MB` = `100`
5. Railway will bind to the required port using the `$PORT` variable injected automatically.

> [!WARNING]
> Downloading and running large neural network models requires memory. It is highly recommended to configure a container plan with at least **512MB to 1GB RAM** in Railway. Free tier instances with low RAM allocations may encounter Out-Of-Memory (OOM) faults or build timeouts.

---

## 4. Deploying the Frontend to Vercel

Vercel serves the React 19 single-page application as static files, utilizing route rewrites for proxying API calls.

### Deployment Steps:
1. Log in to [Vercel](https://vercel.com) and click **Add New** > **Project**.
2. Import this GitHub repository.
3. In the configuration window:
   - **Root Directory**: `frontend` (Make sure to select the `frontend/` directory).
   - **Framework Preset**: `Vite` (automatically detected).
4. Add the following **Environment Variable**:
   - `VITE_API_URL` = `https://your-backend-app.railway.app` (Replace with your actual Railway deploy URL).
5. Deploy!

### Route Proxy Configuration
The frontend redirects `/api/*` requests using the rules defined in `frontend/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-app.railway.app/api/:path*"
    }
  ]
}
```
*(Make sure to update `vercel.json` with your actual Railway production app domain after deploying the backend!)*

---

## 5. GitHub Actions CI Configuration

The repository is configured with a `.github/workflows/ci.yml` pipeline that triggers on pushes and pull requests to `main`.

- **Secrets Needed**: **None**. There are no API keys or database passwords embedded or hardcoded in this system.
- **Pipeline Jobs**:
  - `lint-and-test-backend`: Installs Python dependencies, checks formatting/linting using `ruff`, and runs test suites.
  - `lint-frontend`: Installs npm dependencies, runs syntax/linter tests, and verifies strict TypeScript compilation.
  - `security-check`: Confirms `.env` files are ignored and executes bandit scans for Python security vulnerabilities.
  - `docker-build`: Proactively builds both Dockerfiles to ensure images compile without breaking.

---

## 6. Accessing Logs in Production

- **Backend (Railway)**: Open the Railway dashboard, select the backend service, and navigate to the **Deployments** or **Live Logs** tab to view standard print logs, active API request responses, and download progression logs.
- **Frontend (Vercel)**: Navigate to the Vercel dashboard, click your project, and view live request logs under the **Logs** tab.

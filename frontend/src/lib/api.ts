import { AnalysisResult, EnqueueResponse, JobStatusResponse } from './types';

// In production the frontend (Vercel) and backend (Render) are on separate
// domains, so requests must go straight to the Render URL rather than
// through a same-origin proxy — Vercel's rewrite proxy caps request bodies
// far below the audio files this app uploads. Locally VITE_API_URL is
// unset, so requests fall back to relative paths handled by Vite's dev
// proxy (see vite.config.ts).
const API_BASE = import.meta.env.VITE_API_URL ?? '';

// The backend keeps history in memory, scoped to a cookie instead of a
// database — 'include' makes sure that cookie is sent (and accepted) even
// when the frontend and API are on different origins in production.
const CREDENTIALS: RequestCredentials = 'include';

export async function analyzeAudio(file: File): Promise<EnqueueResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    credentials: CREDENTIALS,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Analysis failed. Please try again.');
  }

  return response.json();
}

export async function getJobs(): Promise<AnalysisResult[]> {
  const response = await fetch(`${API_BASE}/api/jobs`, { credentials: CREDENTIALS });
  if (!response.ok) {
    throw new Error('Failed to fetch analysis history.');
  }
  return response.json();
}

export async function getJob(jobId: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, { credentials: CREDENTIALS });
  if (!response.ok) {
    throw new Error(`Failed to fetch job ${jobId}`);
  }
  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${API_BASE}/api/jobs/${jobId}/status`, { credentials: CREDENTIALS });
  if (!response.ok) {
    throw new Error(`Failed to fetch status for job ${jobId}`);
  }
  return response.json();
}

export async function deleteJob(jobId: string): Promise<{ deleted: boolean }> {
  const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
    method: 'DELETE',
    credentials: CREDENTIALS,
  });
  if (!response.ok) {
    throw new Error(`Failed to delete job ${jobId}`);
  }
  return response.json();
}

export async function downloadAudioSummary(jobId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/jobs/${jobId}/audio-summary`, {
    credentials: CREDENTIALS,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Could not generate the audio summary.');
  }
  return response.blob();
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Backend server is unhealthy.');
  }
  return response.json();
}

import { AnalysisResult, EnqueueResponse, JobStatusResponse } from './types';

// The backend keeps history in memory, scoped to a cookie instead of a
// database — 'include' makes sure that cookie is sent (and accepted) even
// when the frontend and API are on different origins in production.
const CREDENTIALS: RequestCredentials = 'include';

export async function analyzeAudio(file: File): Promise<EnqueueResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/analyze', {
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
  const response = await fetch('/api/jobs', { credentials: CREDENTIALS });
  if (!response.ok) {
    throw new Error('Failed to fetch analysis history.');
  }
  return response.json();
}

export async function getJob(jobId: string): Promise<AnalysisResult> {
  const response = await fetch(`/api/jobs/${jobId}`, { credentials: CREDENTIALS });
  if (!response.ok) {
    throw new Error(`Failed to fetch job ${jobId}`);
  }
  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`/api/jobs/${jobId}/status`, { credentials: CREDENTIALS });
  if (!response.ok) {
    throw new Error(`Failed to fetch status for job ${jobId}`);
  }
  return response.json();
}

export async function deleteJob(jobId: string): Promise<{ deleted: boolean }> {
  const response = await fetch(`/api/jobs/${jobId}`, {
    method: 'DELETE',
    credentials: CREDENTIALS,
  });
  if (!response.ok) {
    throw new Error(`Failed to delete job ${jobId}`);
  }
  return response.json();
}

export async function downloadAudioSummary(jobId: string): Promise<Blob> {
  const response = await fetch(`/api/jobs/${jobId}/audio-summary`, {
    credentials: CREDENTIALS,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Could not generate the audio summary.');
  }
  return response.blob();
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch('/health');
  if (!response.ok) {
    throw new Error('Backend server is unhealthy.');
  }
  return response.json();
}

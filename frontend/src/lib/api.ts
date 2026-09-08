import { AnalysisResult, EnqueueResponse, JobStatusResponse } from './types';

export async function analyzeAudio(file: File): Promise<EnqueueResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Analysis failed. Please try again.');
  }

  return response.json();
}

export async function getJobs(): Promise<AnalysisResult[]> {
  const response = await fetch('/api/jobs');
  if (!response.ok) {
    throw new Error('Failed to fetch analysis history.');
  }
  return response.json();
}

export async function getJob(jobId: string): Promise<AnalysisResult> {
  const response = await fetch(`/api/jobs/${jobId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch job ${jobId}`);
  }
  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`/api/jobs/${jobId}/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch status for job ${jobId}`);
  }
  return response.json();
}

export async function deleteJob(jobId: string): Promise<{ deleted: boolean }> {
  const response = await fetch(`/api/jobs/${jobId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete job ${jobId}`);
  }
  return response.json();
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch('/health');
  if (!response.ok) {
    throw new Error('Backend server is unhealthy.');
  }
  return response.json();
}

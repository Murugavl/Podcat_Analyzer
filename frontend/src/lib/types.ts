export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface SentimentResult {
  label: string;
  score: number;
}

export interface EmotionRow {
  chunk: string;
  emotion: string;
  score: number;
}

export interface AnalysisResult {
  job_id: string;
  status: AnalysisStatus;
  filename: string;
  detected_language: string;
  transcript: string;
  translated_transcript: string;
  summary_en: string;
  summary_original: string;
  sentiment: SentimentResult | null;
  emotions: EmotionRow[];
  error: string | null;
  created_at: string; // ISO datetime
}

export interface EnqueueResponse {
  job_id: string;
  status: AnalysisStatus;
}

export interface JobStatusResponse {
  job_id: string;
  status: AnalysisStatus;
  error: string | null;
}


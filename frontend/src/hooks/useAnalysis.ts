import { useState, useEffect, useRef } from 'react';
import { AnalysisResult } from '../lib/types';
import { analyzeAudio, getJob, getJobStatus } from '../lib/api';
import { useToast } from './useToast';

export function useAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const stepIntervalRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  // Stepper simulation timer
  useEffect(() => {
    if (isLoading) {
      setCurrentStep(0);
      stepIntervalRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < 5) return prev + 1;
          return prev;
        });
      }, 8000);
    } else {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
    }

    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, [isLoading]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const runAnalysis = async () => {
    if (!file) {
      addToast('warning', 'No file selected', 'Please select or drag an audio file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(0);
    addToast('info', 'Analysis started', 'This can take a minute or two. You can keep working in this tab.');

    // Clear any leftover polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    try {
      // 1. Submit the audio analysis job
      const enqueueData = await analyzeAudio(file);
      const jobId = enqueueData.job_id;

      // 2. Start polling status every 3 seconds
      pollingIntervalRef.current = window.setInterval(async () => {
        try {
          const statusData = await getJobStatus(jobId);
          
          if (statusData.status === 'complete') {
            // 4. Job complete, retrieve full result
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            const fullResult = await getJob(jobId);
            setResult(fullResult);
            setIsLoading(false);
            addToast('success', 'Analysis complete', 'Your podcast has been successfully analyzed.');
          } else if (statusData.status === 'failed') {
            // 5. Job failed
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            const errMsg = statusData.error || 'Job processing failed.';
            setError(errMsg);
            setIsLoading(false);
            addToast('error', 'Analysis failed', errMsg);
          }
          // If status is 'pending' or 'processing', let stepIntervalRef advance step.
        } catch (pollErr: any) {
          console.error('Error polling status:', pollErr);
        }
      }, 3000);

    } catch (err: any) {
      const errMsg = err.message || 'An unexpected error occurred.';
      setError(errMsg);
      addToast('error', 'Analysis failed', errMsg);
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setFile(null);
    setResult(null);
    setCurrentStep(0);
    setError(null);
  };

  const loadJobIntoResult = (job: AnalysisResult) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setResult(job);
    setFile(null);
    setError(null);
  };

  return {
    file,
    setFile,
    isLoading,
    result,
    currentStep,
    error,
    runAnalysis,
    resetAnalysis,
    loadJobIntoResult,
  };
}

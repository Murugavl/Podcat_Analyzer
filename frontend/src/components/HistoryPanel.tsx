import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, Mic, AlertCircle, Calendar } from 'lucide-react';
import { AnalysisResult } from '../lib/types';
import { getJobs, deleteJob } from '../lib/api';
import { formatRelativeTime } from '../lib/utils';
import { useToast } from '../hooks/useToast';
import { Skeleton } from './Skeleton';
import { cn } from '../lib/utils';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJob: (job: AnalysisResult) => void;
}

export function HistoryPanel({ isOpen, onClose, onSelectJob }: HistoryPanelProps) {
  const [jobs, setJobs] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getJobs();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // prevent selecting the job card
    if (!confirm('Are you sure you want to delete this job record?')) return;

    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
      addToast('success', 'Job deleted', 'The analysis job has been successfully removed.');
    } catch (err: any) {
      addToast('error', 'Delete failed', err.message || 'Could not delete the record.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'failed': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'processing': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse';
      default: return 'bg-hairline/10 border-hairline/20 text-ink-soft';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-overlay/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-canvas border-l border-hairline/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-hairline/10 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Mic className="h-4 w-4 text-indigo-400" />
                <span>Podcast Analysis History</span>
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-hairline/10 text-ink-soft hover:text-ink transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-card border border-hairline/10 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))
              ) : error ? (
                <div className="flex flex-col items-center justify-center text-center gap-3 py-10 text-rose-400">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-semibold">{error}</p>
                  <button
                    onClick={fetchJobs}
                    className="mt-2 px-4 py-2 rounded-xl bg-hairline/10 border border-hairline/15 text-xs font-semibold text-ink hover:bg-hairline/15"
                  >
                    Retry
                  </button>
                </div>
              ) : jobs.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center text-center gap-4 py-20 text-ink-faint">
                  <div className="p-4 rounded-full bg-hairline/10 border border-hairline/10">
                    <Mic className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">No past analyses yet</h3>
                    <p className="text-xs mt-1 max-w-[200px]">Upload your first podcast to begin building history.</p>
                  </div>
                </div>
              ) : (
                // Job cards
                jobs.map((job) => (
                  <div
                    key={job.job_id}
                    onClick={() => {
                      if (job.status === 'complete') {
                        onSelectJob(job);
                        onClose();
                      } else {
                        addToast('info', 'Job not complete', `This job is currently ${job.status}.`);
                      }
                    }}
                    className={cn(
                      "glass-card border border-hairline/10 rounded-2xl p-4 flex flex-col gap-3 transition-all cursor-pointer group hover:border-indigo-500/40 hover:bg-hairline/15",
                      job.status !== 'complete' && "cursor-not-allowed opacity-75"
                    )}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-xs font-bold text-ink truncate max-w-[180px] group-hover:text-indigo-400 transition-colors">
                        {job.filename}
                      </h4>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider", getStatusColor(job.status))}>
                        {job.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-ink-faint">
                      <Calendar className="h-3 w-3" />
                      <span>{formatRelativeTime(job.created_at)}</span>
                    </div>

                    {job.summary_en && (
                      <p className="text-[11px] text-ink-soft line-clamp-2 leading-relaxed bg-inset/50 p-2.5 rounded-xl border border-hairline/10">
                        {job.summary_en.length > 100 ? `${job.summary_en.substring(0, 100)}...` : job.summary_en}
                      </p>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={(e) => handleDelete(e, job.job_id)}
                        className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/50 border border-red-500/10 text-rose-400 hover:text-rose-300 transition-all active:scale-[0.95]"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

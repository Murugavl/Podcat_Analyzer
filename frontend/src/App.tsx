import { useState } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { useAnalysis } from './hooks/useAnalysis';
import { Layout } from './components/Layout';
import { UploadZone } from './components/UploadZone';
import { ProgressSteps } from './components/ProgressSteps';
import { ResultTabs } from './components/ResultTabs';
import { HistoryPanel } from './components/HistoryPanel';
import { ToastContainer } from './components/ToastContainer';
import { Globe, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { formatLanguage } from './lib/utils';

function MainApp() {
  const {
    file,
    setFile,
    isLoading,
    result,
    currentStep,
    runAnalysis,
    resetAnalysis,
    loadJobIntoResult,
  } = useAnalysis();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <Layout onHistoryClick={() => setIsHistoryOpen(true)}>
      <div className="w-full flex flex-col gap-8 max-w-5xl mx-auto">
        {!result && !isLoading && (
          <div className="flex flex-col items-center text-center gap-5 mt-12">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
              Read a podcast instead of listening to it
            </h1>
            <p className="text-sm md:text-base text-ink-soft max-w-xl leading-relaxed">
              Upload an audio file and Echoscribe returns a transcript, an English
              summary (plus one in the original language), and a breakdown of
              sentiment and emotion over the course of the recording.
            </p>
            <div className="w-full max-w-xl mt-4">
              <UploadZone
                file={file}
                setFile={setFile}
                onAnalyze={runAnalysis}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="grid md:grid-cols-2 gap-8 items-start mt-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-ink">Processing your file</h2>
              <p className="text-xs text-ink-soft">The upload finished and analysis is underway. Keep this tab open until it's done.</p>
              <UploadZone
                file={file}
                setFile={setFile}
                onAnalyze={runAnalysis}
                isLoading={isLoading}
              />
            </div>
            <ProgressSteps currentStep={currentStep} />
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-6">
            {/* Result Header Summary Bar */}
            <div className="glass-card border border-hairline/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <FileText className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                <h2 className="text-sm font-bold text-ink truncate max-w-[200px] sm:max-w-md">
                  {result.filename}
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
                  <Globe className="h-3 w-3" />
                  {formatLanguage(result.detected_language)}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle className="h-3 w-3" />
                  <span>{result.status}</span>
                </span>
              </div>
              <button
                onClick={resetAnalysis}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-hairline/10 hover:bg-hairline/15 border border-hairline/15 text-xs font-semibold text-ink-soft hover:text-ink transition-all active:scale-[0.98]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Analyze Another</span>
              </button>
            </div>

            {/* Result Tabs */}
            <ResultTabs result={result} />
          </div>
        )}
      </div>

      {/* Slide-in History Panel */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectJob={loadJobIntoResult}
      />

      {/* Notifications Portal */}
      <ToastContainer />
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ThemeProvider>
  );
}

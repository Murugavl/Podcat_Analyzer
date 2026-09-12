import { useState } from 'react';
import { Download, FileText, Globe, Loader2, MessageSquare, PieChart, Sparkles, Volume2 } from 'lucide-react';
import { AnalysisResult } from '../lib/types';
import { cn, formatLanguage, formatPercent, toParagraphs } from '../lib/utils';
import { downloadAudioSummary } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { EmotionChart } from './EmotionChart';

interface ResultTabsProps {
  result: AnalysisResult;
}

/** Renders a long string as spaced paragraphs inside a scroll area. */
function Prose({
  text,
  empty,
  className,
}: {
  text: string;
  empty: string;
  className?: string;
}) {
  const paragraphs = toParagraphs(text);
  if (paragraphs.length === 0) {
    return <p className="text-sm text-ink-faint italic">{empty}</p>;
  }
  return (
    <div
      className={cn(
        'max-h-[26rem] overflow-y-auto pr-2 text-sm leading-7 text-ink-soft',
        className
      )}
    >
      <div className="max-w-[70ch] space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

type TabType = 'summary' | 'transcript' | 'sentiment' | 'emotions';

export function ResultTabs({ result }: ResultTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [emotionPage, setEmotionPage] = useState(1);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const emotionsPerPage = 10;
  const { addToast } = useToast();

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudioSummary = async () => {
    setIsGeneratingAudio(true);
    try {
      const blob = await downloadAudioSummary(result.job_id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const stem = result.filename.replace(/\.[^./]+$/, '') || 'podcast';
      link.download = `${stem}-summary.wav`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      addToast(
        'error',
        'Audio generation failed',
        err.message || 'Could not generate the audio summary.'
      );
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Group emotions by chunk to find the top emotion per chunk
  const chunksMap: Record<string, { emotion: string; score: number }> = {};
  result.emotions.forEach((row) => {
    const chunkName = row.chunk;
    if (!chunksMap[chunkName] || row.score > chunksMap[chunkName].score) {
      chunksMap[chunkName] = { emotion: row.emotion, score: row.score };
    }
  });

  const chunkRows = Object.keys(chunksMap)
    .map((chunk) => ({
      chunk,
      emotion: chunksMap[chunk].emotion,
      score: chunksMap[chunk].score,
    }))
    .sort((a, b) => {
      const aNum = parseInt(a.chunk.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.chunk.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });

  const totalEmotionPages = Math.ceil(chunkRows.length / emotionsPerPage);
  const paginatedChunks = chunkRows.slice(
    (emotionPage - 1) * emotionsPerPage,
    emotionPage * emotionsPerPage
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-hairline/10 overflow-x-auto select-none">
        {(['summary', 'transcript', 'sentiment', 'emotions'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 border-b-2 text-sm font-semibold transition-all capitalize whitespace-nowrap",
              activeTab === tab
                ? "border-indigo-500 text-indigo-400 font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="w-full">
        {/* Tab 1: Summary */}
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-soft">Language Detected:</span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
                <Globe className="h-3 w-3" />
                {formatLanguage(result.detected_language)}
              </span>
            </div>

            <div className="flex flex-col gap-6">
              {/* English Summary */}
              <div className="glass-card border border-hairline/10 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-hairline/10 pb-3">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-ink">English Summary</h3>
                </div>
                <Prose text={result.summary_en} empty="No summary generated." />
              </div>

              {/* Original Summary if different */}
              {result.detected_language &&
                result.detected_language !== 'en' &&
                result.summary_original &&
                result.summary_original !== result.summary_en && (
                  <div className="glass-card border border-hairline/10 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-hairline/10 pb-3">
                      <Globe className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-ink">
                        Summary in {formatLanguage(result.detected_language)}
                      </h3>
                    </div>
                    <Prose
                      text={result.summary_original}
                      empty="No original language summary generated."
                    />
                  </div>
                )}
            </div>

            {/* Downloads */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => downloadTextFile(result.transcript, 'transcript.txt')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 border border-indigo-600 text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>Download Transcript</span>
              </button>
              <button
                onClick={() => downloadTextFile(result.summary_en, 'summary.txt')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-hairline/10 hover:bg-hairline/15 border border-hairline/15 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Download Summary</span>
              </button>
              <button
                onClick={handleDownloadAudioSummary}
                disabled={isGeneratingAudio}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-hairline/10 hover:bg-hairline/15 border border-hairline/15 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isGeneratingAudio ? (
                  <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4 text-indigo-400" />
                )}
                <span>{isGeneratingAudio ? 'Generating audio…' : 'Download Audio Summary'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Transcript */}
        {activeTab === 'transcript' && (
          <div className="flex flex-col gap-6">
            <div className="glass-card border border-hairline/10 rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-ink">Original Transcript</h3>
              <div className="rounded-xl bg-inset/60 border border-hairline/10 p-4">
                <Prose
                  text={result.transcript}
                  empty="No transcript available."
                  className="max-h-[34rem]"
                />
              </div>
              <span className="text-xs text-ink-faint self-end font-semibold">
                {(result.transcript?.length || 0).toLocaleString()} characters
              </span>
            </div>

            {result.detected_language &&
              result.detected_language !== 'en' &&
              result.translated_transcript &&
              result.translated_transcript !== result.transcript && (
                <div className="glass-card border border-hairline/10 rounded-2xl p-6 flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-ink">English Translation</h3>
                  <div className="rounded-xl bg-inset/60 border border-hairline/10 p-4">
                    <Prose
                      text={result.translated_transcript}
                      empty="No translation available."
                      className="max-h-[34rem]"
                    />
                  </div>
                  <span className="text-xs text-ink-faint self-end font-semibold">
                    {(result.translated_transcript?.length || 0).toLocaleString()} characters
                  </span>
                </div>
              )}
          </div>
        )}

        {/* Tab 3: Sentiment */}
        {activeTab === 'sentiment' && (
          <div className="flex justify-center py-6">
            <div className="glass-card border border-hairline/10 rounded-2xl p-8 max-w-lg w-full flex flex-col items-center gap-6 text-center">
              <div className="p-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-ink-soft text-xs uppercase tracking-wider font-semibold">
                  Overall Sentiment
                </h3>
                <p
                  className={cn(
                    "text-3xl font-black mt-2 tracking-tight",
                    result.sentiment?.label.toUpperCase() === 'POSITIVE'
                      ? "text-emerald-400"
                      : "text-rose-400"
                  )}
                >
                  {result.sentiment?.label || "NEUTRAL"}
                </p>
              </div>

              {/* Progress Bar */}
              {result.sentiment && (
                <div className="w-full flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-ink-soft">
                    <span>Confidence</span>
                    <span>{formatPercent(result.sentiment.score)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-hairline/10 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        result.sentiment.label.toUpperCase() === 'POSITIVE'
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      )}
                      style={{ 
                        width: `${
                          result.sentiment.score > 1 
                            ? result.sentiment.score 
                            : result.sentiment.score * 100
                        }%` 
                      }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-ink-faint max-w-sm mt-2 leading-relaxed">
                Aggregated across chunks of the transcript.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Emotions */}
        {activeTab === 'emotions' && (
          <div className="flex flex-col gap-6">
            {/* Emotion Chart */}
            <EmotionChart emotions={result.emotions} />

            {/* Chunk Breakdown Table */}
            <div className="glass-card border border-hairline/10 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Per-Chunk Breakdown</h3>
                  <p className="text-xs text-ink-soft mt-1">Detailed emotion predictions for transcript intervals.</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-hairline/10 border border-hairline/10 text-[10px] text-ink-soft font-semibold uppercase tracking-wider">
                  <PieChart className="h-3 w-3 text-indigo-400" />
                  <span>{chunkRows.length} Chunks</span>
                </div>
              </div>

              {chunkRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm text-ink-soft">
                    <thead>
                      <tr className="border-b border-hairline/10 text-xs text-ink-faint font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Chunk</th>
                        <th className="py-3 px-4">Top Emotion</th>
                        <th className="py-3 px-4">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/10">
                      {paginatedChunks.map((row, idx) => (
                        <tr key={idx} className="hover:bg-hairline/10 transition-colors">
                          <td className="py-3 px-4 font-semibold text-ink">{row.chunk}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-hairline/10 text-xs font-semibold text-ink-soft capitalize border border-hairline/10">
                              {row.emotion}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-ink-soft">
                            {formatPercent(row.score)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-ink-faint text-xs">
                  No breakdown data available.
                </div>
              )}

              {/* Pagination controls */}
              {totalEmotionPages > 1 && (
                <div className="flex items-center justify-between border-t border-hairline/10 pt-4 mt-2">
                  <span className="text-xs text-ink-faint">
                    Page {emotionPage} of {totalEmotionPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmotionPage((p) => Math.max(1, p - 1))}
                      disabled={emotionPage === 1}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border border-hairline/10 hover:bg-hairline/10 transition-all select-none",
                        emotionPage === 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setEmotionPage((p) => Math.min(totalEmotionPages, p + 1))}
                      disabled={emotionPage === totalEmotionPages}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border border-hairline/10 hover:bg-hairline/10 transition-all select-none",
                        emotionPage === totalEmotionPages ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

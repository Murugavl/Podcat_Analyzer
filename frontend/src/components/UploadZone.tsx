import React, { useState, useRef } from 'react';
import { Upload, FileAudio, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadZoneProps {
  file: File | null;
  setFile: (file: File | null) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export function UploadZone({ file, setFile, onAnalyze, isLoading }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = ['mp3', 'wav', 'm4a', 'flac'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext && validExtensions.includes(ext)) {
      setFile(selectedFile);
    }
  };

  const triggerFileInput = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isOverSizeLimit = file && file.size > 100 * 1024 * 1024; // 100MB

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={cn(
          "w-full h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 p-6 relative select-none",
          isDragActive ? "border-indigo-500 drag-active bg-indigo-500/5" : "border-hairline/15 hover:border-indigo-500/50 bg-hairline/10",
          isLoading && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.flac"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />

        {file ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileAudio className="h-10 w-10 animate-pulse" />
            </div>
            <div className="max-w-md">
              <p className="text-base font-semibold truncate px-2 text-ink max-w-[280px] sm:max-w-sm">{file.name}</p>
              <p className="text-xs text-ink-soft mt-1">{formatBytes(file.size)}</p>
            </div>
            {isOverSizeLimit && (
              <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 text-xs mt-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Warning: File exceeds recommended 100MB limit</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-4 rounded-full bg-hairline/10 text-ink-soft border border-hairline/10">
              <Upload className="h-10 w-10" />
            </div>
            <div>
              <p className="text-base font-semibold text-ink">Drag & drop your audio file</p>
              <p className="text-xs text-ink-soft mt-1">or click to browse from your computer</p>
            </div>
            <p className="text-[10px] text-ink-faint mt-4 uppercase tracking-wider font-semibold">
              Supported formats: MP3, WAV, M4A, FLAC (Max 100MB)
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onAnalyze}
        disabled={!file || isLoading}
        className={cn(
          "w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] select-none",
          file && !isLoading
            ? "bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
            : "bg-inset text-ink-faint cursor-not-allowed border border-hairline/10"
        )}
      >
        {isLoading ? "Analyzing…" : "Analyze"}
      </button>
    </div>
  );
}

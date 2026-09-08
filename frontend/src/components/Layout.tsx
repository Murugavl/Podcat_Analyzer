import React from 'react';
import { History } from 'lucide-react';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  onHistoryClick: () => void;
}

export function Layout({ children, onHistoryClick }: LayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full glass-card border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Logo className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              Echoscribe
            </span>
          </div>

          <button
            onClick={onHistoryClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
          >
            <History className="h-4 w-4 text-zinc-400" />
            <span>History</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-10 flex flex-col justify-start">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-zinc-500">
        <p>© 2026 Echoscribe · Designed &amp; developed by Murugavel V</p>
      </footer>
    </div>
  );
}

import React from 'react';
import { History, Moon, Sun } from 'lucide-react';
import { Logo } from './Logo';
import { Footer } from './Footer';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
  onHistoryClick: () => void;
}

export function Layout({ children, onHistoryClick }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full glass-card border-b border-hairline/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Logo className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-ink">
              Echoscribe
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onHistoryClick}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-hairline/10 hover:bg-hairline/15 border border-hairline/15 text-sm font-medium transition-colors"
            >
              <History className="h-4 w-4 text-ink-soft" />
              <span>History</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-hairline/10 hover:bg-hairline/15 border border-hairline/15 text-ink-soft hover:text-ink transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-10 flex flex-col justify-start">
        {children}
      </main>

      <Footer />
    </div>
  );
}

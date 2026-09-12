import { Github } from 'lucide-react';
import { Logo } from './Logo';

const REPO_URL = 'https://github.com/Murugavl/Podcat_Analyzer';

export function Footer() {
  return (
    <footer className="border-t border-hairline/10">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Logo className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight text-ink">Echoscribe</span>
          </div>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="p-2 rounded-lg text-ink-soft hover:text-ink hover:bg-hairline/10 transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-hairline/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-faint">
          <p>© {new Date().getFullYear()} Echoscribe</p>
          <p>
            Designed &amp; developed by{' '}
            <a
              href="https://github.com/Murugavl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink-soft hover:text-ink transition-colors"
            >
              Murugavel&nbsp;V
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

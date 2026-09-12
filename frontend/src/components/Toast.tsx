import { motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { ToastMessage } from '../hooks/useToast';
import { cn } from '../lib/utils';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    info: <Info className="h-5 w-5 text-indigo-400" />,
  };

  const borders = {
    success: 'border-emerald-500/20 bg-emerald-950/20',
    error: 'border-rose-500/20 bg-rose-950/20',
    warning: 'border-amber-500/20 bg-amber-950/20',
    info: 'border-indigo-500/20 bg-indigo-950/20',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={cn(
        "glass-card flex w-full max-w-sm gap-3 rounded-2xl border p-4 shadow-xl pointer-events-auto",
        borders[toast.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-semibold text-ink">{toast.title}</h4>
        {toast.message && (
          <p className="mt-1 text-xs text-ink-soft leading-relaxed break-words">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 self-start text-ink-soft hover:text-ink transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

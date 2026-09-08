import { Loader2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProgressStepsProps {
  currentStep: number;
}

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  const steps = [
    { label: 'Transcribing audio' },
    { label: 'Translating to English' },
    { label: 'Summarizing content' },
    { label: 'Translating summary back' },
    { label: 'Analyzing sentiment' },
    { label: 'Detecting emotions' },
  ];

  return (
    <div className="glass-card border border-white/5 rounded-2xl p-6 w-full flex flex-col gap-6">
      <div>
        <h3 className="text-base font-bold text-white">Processing</h3>
        <p className="text-xs text-zinc-400 mt-1">This usually takes a minute or two, depending on the file.</p>
      </div>

      <div className="relative flex flex-col gap-6 pl-2">
        {/* Progress Line */}
        <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-zinc-800" />
        <div 
          className="absolute left-[15px] top-3 w-0.5 bg-indigo-500 transition-all duration-500" 
          style={{ 
            height: `${Math.min((currentStep / (steps.length - 1)) * 100, 100)}%`, 
            maxHeight: 'calc(100% - 24px)' 
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isUpcoming = idx > currentStep;

          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-4 transition-all duration-300 relative z-10",
                isUpcoming ? "opacity-40" : "opacity-100"
              )}
            >
              {/* Stepper Dot */}
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center border text-xs transition-all duration-300 font-semibold flex-shrink-0",
                  isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                  isCurrent && "bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]",
                  isUpcoming && "bg-zinc-900 border-zinc-800 text-zinc-500"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Stepper Description */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-indigo-400 font-semibold" : "text-zinc-200"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

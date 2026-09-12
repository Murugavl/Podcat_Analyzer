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
    <div className="glass-card border border-hairline/10 rounded-2xl p-6 w-full flex flex-col gap-6">
      <div>
        <h3 className="text-base font-bold text-ink">Processing</h3>
        <p className="text-xs text-ink-soft mt-1">This usually takes a minute or two, depending on the file.</p>
      </div>

      <div className="relative flex flex-col gap-6">
        {/* Connector track + fill. The dots are 2rem wide, so their centres
            sit at x = 1rem; top-4 / bottom-4 clamp the line to the first and
            last dot centres. */}
        <div className="absolute left-4 top-4 bottom-4 w-px -translate-x-1/2 bg-hairline/15" />
        <div
          className="absolute left-4 top-4 w-px -translate-x-1/2 bg-indigo-500 transition-all duration-500"
          style={{
            height: `calc((100% - 2rem) * ${Math.min(
              Math.max(currentStep / (steps.length - 1), 0),
              1
            )})`,
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
                  isUpcoming && "bg-inset border-hairline/10 text-ink-faint"
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
                    isCurrent ? "text-indigo-400 font-semibold" : "text-ink-soft"
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

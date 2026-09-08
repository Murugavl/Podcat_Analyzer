interface LogoProps {
  className?: string;
}

// Simple audio-waveform mark. Uses currentColor so it picks up the
// surrounding text colour.
export function Logo({ className }: LogoProps) {
  const bars = [
    { x: 2, h: 7 },
    { x: 6, h: 15 },
    { x: 10, h: 10 },
    { x: 14, h: 19 },
    { x: 18, h: 6 },
    { x: 22, h: 12 },
  ];

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      {bars.map((b) => (
        <line key={b.x} x1={b.x} y1={12 - b.h / 2} x2={b.x} y2={12 + b.h / 2} />
      ))}
    </svg>
  );
}

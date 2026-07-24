interface ProgressBarProps {
  progress: number;
}

/** A filling gradient bar + percentage in the app's primary color. Plain
 * React state in, plain inline style out — safe to be this simple now that
 * the actual background-removal work runs in a Worker, off the main thread. */
export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div className="w-full max-w-xs">
      <div className="h-3 w-full overflow-hidden rounded-full bg-primary-disabled">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%`, background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-active))" }}
        />
      </div>
      <p className="mt-1.5 text-center text-[13px] font-semibold text-ink">{Math.round(clamped)}%</p>
    </div>
  );
}

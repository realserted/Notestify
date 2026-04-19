interface ProgressBarProps {
  progress: number | null;
  label?: string;
}

export const ProgressBar = ({ progress, label }: ProgressBarProps) => {
  const isIndeterminate = progress === null;
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-ink-500 dark:text-cream-50/60">
          <span>{label}</span>
          {!isIndeterminate && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-cream-100 dark:bg-ink-700/60">
        {isIndeterminate ? (
          <div
            className="absolute h-full w-1/3 rounded-full bg-coral-500"
            style={{ animation: 'progress-indeterminate 1.5s ease-in-out infinite' }}
          />
        ) : (
          <div
            className="h-full rounded-full bg-coral-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
};

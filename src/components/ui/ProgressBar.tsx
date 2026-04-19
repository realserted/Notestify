interface ProgressBarProps {
  progress: number | null;
  label?: string;
}

export const ProgressBar = ({ progress, label }: ProgressBarProps) => {
  const isIndeterminate = progress === null;
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>{label}</span>
          {!isIndeterminate && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        {isIndeterminate ? (
          <div
            className="absolute h-full w-1/3 rounded-full bg-indigo-600 dark:bg-indigo-500"
            style={{ animation: 'progress-indeterminate 1.5s ease-in-out infinite' }}
          />
        ) : (
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-150 dark:bg-indigo-500"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
};

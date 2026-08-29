interface ProgressBarProps {
  progress: number | null;
  label?: string;
}

export const ProgressBar = ({ progress, label }: ProgressBarProps) => {
  const isIndeterminate = progress === null;
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between text-xs font-bold text-bark-500 dark:text-bark-300">
          <span>{label}</span>
          {!isIndeterminate && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="relative h-3.5 w-full overflow-hidden rounded-full border-2 border-espresso-700 bg-paper-200 dark:border-night-600 dark:bg-night-700">
        {isIndeterminate ? (
          <div
            className="absolute h-full w-1/3 bg-citrus-500"
            style={{ animation: 'progress-indeterminate 1.5s ease-in-out infinite' }}
          />
        ) : (
          <div
            className="h-full bg-citrus-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
};

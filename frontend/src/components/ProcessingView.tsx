import { Brain, Check, Cog, FileSearch, UploadCloud } from 'lucide-react';
import { JobStage } from '../types';

interface ProcessingViewProps {
  status: JobStage;
  progress: number;
  message: string;
  uploadProgress?: number | null;
}

const STEPS: { key: JobStage; label: string; icon: JSX.Element }[] = [
  { key: 'uploading', label: 'Uploading video', icon: <UploadCloud size={18} /> },
  { key: 'extracting', label: 'Extracting video', icon: <FileSearch size={18} /> },
  { key: 'analyzing', label: 'Analyzing content', icon: <Brain size={18} /> },
  { key: 'generating', label: 'Generating output', icon: <Cog size={18} /> },
];

const STEP_ORDER: JobStage[] = ['queued', 'uploading', 'extracting', 'analyzing', 'generating', 'completed'];

export function ProcessingView({ status, progress, message, uploadProgress }: ProcessingViewProps) {
  const currentIndex = STEP_ORDER.indexOf(status);

  return (
    <div className="card mx-auto max-w-2xl p-6 sm:p-10 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-brand-950" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin"
            style={{ animationDuration: '1.1s' }}
          />
          <Brain size={28} className="text-brand-600 dark:text-brand-400" />
        </div>

        <h2 className="font-display text-xl font-semibold text-slate-800 dark:text-slate-100">
          {message}
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          This usually takes anywhere from a few seconds to a couple of minutes depending on
          video length.
        </p>

        {/* Overall progress bar */}
        <div className="mt-6 w-full">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-mono text-slate-400">{progress}%</p>
        </div>

        {/* Upload progress (only relevant during file uploads) */}
        {status === 'uploading' && typeof uploadProgress === 'number' && uploadProgress < 100 && (
          <div className="mt-1 w-full">
            <p className="mb-1 text-left text-xs text-slate-400">
              Browser upload: {uploadProgress}%
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-accent-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stage stepper */}
      <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STEPS.map((step) => {
          const stepIndex = STEP_ORDER.indexOf(step.key);
          const isComplete = currentIndex > stepIndex || status === 'completed';
          const isActive = status === step.key;

          return (
            <li
              key={step.key}
              className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-colors duration-300 ${
                isActive
                  ? 'border-brand-300 bg-brand-50/70 dark:border-brand-700 dark:bg-brand-950/30'
                  : isComplete
                    ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  isActive
                    ? 'bg-brand-600 text-white animate-pulse-slow'
                    : isComplete
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {isComplete ? <Check size={16} strokeWidth={3} /> : step.icon}
              </span>
              <span
                className={`text-xs font-medium ${
                  isActive
                    ? 'text-brand-700 dark:text-brand-300'
                    : isComplete
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
